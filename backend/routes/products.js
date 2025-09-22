const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { executeWithRetry, pool } = require('../config/database');

// PlanetScale DDL 제한으로 인해 기존 컬럼 활용
// memo 필드에 JSON 형태로 추가 정보 저장
console.log('[Products] 기존 스키마를 활용하여 API 제공');

// 상품 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('[Products API] 상품 목록 조회 요청:', { page, limit, search });
    
    // 기존 products 테이블 구조 사용 (별도 테이블 생성 불필요)

    // 검색 조건 구성
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    
    if (search) {
      whereClause += ' AND (name LIKE ? OR memo LIKE ? OR maincode LIKE ? OR subcode LIKE ?)';
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // 전체 개수 조회
    const [countResult] = await executeWithRetry(() =>
      pool.execute(`SELECT COUNT(*) as total FROM products ${whereClause}`, queryParams)
    );
    const total = countResult[0].total;

    // 상품 목록 조회
    const [products] = await executeWithRetry(() =>
      pool.execute(`
        SELECT 
          id,
          user_id,
          maincode as code,
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
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [...queryParams, parseInt(limit), offset])
    );

    // memo 필드에서 JSON 데이터 파싱하여 추가 필드 추출
    const processedProducts = products.map(product => {
      try {
        const memoData = product.memo ? JSON.parse(product.memo) : {};
        return {
          ...product,
          category: memoData.category || '',
          description: memoData.description || '',
          partner_id: memoData.partner_id || null
        };
      } catch (error) {
        // JSON 파싱 실패 시 기본값 사용
        return {
          ...product,
          category: '',
          description: product.memo || '',
          partner_id: null
        };
      }
    });

    console.log(`[Products API] 상품 목록 조회 완료: ${products.length}개`);

    res.json({
      success: true,
      products: processedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('[Products API] 상품 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '상품 목록을 조회할 수 없습니다.',
      details: error.message
    });
  }
});

// 상품 상세 조회
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Products API] 상품 상세 조회 요청:', id);

    const [products] = await executeWithRetry(() =>
      pool.execute(`
        SELECT 
          id,
          user_id,
          maincode as code,
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
      `, [id])
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: '상품을 찾을 수 없습니다.'
      });
    }

    // memo 필드에서 JSON 데이터 파싱
    const product = products[0];
    try {
      const memoData = product.memo ? JSON.parse(product.memo) : {};
      const processedProduct = {
        ...product,
        category: memoData.category || '',
        description: memoData.description || '',
        partner_id: memoData.partner_id || null
      };
      
      console.log('[Products API] 상품 상세 조회 완료:', processedProduct.name);

      res.json({
        success: true,
        product: processedProduct
      });
      
    } catch (error) {
      // JSON 파싱 실패 시 기본값으로 처리
      const processedProduct = {
        ...product,
        category: '',
        description: product.memo || '',
        partner_id: null
      };
      
      console.log('[Products API] 상품 상세 조회 완료:', processedProduct.name);

      res.json({
        success: true,
        product: processedProduct
      });
    }

  } catch (error) {
    console.error('[Products API] 상품 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '상품 정보를 조회할 수 없습니다.',
      details: error.message
    });
  }
});

// 상품 생성
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      code,
      maincode,
      subcode,
      weight,
      size,
      category,
      description,
      cost1,
      cost2,
      memo,
      partner_id
    } = req.body;

    console.log('[Products API] 상품 생성 요청:', name);

    // 필수 필드 검증
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '상품명은 필수입니다.'
      });
    }

    // 추가 정보를 memo 필드에 JSON으로 저장
    const memoData = {
      category: category || '',
      description: description || '',
      partner_id: partner_id || null,
      original_memo: memo || ''
    };

    const [result] = await executeWithRetry(() =>
      pool.execute(`
        INSERT INTO products (
          user_id, name, maincode, subcode, weight, size, cost1, cost2, memo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [req.user.id, name, code || maincode, subcode, weight, size, cost1, cost2, JSON.stringify(memoData)])
    );

    console.log('[Products API] 상품 생성 완료:', result.insertId);

    res.status(201).json({
      success: true,
      message: '상품이 성공적으로 생성되었습니다.',
      productId: result.insertId
    });

  } catch (error) {
    console.error('[Products API] 상품 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '상품 생성에 실패했습니다.',
      details: error.message
    });
  }
});

// 상품 수정
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      maincode,
      subcode,
      weight,
      size,
      category,
      description,
      cost1,
      cost2,
      memo,
      partner_id
    } = req.body;

    console.log('[Products API] 상품 수정 요청:', id);

    // 상품 존재 확인
    const [existing] = await executeWithRetry(() =>
      pool.execute('SELECT id FROM products WHERE id = ?', [id])
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: '상품을 찾을 수 없습니다.'
      });
    }

    // 추가 정보를 memo 필드에 JSON으로 저장
    const memoData = {
      category: category || '',
      description: description || '',
      partner_id: partner_id || null,
      original_memo: memo || ''
    };

    await executeWithRetry(() =>
      pool.execute(`
        UPDATE products SET 
          name = ?, maincode = ?, subcode = ?, weight = ?, 
          size = ?, cost1 = ?, cost2 = ?, memo = ?
        WHERE id = ?
      `, [name, code || maincode, subcode, weight, size, cost1, cost2, JSON.stringify(memoData), id])
    );

    console.log('[Products API] 상품 수정 완료:', id);

    res.json({
      success: true,
      message: '상품이 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('[Products API] 상품 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '상품 수정에 실패했습니다.',
      details: error.message
    });
  }
});

// 상품 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Products API] 상품 삭제 요청:', id);

    // 상품 존재 확인
    const [existing] = await executeWithRetry(() =>
      pool.execute('SELECT id, name FROM products WHERE id = ?', [id])
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: '상품을 찾을 수 없습니다.'
      });
    }

    await executeWithRetry(() =>
      pool.execute('DELETE FROM products WHERE id = ?', [id])
    );

    console.log('[Products API] 상품 삭제 완료:', existing[0].name);

    res.json({
      success: true,
      message: '상품이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('[Products API] 상품 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '상품 삭제에 실패했습니다.',
      details: error.message
    });
  }
});

// 메인코드 목록 조회 (카테고리 대신)
router.get('/categories/list', authenticateToken, async (req, res) => {
  try {
    console.log('[Products API] 메인코드 목록 조회 요청');

    const [maincodes] = await executeWithRetry(() =>
      pool.execute(`
        SELECT DISTINCT maincode 
        FROM products 
        WHERE maincode IS NOT NULL AND maincode != ''
        ORDER BY maincode
      `)
    );

    console.log('[Products API] 메인코드 목록 조회 완료:', maincodes.length);

    res.json({
      success: true,
      categories: maincodes.map(row => row.maincode)
    });

  } catch (error) {
    console.error('[Products API] 메인코드 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '메인코드 목록을 조회할 수 없습니다.',
      details: error.message
    });
  }
});

module.exports = router;