const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pool = require('../db/connection');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// uploads 디렉토리 생성 (존재하지 않을 경우)
const createUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, '../uploads/delivery_photos');
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log('업로드 디렉토리 생성:', uploadsDir);
  }
};

// multer 설정 - 파일 저장 설정
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads/delivery_photos');
    await createUploadsDir();
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // 파일명: 배송번호_현재시간_원본파일명
    const trackingNumber = req.params.trackingNumber || 'unknown';
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const fileName = `${trackingNumber}_${timestamp}_${baseName}${ext}`;
    cb(null, fileName);
  }
});

// 파일 필터링 - 이미지만 허용
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
  }
};

// multer 인스턴스 생성
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
    files: 10 // 최대 10개 파일
  }
});

/**
 * POST /api/photos/upload/:trackingNumber
 * 배송번호에 대한 사진들을 업로드
 */
router.post('/upload/:trackingNumber', authenticateToken, upload.array('photos', 10), async (req, res) => {
  const { trackingNumber } = req.params;
  const uploadedFiles = req.files;

  console.log(`사진 업로드 요청 - 배송번호: ${trackingNumber}, 파일 개수: ${uploadedFiles?.length || 0}`);

  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({
      success: false,
      error: '업로드할 파일이 없습니다.'
    });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    
    // 트랜잭션 시작
    await connection.beginTransaction();

    const insertedPhotos = [];

    for (const file of uploadedFiles) {
      // 데이터베이스에 파일 정보 저장
      const insertSQL = `
        INSERT INTO delivery_photos (tracking_number, file_name, file_path, file_size, mime_type)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const relativePath = `uploads/delivery_photos/${file.filename}`;
      const [result] = await connection.execute(insertSQL, [
        trackingNumber,
        file.originalname,
        relativePath,
        file.size,
        file.mimetype
      ]);

      insertedPhotos.push({
        id: result.insertId,
        fileName: file.originalname,
        filePath: relativePath,
        fileSize: file.size,
        mimeType: file.mimetype
      });

      console.log(`파일 저장 완료: ${file.originalname} -> ${relativePath}`);
    }

    // 트랜잭션 커밋
    await connection.commit();

    res.json({
      success: true,
      message: `${uploadedFiles.length}개의 사진이 성공적으로 업로드되었습니다.`,
      data: {
        trackingNumber: trackingNumber,
        uploadedCount: uploadedFiles.length,
        photos: insertedPhotos
      }
    });

  } catch (error) {
    // 트랜잭션 롤백
    if (connection) {
      await connection.rollback();
    }

    console.error('사진 업로드 오류:', error);

    // 업로드된 파일들 삭제 (DB 저장 실패 시)
    if (uploadedFiles) {
      for (const file of uploadedFiles) {
        try {
          await fs.unlink(file.path);
          console.log('실패한 업로드 파일 삭제:', file.path);
        } catch (unlinkError) {
          console.error('파일 삭제 오류:', unlinkError);
        }
      }
    }

    res.status(500).json({
      success: false,
      error: '사진 업로드 중 오류가 발생했습니다.',
      details: error.message
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});

/**
 * GET /api/photos/:trackingNumber
 * 배송번호에 대한 사진 목록 조회
 */
router.get('/:trackingNumber', authenticateToken, async (req, res) => {
  const { trackingNumber } = req.params;

  console.log(`사진 조회 요청 - 배송번호: ${trackingNumber}`);

  let connection;
  try {
    connection = await pool.getConnection();

    const selectSQL = `
      SELECT id, file_name, file_path, file_size, mime_type, upload_time
      FROM delivery_photos 
      WHERE tracking_number = ? 
      ORDER BY upload_time DESC
    `;

    const [rows] = await connection.execute(selectSQL, [trackingNumber]);

    // 파일 URL 생성 (실제 서버 도메인으로 교체 필요)
    const photosWithUrls = rows.map(photo => ({
      ...photo,
      url: `${req.protocol}://${req.get('host')}/${photo.file_path.replace('uploads/', '')}`
    }));

    res.json({
      success: true,
      data: {
        trackingNumber: trackingNumber,
        photoCount: rows.length,
        photos: photosWithUrls
      }
    });

  } catch (error) {
    console.error('사진 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '사진 조회 중 오류가 발생했습니다.',
      details: error.message
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});

/**
 * DELETE /api/photos/:photoId
 * 특정 사진 삭제
 */
router.delete('/:photoId', authenticateToken, async (req, res) => {
  const { photoId } = req.params;

  console.log(`사진 삭제 요청 - 사진 ID: ${photoId}`);

  let connection;
  try {
    connection = await pool.getConnection();
    
    // 트랜잭션 시작
    await connection.beginTransaction();

    // 먼저 파일 정보 조회
    const selectSQL = 'SELECT file_path FROM delivery_photos WHERE id = ?';
    const [rows] = await connection.execute(selectSQL, [photoId]);

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: '삭제할 사진을 찾을 수 없습니다.'
      });
    }

    const filePath = path.join(__dirname, '..', rows[0].file_path);

    // 데이터베이스에서 삭제
    const deleteSQL = 'DELETE FROM delivery_photos WHERE id = ?';
    await connection.execute(deleteSQL, [photoId]);

    // 실제 파일 삭제
    try {
      await fs.unlink(filePath);
      console.log('파일 삭제 완료:', filePath);
    } catch (fileError) {
      console.error('파일 삭제 실패 (DB는 삭제됨):', fileError.message);
    }

    // 트랜잭션 커밋
    await connection.commit();

    res.json({
      success: true,
      message: '사진이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    // 트랜잭션 롤백
    if (connection) {
      await connection.rollback();
    }

    console.error('사진 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '사진 삭제 중 오류가 발생했습니다.',
      details: error.message
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;