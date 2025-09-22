const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { executeWithRetry, pool } = require('../config/database');

// 상품 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('[Products API] 상품 목록 조회 요청:', { page, limit, search });
    
    // products 테이블이 있는지 확인
    const [tables] = await executeWithRetry(() =>
      pool.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'products'
      `)
    );

    if (tables.length === 0) {
      // products 테이블이 없으면 생성
      await executeWithRetry(() =>
        pool.execute(`
          CREATE TABLE IF NOT EXISTS products (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            weight DECIMAL(10,2),
            dimensions VARCHAR(100),
            price DECIMAL(10,2),
            category VARCHAR(100),
            sku VARCHAR(100) UNIQUE,
            barcode VARCHAR(100),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by INT,
            INDEX idx_name (name),
            INDEX idx_category (category),
            INDEX idx_sku (sku),
            INDEX idx_active (is_active)
          )
        `)
      );
      console.log('[Products API] products 테이블 생성 완료');
    }

    // 검색 조건 구성
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    
    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ? OR sku LIKE ? OR barcode LIKE ?)';
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
          name,
          description,
          weight,
          dimensions,
          price,
          category,
          sku,
          barcode,
          is_active,
          created_at,
          updated_at
        FROM products 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [...queryParams, parseInt(limit), offset])
    );

    console.log(`[Products API] 상품 목록 조회 완료: ${products.length}개`);

    res.json({
      success: true,
      products: products,
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
          name,
          description,
          weight,
          dimensions,
          price,
          category,
          sku,
          barcode,
          is_active,
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

    console.log('[Products API] 상품 상세 조회 완료:', products[0].name);

    res.json({
      success: true,
      product: products[0]
    });

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
      description,
      weight,
      dimensions,
      price,
      category,
      sku,
      barcode
    } = req.body;

    console.log('[Products API] 상품 생성 요청:', name);

    // 필수 필드 검증
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '상품명은 필수입니다.'
      });
    }

    // SKU 중복 확인
    if (sku) {
      const [existing] = await executeWithRetry(() =>
        pool.execute('SELECT id FROM products WHERE sku = ?', [sku])
      );
      
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: '이미 존재하는 SKU입니다.'
        });
      }
    }

    const [result] = await executeWithRetry(() =>
      pool.execute(`
        INSERT INTO products (
          name, description, weight, dimensions, price, category, sku, barcode, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [name, description, weight, dimensions, price, category, sku, barcode, req.user.id])
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
      description,
      weight,
      dimensions,
      price,
      category,
      sku,
      barcode,
      is_active
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

    // SKU 중복 확인 (자기 자신 제외)
    if (sku) {
      const [duplicate] = await executeWithRetry(() =>
        pool.execute('SELECT id FROM products WHERE sku = ? AND id != ?', [sku, id])
      );
      
      if (duplicate.length > 0) {
        return res.status(400).json({
          success: false,
          error: '이미 존재하는 SKU입니다.'
        });
      }
    }

    await executeWithRetry(() =>
      pool.execute(`
        UPDATE products SET 
          name = ?, description = ?, weight = ?, dimensions = ?, 
          price = ?, category = ?, sku = ?, barcode = ?, is_active = ?
        WHERE id = ?
      `, [name, description, weight, dimensions, price, category, sku, barcode, is_active, id])
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

// 카테고리 목록 조회
router.get('/categories/list', authenticateToken, async (req, res) => {
  try {
    console.log('[Products API] 카테고리 목록 조회 요청');

    const [categories] = await executeWithRetry(() =>
      pool.execute(`
        SELECT DISTINCT category 
        FROM products 
        WHERE category IS NOT NULL AND category != ''
        ORDER BY category
      `)
    );

    console.log('[Products API] 카테고리 목록 조회 완료:', categories.length);

    res.json({
      success: true,
      categories: categories.map(row => row.category)
    });

  } catch (error) {
    console.error('[Products API] 카테고리 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '카테고리 목록을 조회할 수 없습니다.',
      details: error.message
    });
  }
});

module.exports = router;