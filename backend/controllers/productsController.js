const { pool } = require('../config/database');

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

// 모든 상품 조회 (사용자별 필터링)
const getAllProducts = async (req, res) => {
  try {
    console.log('[상품 목록 조회] 시작');
    const user = req.user || req.session?.user;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    let query;
    let params = [];

    // user 권한인 경우 본인이 등록한 상품만 조회
    if (user.role === 'user') {
      query = `
        SELECT 
          id,
          user_id,
          maincode,
          subcode,
          name,
          weight,
          size,
          cost1,
          cost2,
          memo,
          created_at,
          updated_at
        FROM products 
        WHERE user_id = ?
        ORDER BY created_at DESC
      `;
      params = [user.id];
      console.log(`[상품 목록 조회] 사용자 ID ${user.id}의 상품만 조회`);
    } else {
      // 관리자/매니저는 모든 상품 조회
      query = `
        SELECT 
          id,
          user_id,
          maincode,
          subcode,
          name,
          weight,
          size,
          cost1,
          cost2,
          memo,
          created_at,
          updated_at
        FROM products 
        ORDER BY created_at DESC
      `;
      console.log(`[상품 목록 조회] 관리자 권한으로 모든 상품 조회`);
    }

    const products = await executeWithRetry(query, params);
    
    console.log(`[상품 목록 조회] ${products.length}개 조회 완료`);
    
    res.json({
      success: true,
      products: products,
      total: products.length
    });

  } catch (error) {
    console.error('상품 목록 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '상품 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
};

// 특정 상품 조회 (사용자별 권한 확인)
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || req.session?.user;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    console.log(`[상품 상세 조회] ID: ${id}, 사용자: ${user.id}`);

    let query;
    let params;

    // user 권한인 경우 본인이 등록한 상품만 조회
    if (user.role === 'user') {
      query = `
        SELECT 
          id,
          user_id,
          maincode,
          subcode,
          name,
          weight,
          size,
          cost1,
          cost2,
          memo,
          created_at,
          updated_at
        FROM products 
        WHERE id = ? AND user_id = ?
      `;
      params = [id, user.id];
    } else {
      // 관리자/매니저는 모든 상품 조회 가능
      query = `
        SELECT 
          id,
          user_id,
          maincode,
          subcode,
          name,
          weight,
          size,
          cost1,
          cost2,
          memo,
          created_at,
          updated_at
        FROM products 
        WHERE id = ?
      `;
      params = [id];
    }

    const products = await executeWithRetry(query, params);
    
    if (products.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '상품을 찾을 수 없거나 접근 권한이 없습니다.'
      });
    }

    console.log(`[상품 상세 조회] 완료`);
    
    res.json({
      success: true,
      product: products[0]
    });

  } catch (error) {
    console.error('상품 상세 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '상품 정보를 불러오는 중 오류가 발생했습니다.'
    });
  }
};

// 새 상품 생성 (현재 로그인한 사용자로 자동 설정)
const createProduct = async (req, res) => {
  try {
    const user = req.user || req.session?.user;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    console.log('[상품 생성] 요청 수신');
    console.log('요청 데이터:', req.body);
    console.log('현재 사용자:', user.id);

    const {
      maincode,
      subcode,
      name,
      weight,
      size,
      cost1,
      cost2,
      memo
    } = req.body;

    // 필수 필드 검증
    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '상품명은 필수입니다.'
      });
    }

    const query = `
      INSERT INTO products (
        user_id, maincode, subcode, name, weight, size, cost1, cost2, memo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      user.id, // 현재 로그인한 사용자 ID로 자동 설정
      maincode || null,
      subcode || null,
      name,
      weight ? parseFloat(weight) : null,
      size || null,
      cost1 ? parseFloat(cost1) : null,
      cost2 ? parseFloat(cost2) : null,
      memo || null
    ];

    const result = await executeWithRetry(query, values);
    
    console.log(`[상품 생성] 완료 - ID: ${result.insertId}, 사용자: ${user.id}`);
    
    res.status(201).json({
      success: true,
      message: '상품이 성공적으로 생성되었습니다.',
      productId: result.insertId
    });

  } catch (error) {
    console.error('상품 생성 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '상품 생성 중 오류가 발생했습니다.'
    });
  }
};

// 상품 수정 (사용자 권한 확인)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || req.session?.user;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    console.log(`[상품 수정] ID: ${id}, 사용자: ${user.id}`);
    console.log('수정 데이터:', req.body);

    const {
      maincode,
      subcode,
      name,
      weight,
      size,
      cost1,
      cost2,
      memo
    } = req.body;

    let checkQuery;
    let checkParams;

    // user 권한인 경우 본인이 등록한 상품만 수정 가능
    if (user.role === 'user') {
      checkQuery = 'SELECT id FROM products WHERE id = ? AND user_id = ?';
      checkParams = [id, user.id];
    } else {
      // 관리자/매니저는 모든 상품 수정 가능
      checkQuery = 'SELECT id FROM products WHERE id = ?';
      checkParams = [id];
    }

    // 상품 존재 여부 및 권한 확인
    const existingProducts = await executeWithRetry(checkQuery, checkParams);
    
    if (existingProducts.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '수정할 상품을 찾을 수 없거나 수정 권한이 없습니다.'
      });
    }

    const query = `
      UPDATE products SET
        maincode = ?,
        subcode = ?,
        name = ?,
        weight = ?,
        size = ?,
        cost1 = ?,
        cost2 = ?,
        memo = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      maincode || null,
      subcode || null,
      name,
      weight ? parseFloat(weight) : null,
      size || null,
      cost1 ? parseFloat(cost1) : null,
      cost2 ? parseFloat(cost2) : null,
      memo || null,
      id
    ];

    await executeWithRetry(query, values);
    
    console.log(`[상품 수정] 완료`);
    
    res.json({
      success: true,
      message: '상품이 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('상품 수정 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '상품 수정 중 오류가 발생했습니다.'
    });
  }
};

// 상품 삭제 (사용자 권한 확인)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user || req.session?.user;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    console.log(`[상품 삭제] ID: ${id}, 사용자: ${user.id}`);

    let checkQuery;
    let checkParams;

    // user 권한인 경우 본인이 등록한 상품만 삭제 가능
    if (user.role === 'user') {
      checkQuery = 'SELECT id FROM products WHERE id = ? AND user_id = ?';
      checkParams = [id, user.id];
    } else {
      // 관리자/매니저는 모든 상품 삭제 가능
      checkQuery = 'SELECT id FROM products WHERE id = ?';
      checkParams = [id];
    }

    // 상품 존재 여부 및 권한 확인
    const existingProducts = await executeWithRetry(checkQuery, checkParams);
    
    if (existingProducts.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '삭제할 상품을 찾을 수 없거나 삭제 권한이 없습니다.'
      });
    }

    const query = 'DELETE FROM products WHERE id = ?';
    await executeWithRetry(query, [id]);
    
    console.log(`[상품 삭제] 완료`);
    
    res.json({
      success: true,
      message: '상품이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('상품 삭제 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '상품 삭제 중 오류가 발생했습니다.'
    });
  }
};

// 상품 검색
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    const user = req.user || req.session?.user;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    console.log(`[상품 검색] 검색어: ${q}, 사용자: ${user.id}`);

    if (!q) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '검색어를 입력해주세요.'
      });
    }

    let query;
    let params;

    // user 권한인 경우 본인이 등록한 상품만 검색
    if (user.role === 'user') {
      query = `
        SELECT 
          id,
          user_id,
          maincode,
          subcode,
          name,
          weight,
          size,
          cost1,
          cost2,
          memo,
          created_at,
          updated_at
        FROM products 
        WHERE (name LIKE ? OR memo LIKE ?) AND user_id = ?
        ORDER BY created_at DESC
      `;
      const searchTerm = `%${q}%`;
      params = [searchTerm, searchTerm, user.id];
    } else {
      // 관리자/매니저는 모든 상품 검색 가능
      query = `
        SELECT 
          id,
          user_id,
          maincode,
          subcode,
          name,
          weight,
          size,
          cost1,
          cost2,
          memo,
          created_at,
          updated_at
        FROM products 
        WHERE name LIKE ? OR memo LIKE ?
        ORDER BY created_at DESC
      `;
      const searchTerm = `%${q}%`;
      params = [searchTerm, searchTerm];
    }

    const products = await executeWithRetry(query, params);
    
    console.log(`[상품 검색] ${products.length}개 검색 완료`);
    
    res.json({
      success: true,
      products: products,
      total: products.length,
      searchTerm: q
    });

  } catch (error) {
    console.error('상품 검색 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '상품 검색 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts
};