const { pool, generateTrackingNumber, executeWithRetry } = require('../config/database');

/**
 * 새로운 배송 접수 생성 (52개 필드 완전 지원)
 * DDL 권한 제한으로 인해 기존 컬럼만 사용
 */
const createDelivery = async (req, res) => {
  try {
    console.log('📦 [createDelivery] 새로운 배송 접수 생성 시작');
    console.log('📋 [createDelivery] 받은 데이터:', JSON.stringify(req.body, null, 2));

    // 입력 데이터 구조분해
    const {
      // 보내는 사람 정보
      sender_name, sender_company, sender_phone, sender_email,
      sender_address, sender_detail_address, sender_zipcode,
      
      // 받는 사람 정보 (여러 필드명 지원)
      receiver_name, receiver_phone, receiver_email,
      receiver_address, receiver_detail_address, receiver_zipcode,
      customer_name, customer_phone, customer_address,
      
      // 배송 정보
      product_name, product_sku, product_quantity, seller_info,
      has_elevator, can_use_ladder_truck, preferred_delivery_date,
      
      // 특수 옵션
      is_fragile, is_frozen, requires_signature, insurance_amount,
      
      // 추가 메모
      delivery_memo, special_instructions,
      
      // 파트너/사용자 정보
      user_id,
      
      // 제품 배열 (AdminShippingForm에서 전송)
      products
    } = req.body;

    // 필드명 통일 (customer_ 형식도 허용)
    const finalReceiverName = receiver_name || customer_name;
    const finalReceiverPhone = receiver_phone || customer_phone; 
    const finalReceiverAddress = receiver_address || customer_address;

    // 최소 필수 필드 검증 (더 유연하게)
    const requiredFields = [
      { field: 'sender_name', value: sender_name },
      { field: 'sender_address', value: sender_address },
      { field: 'receiver/customer_name', value: finalReceiverName },
      { field: 'receiver/customer_phone', value: finalReceiverPhone },
      { field: 'receiver/customer_address', value: finalReceiverAddress }
    ];

    const missingFields = requiredFields.filter(item => !item.value).map(item => item.field);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`,
        receivedFields: Object.keys(req.body)
      });
    }

    // 운송장 번호 생성
    const tracking_number = generateTrackingNumber();

    // 실제 데이터베이스의 deliveries 테이블 컬럼 확인
    console.log('📋 [createDelivery] 데이터베이스 컬럼 확인 중...');
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deliveries'
      ORDER BY ORDINAL_POSITION
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 [createDelivery] 존재하는 컬럼들:', existingColumns);

    // 기본 필수 컬럼들
    const baseColumns = ['tracking_number', 'sender_name', 'sender_address', 'customer_name', 'customer_phone', 'customer_address', 'product_name', 'status', 'request_type'];
    const baseValues = [
      tracking_number,
      sender_name,
      sender_address + (sender_detail_address ? ' ' + sender_detail_address : ''),
      finalReceiverName,
      finalReceiverPhone,
      finalReceiverAddress + (receiver_detail_address ? ' ' + receiver_detail_address : ''),
      product_name,
      '접수완료',
      req.body.request_type || '배송접수'
    ];

    // 숫자에서 단위 제거하는 헬퍼 함수
    const parseNumber = (value) => {
      if (!value) return null;
      if (typeof value === 'number') return value;
      // "50kg", "45.5kg", "30cm" 등에서 숫자만 추출
      const numericValue = parseFloat(value.toString().replace(/[^0-9.]/g, ''));
      return isNaN(numericValue) ? null : numericValue;
    };

    // 52개 전체 컬럼 매핑 (기본 필드 제외한 모든 추가 필드)
    const additionalFields = [
      // 무게 및 물리적 정보 (숫자 필드)
      { column: 'weight', value: parseNumber(req.body.weight || req.body.product_weight) },
      
      // 배송 기본 정보  
      { column: 'driver_id', value: req.body.driver_id || null },
      { column: 'user_id', value: user_id || null },
      { column: 'construction_type', value: req.body.construction_type },
      { column: 'visit_date', value: preferred_delivery_date || req.body.visit_date },
      { column: 'visit_time', value: req.body.visit_time },
      
      // 회사 및 연락처 정보
      { column: 'furniture_company', value: sender_company || req.body.furniture_company },
      { column: 'emergency_contact', value: req.body.emergency_contact },
      
      // 메모 및 지시사항
      { column: 'main_memo', value: req.body.main_memo || delivery_memo },
      { column: 'special_instructions', value: special_instructions },
      { column: 'detail_notes', value: req.body.detail_notes },
      { column: 'driver_notes', value: req.body.driver_notes },
      
      // 건물/시공 정보
      { column: 'building_type', value: req.body.building_type },
      { column: 'floor_count', value: req.body.floor_count },
      { column: 'elevator_available', value: has_elevator ? '있음' : (req.body.elevator_available || '없음') },
      { column: 'ladder_truck', value: can_use_ladder_truck ? '필요' : (req.body.ladder_truck || '불필요') },
      { column: 'disposal', value: req.body.disposal },
      { column: 'room_movement', value: req.body.room_movement },
      { column: 'wall_construction', value: req.body.wall_construction },
      
      // 상품 상세 정보
      { column: 'furniture_product_code', value: product_sku || req.body.furniture_product_code },
      { column: 'product_weight', value: req.body.product_weight },
      { column: 'product_size', value: req.body.product_size },
      { column: 'box_size', value: req.body.box_size },
      { column: 'furniture_requests', value: req.body.furniture_requests },
      { column: 'fragile', value: is_fragile ? 1 : (req.body.fragile ? 1 : 0) },
      
      // 파일 및 서명
      { column: 'installation_photos', value: req.body.installation_photos ? JSON.stringify(req.body.installation_photos) : null },
      { column: 'customer_signature', value: req.body.customer_signature },
      
      // 비용 정보 (숫자 필드)
      { column: 'delivery_fee', value: parseNumber(req.body.delivery_fee) || 0 },
      { column: 'insurance_value', value: parseNumber(insurance_amount || req.body.insurance_value) || 0 },
      { column: 'cod_amount', value: parseNumber(req.body.cod_amount) || 0 },
      
      // 배송 날짜 및 상태
      { column: 'estimated_delivery', value: preferred_delivery_date || req.body.estimated_delivery },
      { column: 'actual_delivery', value: req.body.actual_delivery },
      { column: 'completed_at', value: req.body.completed_at },
      { column: 'priority', value: req.body.priority || '보통' },
      
      // 배송 상세 정보
      { column: 'delivery_type', value: req.body.delivery_type || '일반배송' },
      { column: 'payment_method', value: req.body.payment_method },
      { column: 'shipping_method', value: req.body.shipping_method },
      
      // 추가 연락처 정보
      { column: 'sender_phone', value: sender_phone },
      { column: 'sender_email', value: sender_email },
      { column: 'receiver_phone', value: finalReceiverPhone },
      { column: 'receiver_email', value: receiver_email },
      
      // 주소 상세 정보
      { column: 'sender_zipcode', value: sender_zipcode },
      { column: 'receiver_zipcode', value: receiver_zipcode },
      { column: 'sender_detail_address', value: sender_detail_address },
      { column: 'receiver_detail_address', value: receiver_detail_address },
      
      // 상품 정보
      { column: 'product_quantity', value: product_quantity || 1 },
      { column: 'seller_info', value: seller_info },
      { column: 'frozen', value: is_frozen ? 1 : (req.body.frozen ? 1 : 0) },
      { column: 'signature_required', value: requires_signature ? 1 : (req.body.signature_required ? 1 : 0) },
      
      // 기타
      { column: 'notes', value: req.body.notes },
      { column: 'cancellation_reason', value: req.body.cancellation_reason },
      { column: 'cancelled_at', value: req.body.cancelled_at },
      { column: 'updated_at', value: req.body.updated_at }
    ];

    // 실제 존재하는 컬럼만 필터링
    const validAdditionalFields = additionalFields.filter(field => 
      existingColumns.includes(field.column)
    );

    // 최종 컬럼과 값 배열 생성
    const finalColumns = [...baseColumns, ...validAdditionalFields.map(f => f.column)];
    const finalValues = [...baseValues, ...validAdditionalFields.map(f => f.value)];

    console.log('📋 [createDelivery] 최종 사용할 컬럼들:', finalColumns);
    console.log('📋 [createDelivery] 유효한 추가 필드:', validAdditionalFields.length);

    // 동적 INSERT 쿼리 생성
    const placeholders = finalColumns.map(() => '?').join(', ');
    const insertQuery = `
      INSERT INTO deliveries (${finalColumns.join(', ')}) 
      VALUES (${placeholders})
    `;

    console.log('📋 [createDelivery] 실행할 쿼리:', insertQuery);
    console.log('📋 [createDelivery] 값들:', finalValues);

    // 배송 데이터 삽입
    const [result] = await pool.execute(insertQuery, finalValues);
    const deliveryId = result.insertId;
    
    console.log('✅ [createDelivery] 배송 접수 생성 완료:', {
      insertId: deliveryId,
      trackingNumber: tracking_number,
      totalFields: finalColumns.length
    });

    // products 배열이 있으면 delivery_details 테이블에 저장
    let productsCount = 0;
    if (products && Array.isArray(products) && products.length > 0) {
      try {
        console.log('📦 [createDelivery] 제품 정보 저장 시작:', products.length + '개');
        
        // products 배열을 JSON 문자열로 변환하여 delivery_details에 저장
        const productsJson = JSON.stringify(products);
        await pool.execute(`
          INSERT INTO delivery_details (delivery_id, detail_type, detail_value, created_at)
          VALUES (?, 'products', ?, NOW())
        `, [deliveryId, productsJson]);
        
        productsCount = products.length;
        console.log('✅ [createDelivery] 제품 정보 저장 완료:', productsCount + '개');
      } catch (error) {
        console.error('❌ [createDelivery] 제품 정보 저장 실패:', error);
        // 제품 저장 실패해도 배송 생성은 성공으로 처리
      }
    } else {
      console.log('📦 [createDelivery] 저장할 제품 정보 없음');
    }

    // 응답 데이터 구성
    const responseData = {
      success: true,
      message: `배송 접수가 성공적으로 생성되었습니다.${productsCount > 0 ? ` (제품 ${productsCount}개 포함)` : ''}`,
      delivery: {
        id: deliveryId,
        tracking_number: tracking_number,
        status: '접수완료',
        sender_name: sender_name,
        customer_name: finalReceiverName,
        product_name: product_name,
        created_at: new Date().toISOString(),
        fieldsStored: finalColumns.length,
        productsCount: productsCount
      },
      trackingNumber: tracking_number
    };

    res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ [createDelivery] 배송 접수 생성 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 접수 생성 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 모든 배송 목록 조회 (52개 필드 완전 지원)
 */
const getAllDeliveries = async (req, res) => {
  try {
    console.log('📋 [getAllDeliveries] 모든 배송 목록 조회 시작');

    const [deliveries] = await pool.execute(`
      SELECT * FROM deliveries 
      ORDER BY created_at DESC
    `);

    console.log(`✅ [getAllDeliveries] 배송 목록 조회 완료: ${deliveries.length}건`);

    res.json({
      success: true,
      count: deliveries.length,
      deliveries: deliveries
    });

  } catch (error) {
    console.error('❌ [getAllDeliveries] 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 특정 배송 상세 정보 조회
 */
const getDeliveryById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📋 [getDeliveryById] 배송 상세 조회:', id);

    const [delivery] = await pool.execute(
      'SELECT * FROM deliveries WHERE id = ?',
      [id]
    );

    if (delivery.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '해당 배송 정보를 찾을 수 없습니다.'
      });
    }

    console.log('✅ [getDeliveryById] 배송 상세 조회 완료');

    res.json({
      success: true,
      delivery: delivery[0]
    });

  } catch (error) {
    console.error('❌ [getDeliveryById] 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 상세 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 배송 상태 업데이트
 */
const updateDeliveryStatus = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { status, location, notes } = req.body;
    
    console.log('📊 [updateDeliveryStatus] 배송 상태 업데이트:', { trackingNumber, status, location });

    // 기본 상태 업데이트
    let updateQuery = 'UPDATE deliveries SET status = ?, updated_at = NOW()';
    let updateValues = [status];

    // notes가 제공된 경우 driver_notes 업데이트
    if (notes) {
      updateQuery += ', driver_notes = ?';
      updateValues.push(notes);
    }

    updateQuery += ' WHERE tracking_number = ?';
    updateValues.push(trackingNumber);

    const [result] = await pool.execute(updateQuery, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '해당 운송장을 찾을 수 없습니다.'
      });
    }

    // Socket.IO로 실시간 업데이트 전송
    const io = req.app.get('io');
    if (io) {
      io.to('delivery_updates').emit('delivery_status_updated', {
        trackingNumber,
        status,
        location,
        notes,
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ [updateDeliveryStatus] 배송 상태 업데이트 완료');

    res.json({
      success: true,
      message: '배송 상태가 업데이트되었습니다.',
      tracking_number: trackingNumber,
      status: status
    });

  } catch (error) {
    console.error('❌ [updateDeliveryStatus] 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 상태 업데이트 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 배송 취소
 */
const cancelDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { cancelReason, notes } = req.body;
    
    console.log('🚫 [cancelDelivery] 배송 취소:', { deliveryId, cancelReason });

    if (!cancelReason || cancelReason.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: '취소 사유는 필수입니다.'
      });
    }

    const now = new Date().toISOString();
    const noteText = notes ? ` - 추가사항: ${notes}` : '';

    // 배송 취소 처리
    const [result] = await pool.execute(`
      UPDATE deliveries 
      SET status = '취소', 
          cancellation_reason = ?,
          cancelled_at = ?,
          driver_notes = CONCAT(COALESCE(driver_notes, ''), ?)
      WHERE id = ?
    `, [cancelReason.trim(), now, noteText, deliveryId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '해당 배송을 찾을 수 없습니다.'
      });
    }

    console.log('✅ [cancelDelivery] 배송 취소 완료');

    res.json({
      success: true,
      message: '배송이 취소되었습니다.',
      deliveryId: deliveryId,
      cancelReason: cancelReason
    });

  } catch (error) {
    console.error('❌ [cancelDelivery] 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 취소 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 데이터베이스 스키마 정보 조회
 */
const getDatabaseSchema = async (req, res) => {
  try {
    console.log('📋 [getDatabaseSchema] 데이터베이스 스키마 조회');

    // deliveries 테이블의 모든 컬럼 정보 조회
    const [columns] = await pool.execute(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deliveries'
      ORDER BY ORDINAL_POSITION
    `);

    console.log(`✅ [getDatabaseSchema] 스키마 조회 완료: ${columns.length}개 컬럼`);

    res.json({
      success: true,
      table: 'deliveries',
      totalColumns: columns.length,
      columns: columns
    });

  } catch (error) {
    console.error('❌ [getDatabaseSchema] 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '데이터베이스 스키마 조회 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  cancelDelivery,
  getDatabaseSchema
};