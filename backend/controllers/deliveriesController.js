const { pool, generateTrackingNumber, executeWithRetry } = require('../config/database');

/**
 * 새로운 배송 생성 (deliveries 테이블)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function createDelivery(req, res) {
  try {
    // JWT 또는 세션 기반 인증 지원
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const {
      // 기본 배송 정보
      sender_name, sender_address, weight, status = 'pending',
      
      // 고객 정보 (방문지)
      customer_name, customer_phone, customer_address,
      
      // 확장 필드들 
      request_type, construction_type,
      visit_date, visit_time, assigned_driver,
      furniture_company, main_memo, emergency_contact,
      building_type, floor_count, elevator_available,
      ladder_truck, disposal, room_movement, wall_construction,
      product_name, furniture_product_code, product_weight, product_size,
      box_size, furniture_requests, driver_notes,
      installation_photos, customer_signature,
      
      // 추가 필드들 (실제 DB 스키마에 있는 것들)
      delivery_fee, special_instructions,
      fragile, insurance_value, cod_amount,
      driver_id, driver_name
    } = req.body;

    // 필수 필드 검증
    const requiredFields = [
      'sender_name', 'sender_address', 'customer_name', 'customer_phone', 'customer_address'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`
      });
    }

    // 운송장 번호 생성
    const tracking_number = generateTrackingNumber();

    // 배송 정보 삽입 (모든 필드들)
    const [result] = await pool.execute(`
      INSERT INTO deliveries (
        tracking_number, sender_name, sender_address, weight, status,
        request_type, construction_type, visit_date, visit_time, assigned_driver,
        furniture_company, main_memo, emergency_contact, customer_name, customer_phone, 
        customer_address, building_type, floor_count, elevator_available, ladder_truck,
        disposal, room_movement, wall_construction, product_name, furniture_product_code,
        product_weight, product_size, box_size, furniture_requests, driver_notes,
        installation_photos, customer_signature, delivery_fee, special_instructions,
        fragile, insurance_value, cod_amount, driver_id, driver_name, estimated_delivery,
        actual_delivery, delivery_attempts, last_location, detail_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tracking_number, 
      sender_name, 
      sender_address, 
      weight || null, 
      status,
      request_type || null, 
      construction_type || null, 
      visit_date || null, 
      visit_time || null, 
      assigned_driver || null,
      furniture_company || null, 
      main_memo || null, 
      emergency_contact || null, 
      customer_name, 
      customer_phone, 
      customer_address, 
      building_type || null, 
      floor_count || null, 
      elevator_available || null, 
      ladder_truck || null,
      disposal || null, 
      room_movement || null, 
      wall_construction || null, 
      product_name || null, 
      furniture_product_code || null,
      product_weight || null, 
      product_size || null, 
      box_size || null, 
      furniture_requests || null, 
      driver_notes || null,
      installation_photos || null, 
      customer_signature || null, 
      delivery_fee || null, 
      special_instructions || null,
      fragile || false, 
      insurance_value || null, 
      cod_amount || null, 
      driver_id || null, 
      driver_name || null, 
      null, // estimated_delivery
      null, // actual_delivery
      0,    // delivery_attempts
      null, // last_location
      null  // detail_notes
    ]);

    res.status(201).json({
      message: '배송이 성공적으로 접수되었습니다.',
      deliveryId: result.insertId,
      trackingNumber: tracking_number,
      status: status
    });

  } catch (error) {
    console.error('배송 생성 오류:', error);
    console.log('요청 데이터:', JSON.stringify(req.body, null, 2));
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 접수 처리 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 배송 목록 조회 (페이지네이션)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function getDeliveries(req, res) {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    // WHERE 조건 구성
    let whereCondition = '';
    let params = [];
    
    if (status && status !== 'all') {
      whereCondition = 'WHERE status = ?';
      params.push(status);
    }

    // 총 개수 조회
    const countQuery = `SELECT COUNT(*) as total FROM deliveries ${whereCondition}`;
    const [countResult] = await executeWithRetry(() => 
      pool.execute(countQuery, params)
    );
    const total = countResult[0].total;

    // 배송 목록 조회
    const listQuery = `
      SELECT 
        id, tracking_number, status,
        sender_name, customer_name,
        product_name, visit_date, assigned_driver,
        created_at, updated_at
      FROM deliveries 
      ${whereCondition}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const listParams = [...params, limit, offset];
    
    const [deliveries] = await executeWithRetry(() => 
      pool.execute(listQuery, listParams)
    );

    // 결과가 없는 경우에도 빈 배열로 응답
    res.json({
      deliveries: deliveries || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit)
      }
    });

  } catch (error) {
    console.error('배송 목록 조회 오류:', error);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    // 데이터베이스 연결 오류인 경우
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      res.status(503).json({
        error: 'Service Unavailable',
        message: '데이터베이스 연결 오류입니다. 잠시 후 다시 시도해주세요.'
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: '배송 목록 조회 중 오류가 발생했습니다.'
      });
    }
  }
}

/**
 * 특정 배송의 상세 정보 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function getDelivery(req, res) {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const { id } = req.params;

    const [deliveries] = await executeWithRetry(() =>
      pool.execute('SELECT * FROM deliveries WHERE id = ?', [id])
    );

    if (deliveries.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '배송 정보를 찾을 수 없습니다.'
      });
    }

    // installation_photos가 JSON 문자열인 경우 파싱
    const delivery = deliveries[0];
    if (delivery.installation_photos && delivery.installation_photos !== '') {
      try {
        delivery.installation_photos = JSON.parse(delivery.installation_photos);
      } catch (e) {
        // JSON 파싱 실패 시 빈 배열로 설정
        console.warn('installation_photos JSON 파싱 실패:', e);
        delivery.installation_photos = [];
      }
    } else {
      delivery.installation_photos = [];
    }

    res.json({ delivery });

  } catch (error) {
    console.error('배송 상세 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 상세 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 운송장 번호로 배송 추적 (공개 API)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function trackDelivery(req, res) {
  try {
    const { trackingNumber } = req.params;

    if (!trackingNumber) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '운송장 번호가 필요합니다.'
      });
    }

    const [deliveries] = await pool.execute(`
      SELECT 
        tracking_number, status, sender_name, customer_address,
        product_name, customer_name, visit_date, visit_time,
        created_at, updated_at
      FROM deliveries 
      WHERE tracking_number = ?
    `, [trackingNumber]);

    if (deliveries.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '해당 운송장 번호를 찾을 수 없습니다.'
      });
    }

    const delivery = deliveries[0];
    
    // 배송 상태 히스토리 생성
    const statusHistory = [
      {
        status: 'pending',
        timestamp: delivery.created_at,
        location: '집하점',
        description: '배송 접수가 완료되었습니다.'
      }
    ];

    if (['in_transit', 'delivered'].includes(delivery.status)) {
      statusHistory.push({
        status: 'in_transit',
        timestamp: delivery.updated_at,
        location: '배송 중',
        description: '상품이 배송 중입니다.'
      });
    }

    if (delivery.status === 'delivered') {
      statusHistory.push({
        status: 'delivered',
        timestamp: delivery.updated_at,
        location: '수취인',
        description: '배송이 완료되었습니다.'
      });
    }

    res.json({
      trackingNumber: delivery.tracking_number,
      currentStatus: delivery.status,
      orderInfo: {
        senderName: delivery.sender_name,
        recipientAddress: delivery.customer_address,
        productName: delivery.product_name,
        customerName: delivery.customer_name,
        visitDate: delivery.visit_date,
        visitTime: delivery.visit_time
      },
      statusHistory
    });

  } catch (error) {
    console.error('배송 추적 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 추적 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 배송 상태 업데이트
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function updateDeliveryStatus(req, res) {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // 유효한 상태값 확인
    const validStatuses = ['pending', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '유효하지 않은 상태값입니다.'
      });
    }

    // 배송 존재 확인
    const [existingDelivery] = await pool.execute(
      'SELECT id FROM deliveries WHERE id = ?',
      [id]
    );

    if (existingDelivery.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '배송 정보를 찾을 수 없습니다.'
      });
    }

    // 상태 업데이트
    await pool.execute(
      'UPDATE deliveries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    // 업데이트된 배송 정보 반환
    const [updatedDelivery] = await pool.execute(
      'SELECT * FROM deliveries WHERE id = ?',
      [id]
    );

    res.json({
      message: '배송 상태가 성공적으로 업데이트되었습니다.',
      delivery: updatedDelivery[0]
    });

  } catch (error) {
    console.error('배송 상태 업데이트 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '상태 업데이트 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 배송 정보 업데이트 (전체 또는 부분)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function updateDelivery(req, res) {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // 배송 존재 확인
    const [existingDelivery] = await pool.execute(
      'SELECT id FROM deliveries WHERE id = ?',
      [id]
    );

    if (existingDelivery.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '배송 정보를 찾을 수 없습니다.'
      });
    }

    // 업데이트할 필드 구성 (실제 deliveries 테이블 스키마에 맞춤)
    const allowedFields = [
      'tracking_number', 'sender_name', 'sender_address',
      'receiver_name', 'receiver_address', 'receiver_phone',
      'weight', 'status',
      'request_type', 'construction_type', 'shipment_type',
      'visit_date', 'visit_time', 'assigned_driver',
      'furniture_company', 'main_memo', 'emergency_contact',
      'customer_name', 'customer_phone', 'customer_address',
      'building_type', 'floor_count', 'elevator_available',
      'ladder_truck', 'disposal', 'room_movement', 'wall_construction',
      'product_name', 'furniture_product_code', 'product_weight', 'product_size',
      'box_size', 'furniture_requests', 'driver_notes',
      'installation_photos', 'customer_signature',
      'delivery_fee', 'special_instructions', 'delivery_time_preference',
      'fragile', 'insurance_value', 'cod_amount',
      'driver_id', 'driver_name', 'estimated_delivery', 'actual_delivery',
      'delivery_attempts', 'last_location', 'detail_notes'
    ];

    const setClause = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = ?`);
        // installation_photos는 JSON으로 변환
        if (key === 'installation_photos' && updateData[key]) {
          values.push(JSON.stringify(updateData[key]));
        } else {
          values.push(updateData[key]);
        }
      }
    });

    if (setClause.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '업데이트할 필드가 없습니다.'
      });
    }

    // updated_at 자동 업데이트
    setClause.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const updateQuery = `UPDATE deliveries SET ${setClause.join(', ')} WHERE id = ?`;
    await pool.execute(updateQuery, values);

    // 업데이트된 배송 정보 반환
    const [updatedDelivery] = await pool.execute(
      'SELECT * FROM deliveries WHERE id = ?',
      [id]
    );

    res.json({
      message: '배송 정보가 성공적으로 업데이트되었습니다.',
      delivery: updatedDelivery[0]
    });

  } catch (error) {
    console.error('배송 정보 업데이트 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 정보 업데이트 중 오류가 발생했습니다.'
    });
  }
}

module.exports = {
  createDelivery,
  getDeliveries,
  getDelivery,
  trackDelivery,
  updateDeliveryStatus,
  updateDelivery
};