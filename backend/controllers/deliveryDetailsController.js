const { pool } = require('../config/database');

/**
 * 특정 배송의 상세 정보 조회
 */
const getDeliveryDetails = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    console.log('📋 [getDeliveryDetails] 배송 상세 정보 조회:', deliveryId);

    // delivery_details 테이블에서 해당 배송의 상세 정보 조회
    const [details] = await pool.execute(`
      SELECT 
        id,
        delivery_id,
        detail_type,
        detail_value,
        created_at,
        updated_at
      FROM delivery_details 
      WHERE delivery_id = ?
      ORDER BY created_at ASC
    `, [deliveryId]);

    console.log(`✅ [getDeliveryDetails] 상세 정보 조회 완료: ${details.length}건`);

    // detail_value가 JSON 문자열인 경우 파싱
    const parsedDetails = details.map(detail => {
      let parsedValue = detail.detail_value;
      
      // JSON 문자열인지 확인하고 파싱 시도
      if (typeof detail.detail_value === 'string' && 
          (detail.detail_value.startsWith('{') || detail.detail_value.startsWith('['))) {
        try {
          parsedValue = JSON.parse(detail.detail_value);
        } catch (error) {
          console.warn('JSON 파싱 실패:', detail.id, error.message);
          // 파싱 실패 시 원본 문자열 사용
          parsedValue = detail.detail_value;
        }
      }

      return {
        ...detail,
        detail_value: parsedValue
      };
    });

    res.json({
      success: true,
      deliveryId: parseInt(deliveryId),
      count: parsedDetails.length,
      details: parsedDetails
    });

  } catch (error) {
    console.error('❌ [getDeliveryDetails] 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 상세 정보 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 특정 배송의 products 정보만 조회 (detail_type = 'products')
 */
const getDeliveryProducts = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    console.log('📦 [getDeliveryProducts] 배송 제품 정보 조회:', deliveryId);

    // products 타입의 상세 정보만 조회
    const [productDetails] = await pool.execute(`
      SELECT 
        id,
        delivery_id,
        detail_value,
        created_at,
        updated_at
      FROM delivery_details 
      WHERE delivery_id = ? AND detail_type = 'products'
      ORDER BY created_at ASC
    `, [deliveryId]);

    console.log(`✅ [getDeliveryProducts] 제품 정보 조회 완료: ${productDetails.length}건`);

    // JSON 파싱하여 제품 배열 추출
    const products = [];
    
    productDetails.forEach(detail => {
      try {
        const parsedValue = JSON.parse(detail.detail_value);
        if (Array.isArray(parsedValue)) {
          products.push(...parsedValue);
        } else {
          products.push(parsedValue);
        }
      } catch (error) {
        console.warn('제품 JSON 파싱 실패:', detail.id, error.message);
      }
    });

    res.json({
      success: true,
      deliveryId: parseInt(deliveryId),
      count: products.length,
      products: products
    });

  } catch (error) {
    console.error('❌ [getDeliveryProducts] 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 제품 정보 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 배송 상세 정보 생성 (제품 배열 저장용)
 */
const createDeliveryDetail = async (req, res) => {
  try {
    const { deliveryId, detailType, detailValue } = req.body;
    console.log('📝 [createDeliveryDetail] 배송 상세 정보 생성:', {
      deliveryId,
      detailType,
      valueType: typeof detailValue
    });

    // detail_value를 JSON 문자열로 변환 (필요한 경우)
    const jsonValue = typeof detailValue === 'string' 
      ? detailValue 
      : JSON.stringify(detailValue);

    const [result] = await pool.execute(`
      INSERT INTO delivery_details (delivery_id, detail_type, detail_value)
      VALUES (?, ?, ?)
    `, [deliveryId, detailType, jsonValue]);

    console.log('✅ [createDeliveryDetail] 상세 정보 생성 완료:', result.insertId);

    res.status(201).json({
      success: true,
      message: '배송 상세 정보가 생성되었습니다.',
      detailId: result.insertId,
      deliveryId,
      detailType
    });

  } catch (error) {
    console.error('❌ [createDeliveryDetail] 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 상세 정보 생성 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getDeliveryDetails,
  getDeliveryProducts,
  createDeliveryDetail
};