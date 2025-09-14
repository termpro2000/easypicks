const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 재시도 로직을 위한 헬퍼 함수
const executeWithRetry = async (query, params = [], maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const [result] = await pool.execute(query, params);
      return result;
    } catch (error) {
      console.error(`데이터베이스 쿼리 시도 ${attempt}/${maxRetries} 실패:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 재시도 전 대기 시간 (지수 백오프)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

// Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/product-photos');
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // 파일명: timestamp_productId_originalname
    const timestamp = Date.now();
    const productId = req.body.product_id || 'temp';
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${timestamp}_${productId}_${name}${ext}`);
  }
});

// 파일 필터 (이미지만 허용)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  }
});

// 상품 사진 업로드
const uploadProductPhoto = async (req, res) => {
  try {
    const user = req.user || req.session?.user;
    const { product_id } = req.body;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    if (!product_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '상품 ID가 필요합니다.'
      });
    }

    // 상품 소유권 확인
    const productCheck = await executeWithRetry(
      'SELECT id FROM products WHERE id = ? AND user_id = ?',
      [product_id, user.id]
    );

    if (productCheck.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '상품을 찾을 수 없거나 접근 권한이 없습니다.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '업로드할 파일이 없습니다.'
      });
    }

    const file = req.file;
    const filePath = path.relative(path.join(__dirname, '..'), file.path);

    // 데이터베이스에 사진 정보 저장
    const query = `
      INSERT INTO product_photo (
        product_id, user_id, filename, original_name, file_path, file_size, mime_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      product_id,
      user.id,
      file.filename,
      file.originalname,
      filePath,
      file.size,
      file.mimetype
    ];

    const result = await executeWithRetry(query, values);

    console.log(`[상품 사진 업로드] 완료 - 사진 ID: ${result.insertId}, 상품 ID: ${product_id}`);

    res.status(201).json({
      success: true,
      message: '사진이 성공적으로 업로드되었습니다.',
      photo: {
        id: result.insertId,
        filename: file.filename,
        original_name: file.originalname,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.mimetype
      }
    });

  } catch (error) {
    console.error('상품 사진 업로드 오류:', error);
    
    // 에러 발생 시 업로드된 파일 삭제
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: '사진 업로드 중 오류가 발생했습니다.'
    });
  }
};

// 상품 사진 목록 조회
const getProductPhotos = async (req, res) => {
  try {
    const user = req.user || req.session?.user;
    const { product_id } = req.params;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    // 상품 소유권 확인
    let query = 'SELECT id FROM products WHERE id = ?';
    let params = [product_id];
    
    if (user.role === 'user') {
      query += ' AND user_id = ?';
      params.push(user.id);
    }

    const productCheck = await executeWithRetry(query, params);

    if (productCheck.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '상품을 찾을 수 없거나 접근 권한이 없습니다.'
      });
    }

    // 사진 목록 조회
    const photosQuery = `
      SELECT 
        id, filename, original_name, file_path, file_size, 
        mime_type, upload_date, created_at
      FROM product_photo 
      WHERE product_id = ?
      ORDER BY created_at DESC
    `;

    const photos = await executeWithRetry(photosQuery, [product_id]);

    res.json({
      success: true,
      photos: photos
    });

  } catch (error) {
    console.error('상품 사진 목록 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사진 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
};

// 상품 사진 삭제
const deleteProductPhoto = async (req, res) => {
  try {
    const user = req.user || req.session?.user;
    const { photo_id } = req.params;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    // 사진 정보 조회 및 권한 확인
    let query = `
      SELECT pp.*, p.user_id as product_user_id
      FROM product_photo pp
      JOIN products p ON pp.product_id = p.id
      WHERE pp.id = ?
    `;
    
    if (user.role === 'user') {
      query += ' AND p.user_id = ?';
    }

    const params = user.role === 'user' ? [photo_id, user.id] : [photo_id];
    const photoData = await executeWithRetry(query, params);

    if (photoData.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '사진을 찾을 수 없거나 삭제 권한이 없습니다.'
      });
    }

    const photo = photoData[0];

    // 데이터베이스에서 삭제
    await executeWithRetry('DELETE FROM product_photo WHERE id = ?', [photo_id]);

    // 파일 시스템에서 삭제
    const fullPath = path.join(__dirname, '..', photo.file_path);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    console.log(`[상품 사진 삭제] 완료 - 사진 ID: ${photo_id}`);

    res.json({
      success: true,
      message: '사진이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('상품 사진 삭제 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사진 삭제 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  upload,
  uploadProductPhoto,
  getProductPhotos,
  deleteProductPhoto
};