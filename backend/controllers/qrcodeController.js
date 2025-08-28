const pool = require('../config/database').pool;

// QR 코드로 상품 정보 조회
const getProductByQRCode = async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    if (!qrCode) {
      return res.status(400).json({
        success: false,
        error: 'QR 코드는 필수입니다'
      });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM qrcorddb WHERE qr_code = ?',
      [qrCode]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'QR 코드에 해당하는 상품을 찾을 수 없습니다'
      });
    }

    const product = rows[0];
    
    res.json({
      success: true,
      data: {
        product_name: product.product_name,
        quantity: product.quantity,
        weight: product.weight,
        size: product.size,
        description: product.description
      }
    });

  } catch (error) {
    console.error('QR 코드 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다'
    });
  }
};

// QR 코드 상품 등록
const createQRCodeProduct = async (req, res) => {
  try {
    const { qr_code, product_name, quantity, weight, size, description } = req.body;
    
    if (!qr_code || !product_name) {
      return res.status(400).json({
        success: false,
        error: 'QR 코드와 상품명은 필수입니다'
      });
    }

    const [result] = await pool.execute(`
      INSERT INTO qrcorddb (qr_code, product_name, quantity, weight, size, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [qr_code, product_name, quantity || 1, weight, size, description]);

    res.status(201).json({
      success: true,
      message: 'QR 코드 상품이 등록되었습니다',
      data: { id: result.insertId }
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: '이미 등록된 QR 코드입니다'
      });
    }
    
    console.error('QR 코드 등록 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다'
    });
  }
};

// 모든 QR 코드 상품 목록 조회
const getAllQRCodeProducts = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM qrcorddb ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('QR 코드 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다'
    });
  }
};

module.exports = {
  getProductByQRCode,
  createQRCodeProduct,
  getAllQRCodeProducts
};