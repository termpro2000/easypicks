const { pool, generateTrackingNumber, executeWithRetry } = require('../config/database');

/**
 * 데이터베이스 마이그레이션: action_date, action_time 컬럼 추가
 */
async function ensureActionDateTimeColumns() {
  try {
    // 먼저 컬럼이 존재하는지 확인
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deliveries' 
      AND COLUMN_NAME IN ('action_date', 'action_time')
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 기존 action 컬럼:', existingColumns);
    
    // action_date 컬럼 추가
    if (!existingColumns.includes('action_date')) {
      await pool.execute(`ALTER TABLE deliveries ADD COLUMN action_date DATE NULL`);
      console.log('✅ action_date 컬럼 추가 완료');
    } else {
      console.log('ℹ️ action_date 컬럼이 이미 존재함');
    }
    
    // action_time 컬럼 추가
    if (!existingColumns.includes('action_time')) {
      await pool.execute(`ALTER TABLE deliveries ADD COLUMN action_time TIME NULL`);
      console.log('✅ action_time 컬럼 추가 완료');
    } else {
      console.log('ℹ️ action_time 컬럼이 이미 존재함');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ action_date/time 컬럼 추가 오류:', error.message);
    return false;
  }
}

/**
 * 새로운 배송 생성 (deliveries 테이블) - shippingController와 동일한 로직
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function createDelivery(req, res) {
  try {
    console.log('📋 [createDelivery] 요청 데이터:', JSON.stringify(req.body, null, 2));
    console.log('📋 [createDelivery] 요청 필드들:', Object.keys(req.body));
    
    // JWT 또는 세션 기반 인증 지원
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    const {
      // 발송인 정보 (여러 필드명 지원)
      sender_name, sender_phone, sender_email, sender_company,
      sender_address, sender_detail_address, sender_zipcode,
      
      // 수취인 정보 (receiver_ 또는 customer_ 형식 모두 지원)
      receiver_name, receiver_phone, receiver_email, receiver_company,
      receiver_address, receiver_detail_address, receiver_zipcode,
      customer_name, customer_phone, customer_address,
      
      // 배송 정보
      product_name, product_sku, product_quantity, seller_info,
      has_elevator, can_use_ladder_truck, preferred_delivery_date,
      
      // 특수 옵션
      is_fragile, is_frozen, requires_signature, insurance_amount,
      
      // 추가 메모
      delivery_memo, special_instructions
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

    // 먼저 실제 존재하는 컬럼 확인 후 동적으로 INSERT
    console.log('📋 [createDelivery] 데이터베이스 컬럼 확인 중...');
    
    // 실제 데이터베이스의 deliveries 테이블 컬럼 확인
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deliveries'
      ORDER BY ORDINAL_POSITION
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 [createDelivery] 존재하는 컬럼들:', existingColumns);

    // 기본 필수 컬럼들 (반드시 존재해야 함)
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

    // 52개 전체 컬럼 매핑 (기본 필드 제외한 모든 추가 필드)
    const additionalFields = [
      // id, tracking_number, status, request_type는 기본 필드에서 처리
      
      // 2. 무게 및 물리적 정보
      { column: 'weight', value: req.body.weight || req.body.product_weight },
      
      // 3. 배송 기본 정보  
      { column: 'driver_id', value: req.body.driver_id || null },
      { column: 'construction_type', value: req.body.construction_type },
      { column: 'visit_date', value: preferred_delivery_date || req.body.visit_date },
      { column: 'visit_time', value: req.body.visit_time },
      
      // 4. 회사 및 연락처 정보
      { column: 'furniture_company', value: sender_company || req.body.furniture_company },
      { column: 'emergency_contact', value: req.body.emergency_contact },
      
      // 5. 메모 및 지시사항
      { column: 'main_memo', value: req.body.main_memo || delivery_memo },
      { column: 'special_instructions', value: special_instructions },
      { column: 'detail_notes', value: req.body.detail_notes },
      { column: 'driver_notes', value: req.body.driver_notes },
      
      // 6. 건물/시공 정보
      { column: 'building_type', value: req.body.building_type },
      { column: 'floor_count', value: req.body.floor_count },
      { column: 'elevator_available', value: has_elevator ? '있음' : (req.body.elevator_available || '없음') },
      { column: 'ladder_truck', value: can_use_ladder_truck ? '필요' : (req.body.ladder_truck || '불필요') },
      { column: 'disposal', value: req.body.disposal },
      { column: 'room_movement', value: req.body.room_movement },
      { column: 'wall_construction', value: req.body.wall_construction },
      
      // 7. 상품 상세 정보
      { column: 'furniture_product_code', value: product_sku || req.body.furniture_product_code },
      { column: 'product_weight', value: req.body.product_weight },
      { column: 'product_size', value: req.body.product_size },
      { column: 'box_size', value: req.body.box_size },
      { column: 'furniture_requests', value: req.body.furniture_requests },
      { column: 'fragile', value: is_fragile ? 1 : (req.body.fragile ? 1 : 0) },
      
      // 8. 파일 및 서명
      { column: 'installation_photos', value: req.body.installation_photos ? JSON.stringify(req.body.installation_photos) : null },
      { column: 'customer_signature', value: req.body.customer_signature },
      
      // 9. 비용 정보
      { column: 'delivery_fee', value: req.body.delivery_fee || 0 },
      { column: 'insurance_value', value: insurance_amount || req.body.insurance_value || 0 },
      { column: 'cod_amount', value: req.body.cod_amount || 0 },
      
      // 10. 배송 날짜 및 상태
      { column: 'estimated_delivery', value: preferred_delivery_date || req.body.estimated_delivery },
      { column: 'actual_delivery', value: req.body.actual_delivery },
      { column: 'delivery_attempts', value: req.body.delivery_attempts || 0 },
      { column: 'last_location', value: req.body.last_location },
      { column: 'distance', value: req.body.distance || 0 },
      
      // 11. 취소 관련
      { column: 'cancel_status', value: req.body.cancel_status || 0 },
      { column: 'cancel_reason', value: req.body.cancel_reason },
      { column: 'canceled_at', value: req.body.canceled_at },
      
      // 12. 완료 관련
      { column: 'customer_requested_completion', value: req.body.customer_requested_completion ? 1 : 0 },
      { column: 'furniture_company_requested_completion', value: req.body.furniture_company_requested_completion ? 1 : 0 },
      { column: 'completion_audio_file', value: req.body.completion_audio_file }
    ];

    // 존재하는 컬럼만 필터링
    const finalColumns = [...baseColumns];
    const finalValues = [...baseValues];

    additionalFields.forEach(field => {
      if (existingColumns.includes(field.column) && field.value !== undefined && field.value !== null) {
        finalColumns.push(field.column);
        finalValues.push(field.value);
      }
    });

    console.log('📋 [createDelivery] 최종 사용할 컬럼들:', finalColumns);

    // 동적 INSERT 쿼리 생성
    const placeholders = finalValues.map(() => '?').join(', ');
    const insertQuery = `INSERT INTO deliveries (${finalColumns.join(', ')}) VALUES (${placeholders})`;
    
    console.log('📋 [createDelivery] INSERT 쿼리:', insertQuery);
    console.log('📋 [createDelivery] VALUES 개수:', finalValues.length);

    const [result] = await pool.execute(insertQuery, finalValues);

    res.status(201).json({
      message: '배송 접수가 완료되었습니다.',
      orderId: result.insertId,
      trackingNumber: tracking_number,
      status: '접수완료'
    });

  } catch (error) {
    console.error('배송 접수 생성 오류:', error);
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
    // 데이터베이스 마이그레이션 강제 실행 (임시)
    console.log('🔄 [강제 마이그레이션] 시작...');
    const migrationSuccess = await ensureActionDateTimeColumns();
    console.log('🔄 [강제 마이그레이션] 결과:', migrationSuccess);
    
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

    // WHERE 조건 구성 (역할별 필터링)
    let whereCondition = '';
    let params = [];
    
    if (user.role === 'driver') {
      // 기사는 자신에게 배정된 배송만 조회
      if (status && status !== 'all') {
        whereCondition = 'WHERE driver_id = ? AND status = ?';
        params.push(user.id, status);
      } else {
        whereCondition = 'WHERE driver_id = ?';
        params.push(user.id);
      }
    } else if (user.role === 'user') {
      // user 권한인 경우 본인이 생성한 배송만 조회 (user_id 컬럼이 없으므로 모든 배송 조회)
      if (status && status !== 'all') {
        whereCondition = 'WHERE status = ?';
        params.push(status);
      }
    } else {
      // 관리자/매니저는 모든 배송 조회
      if (status && status !== 'all') {
        whereCondition = 'WHERE status = ?';
        params.push(status);
      }
    }

    // 총 개수 조회
    const countQuery = `SELECT COUNT(*) as total FROM deliveries ${whereCondition}`;
    const [countResult] = await executeWithRetry(() => 
      pool.execute(countQuery, params)
    );
    const total = countResult[0].total;

    // 배송 목록 조회 (52개 전체 필드 조회)
    let listQuery = `
      SELECT * 
      FROM deliveries 
      ${whereCondition}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    // 52개 전체 필드를 조회하므로 별도 컬럼 체크 불필요
    const listParams = [...params, limit, offset];
    
    const [deliveries] = await executeWithRetry(() => 
      pool.execute(listQuery, listParams)
    );

    // 모든 필드가 이미 조회되므로 별도 처리 불필요
    const processedDeliveries = deliveries || [];

    // 결과가 없는 경우에도 빈 배열로 응답
    res.json({
      deliveries: processedDeliveries,
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

    // user 권한인 경우 본인이 생성한 배송만 조회 가능
    let query = 'SELECT * FROM deliveries WHERE id = ?';
    let params = [id];
    
    // user_id 컬럼이 존재하지 않으므로 모든 사용자가 조회 가능
    // if (user.role === 'user') {
    //   query = 'SELECT * FROM deliveries WHERE id = ? AND user_id = ?';
    //   params = [id, user.id];
    // }

    const [deliveries] = await executeWithRetry(() =>
      pool.execute(query, params)
    );

    if (deliveries.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '배송 정보를 찾을 수 없거나 접근 권한이 없습니다.'
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

    // 유효한 상태값 확인 (새로운 status 시스템 적용)
    const validStatuses = [
      'order_received', 'dispatch_completed', 'in_delivery', 'in_collection', 'in_processing',
      'delivery_completed', 'collection_completed', 'processing_completed', 
      'delivery_cancelled', 'delivery_postponed',
      // 기존 호환성을 위한 항목들
      'pending', 'in_transit', 'delivered', 'cancelled', 'completed'
    ];
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

    // 실시간 업데이트 브로드캐스트
    const io = req.app.get('io');
    if (io) {
      io.to('delivery_updates').emit('delivery_status_updated', {
        id: parseInt(id),
        status: status,
        delivery: updatedDelivery[0],
        timestamp: new Date().toISOString()
      });
    }

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
    console.log(`📋 [updateDelivery] 배송 ${req.params.id} 업데이트 요청 시작`);
    console.log(`📋 [updateDelivery] 요청 데이터:`, JSON.stringify(req.body, null, 2));
    console.log(`📋 [updateDelivery] 요청 헤더:`, JSON.stringify({
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization?.slice(0, 20) + '...',
      'user-agent': req.headers['user-agent'],
      'origin': req.headers.origin
    }, null, 2));

    const user = req.user || req.session?.user;
    if (!user) {
      console.log(`❌ [updateDelivery] 인증 실패 - 사용자 정보 없음`);
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    console.log(`👤 [updateDelivery] 인증된 사용자: ${user.username} (ID: ${user.id})`);
    const { id } = req.params;
    const updateData = req.body;

    // 배송 존재 확인
    const [existingDelivery] = await executeWithRetry(() =>
      pool.execute(
        'SELECT id FROM deliveries WHERE id = ?',
        [id]
      )
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
      'weight', 'status', 'driver_id',
      'request_type', 'construction_type', 'visit_date', 'visit_time',
      'furniture_company', 'main_memo', 'emergency_contact',
      'customer_name', 'customer_phone', 'customer_address',
      'building_type', 'floor_count', 'elevator_available',
      'ladder_truck', 'disposal', 'room_movement', 'wall_construction',
      'product_name', 'furniture_product_code', 'product_weight', 'product_size',
      'box_size', 'furniture_requests', 'driver_notes',
      'installation_photos', 'customer_signature',
      'delivery_fee', 'special_instructions', 'fragile', 'insurance_value', 'cod_amount',
      'estimated_delivery', 'actual_delivery', 'delivery_attempts', 'last_location', 'detail_notes'
    ];

    const setClause = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = ?`);
        // installation_photos는 JSON으로 변환
        if (key === 'installation_photos' && updateData[key]) {
          values.push(JSON.stringify(updateData[key]));
        } else if (key === 'driver_id' && updateData[key] === "") {
          // driver_id가 빈 문자열이면 null로 변환
          values.push(null);
          console.log('[데이터 정규화] driver_id 빈 문자열을 null로 변환');
        } else {
          values.push(updateData[key]);
        }
      }
    });

    // driver_id가 업데이트되는 경우 (기사 배정), visit_date 자동 설정 및 status 업데이트 로직
    if (updateData.driver_id && updateData.driver_id !== null && updateData.driver_id !== "") {
      console.log(`[기사 배정] 기사 배정 시작 - driver_id: ${updateData.driver_id}`);
      
      // 기사 배정 시 status를 '배차완료'로 설정
      const statusIndex = setClause.findIndex(clause => clause.startsWith('status'));
      if (statusIndex >= 0) {
        // 이미 status 업데이트가 예정되어 있으면 값만 변경
        values[statusIndex] = '배차완료';
        console.log('[기사 배정] 기존 status 값을 배차완료로 변경');
      } else if (!updateData.status) {
        // status가 요청 데이터에 없는 경우에만 추가
        setClause.push('status = ?');
        values.push('배차완료');
        console.log('[기사 배정] status를 배차완료로 설정');
      }
      console.log(`[기사 배정 디버깅] updateData.visit_date:`, updateData.visit_date);
      
      // 현재 데이터베이스에서 visit_date와 주소 정보 확인
      const [currentDelivery] = await executeWithRetry(() =>
        pool.execute(
          'SELECT visit_date, sender_address, customer_address FROM deliveries WHERE id = ?',
          [id]
        )
      );
      const dbVisitDate = currentDelivery[0]?.visit_date;
      const senderAddress = currentDelivery[0]?.sender_address;
      const customerAddress = currentDelivery[0]?.customer_address;
      console.log(`[기사 배정 디버깅] DB의 현재 visit_date:`, dbVisitDate);
      
      const currentVisitDate = updateData.visit_date || dbVisitDate;
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      
      console.log(`[기사 배정 디버깅] 오늘: ${today.toISOString().split('T')[0]}, 내일: ${tomorrowStr}`);
      console.log(`[기사 배정 디버깅] currentVisitDate:`, currentVisitDate);
      console.log(`[기사 배정 디버깅] 조건 체크: !currentVisitDate=${!currentVisitDate}, 과거 날짜=${currentVisitDate ? new Date(currentVisitDate) <= today : 'N/A'}`);
      
      // visit_date가 없거나 현재 날짜보다 작으면 내일 날짜로 설정
      if (!currentVisitDate || new Date(currentVisitDate) <= today) {
        console.log(`[기사 배정] visit_date 자동 설정: ${tomorrowStr}`);
        
        // visit_date가 이미 setClause에 있는지 확인
        const visitDateIndex = setClause.findIndex(clause => clause.startsWith('visit_date'));
        if (visitDateIndex >= 0) {
          // 기존 visit_date 값 교체
          values[visitDateIndex] = tomorrowStr;
          console.log(`[기사 배정 디버깅] 기존 visit_date 값 교체됨`);
        } else {
          // 새로 visit_date 추가
          setClause.push('visit_date = ?');
          values.push(tomorrowStr);
          console.log(`[기사 배정 디버깅] 새로운 visit_date 추가됨`);
        }
      } else {
        console.log(`[기사 배정] visit_date 변경하지 않음 (현재값: ${currentVisitDate})`);
      }

      // 거리 계산 로직
      if (senderAddress && customerAddress) {
        try {
          console.log(`[기사 배정] 거리 계산 시작`);
          const { calculateDistance } = require('../utils/distanceCalculator');
          const distance = await calculateDistance(senderAddress, customerAddress);
          
          console.log(`[기사 배정] 계산된 거리: ${distance}km`);
          
          // distance 필드 업데이트
          setClause.push('distance = ?');
          values.push(distance);
          
          console.log(`[기사 배정] distance 필드 추가됨: ${distance}km`);
        } catch (error) {
          console.error('[기사 배정] 거리 계산 오류:', error.message);
          // 거리 계산 실패 시 기본값 0으로 설정하고 기사 배정은 계속 진행
          setClause.push('distance = ?');
          values.push(0);
          console.log(`[기사 배정] 거리 계산 실패로 기본값 0km 설정`);
        }
      } else {
        console.log(`[기사 배정] 주소 정보 없음 - 거리 계산 생략`);
      }
    } else if ('driver_id' in updateData && (updateData.driver_id === null || updateData.driver_id === "")) {
      // 기사 배정 해제 시 상태를 다시 '접수완료'로 변경
      console.log(`[기사 배정 해제] driver_id가 null 또는 빈 값으로 설정됨`);
      const statusIndex = setClause.findIndex(clause => clause.startsWith('status'));
      if (statusIndex >= 0) {
        values[statusIndex] = '접수완료';
        console.log('[기사 배정 해제] 기존 status 값을 접수완료로 변경');
      } else if (!updateData.status) {
        setClause.push('status = ?');
        values.push('접수완료');
        console.log('[기사 배정 해제] status를 접수완료로 설정');
      }
    }

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
    await executeWithRetry(() => pool.execute(updateQuery, values));

    // 업데이트된 배송 정보 반환
    const [updatedDelivery] = await executeWithRetry(() =>
      pool.execute(
        'SELECT * FROM deliveries WHERE id = ?',
        [id]
      )
    );

    const deliveryData = updatedDelivery[0];

    // 기사 배정 시 실시간 푸시 알림 전송
    if (updateData.driver_id && updateData.driver_id !== null && updateData.driver_id !== "") {
      const io = req.app.get('io');
      if (io) {
        // 특정 기사에게 알림 전송 (기사별 채널)
        const driverChannel = `driver_${updateData.driver_id}`;
        console.log(`📱 [기사 배정 알림] 채널: ${driverChannel}`);
        
        io.to(driverChannel).emit('delivery_assigned', {
          deliveryId: parseInt(id),
          trackingNumber: deliveryData.tracking_number,
          customerName: deliveryData.customer_name,
          customerPhone: deliveryData.customer_phone,
          customerAddress: deliveryData.customer_address,
          senderName: deliveryData.sender_name,
          senderAddress: deliveryData.sender_address,
          productName: deliveryData.product_name,
          visitDate: deliveryData.visit_date,
          visitTime: deliveryData.visit_time,
          distance: deliveryData.distance,
          status: deliveryData.status,
          assignedAt: new Date().toISOString(),
          message: '새로운 배송이 배정되었습니다!'
        });

        // 관리자와 매니저에게도 배정 완료 알림
        io.to('delivery_updates').emit('driver_assignment_completed', {
          deliveryId: parseInt(id),
          driverId: updateData.driver_id,
          trackingNumber: deliveryData.tracking_number,
          customerName: deliveryData.customer_name,
          status: '배차완료',
          assignedAt: new Date().toISOString()
        });

        console.log(`✅ [기사 배정 알림] 기사 ${updateData.driver_id}에게 알림 전송 완료`);
      }
    } else if ('driver_id' in updateData && (updateData.driver_id === null || updateData.driver_id === "")) {
      // 기사 배정 해제 시 알림
      const io = req.app.get('io');
      if (io) {
        io.to('delivery_updates').emit('driver_assignment_cancelled', {
          deliveryId: parseInt(id),
          trackingNumber: deliveryData.tracking_number,
          customerName: deliveryData.customer_name,
          status: '접수완료',
          cancelledAt: new Date().toISOString()
        });
        console.log(`📱 [기사 배정 해제] 배송 ${id} 배정 해제 알림 전송`);
      }
    }

    res.json({
      message: '배송 정보가 성공적으로 업데이트되었습니다.',
      delivery: deliveryData
    });

  } catch (error) {
    console.error(`❌ [updateDelivery] 배송 ${req.params.id} 업데이트 오류:`, error);
    console.error(`❌ [updateDelivery] 에러 스택:`, error.stack);
    console.error(`❌ [updateDelivery] 요청 데이터:`, JSON.stringify(req.body, null, 2));
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 정보 업데이트 중 오류가 발생했습니다.',
      debug: process.env.NODE_ENV !== 'production' ? {
        error: error.message,
        stack: error.stack,
        requestData: req.body
      } : undefined
    });
  }
}

/**
 * 배송 완료 처리 (체크박스 데이터 및 오디오 파일 포함)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function completeDelivery(req, res) {
  try {
    const deliveryId = req.params.id;
    const { 
      driverNotes, 
      customerRequestedCompletion, 
      furnitureCompanyRequestedCompletion, 
      completionAudioFile,
      completedAt,
      action_date,
      action_time
    } = req.body;
    
    console.log('배송완료 처리 요청:', {
      deliveryId,
      driverNotes,
      customerRequestedCompletion,
      furnitureCompanyRequestedCompletion,
      completionAudioFile,
      action_date,
      action_time,
      userId: req.user?.user_id
    });
    
    // action_date/time 컬럼 확인 및 생성 (production 환경에서 실패할 수 있음)
    let hasActionColumns = false;
    try {
      hasActionColumns = await ensureActionDateTimeColumns();
    } catch (error) {
      console.log('⚠️ action_date/time 컬럼 생성 실패, 기본 SQL 사용:', error.message);
    }
    
    // 배송 정보 존재 여부 및 의뢰종류 확인
    const [deliveryCheck] = await pool.execute(
      'SELECT id, tracking_number, customer_name, status, request_type FROM deliveries WHERE id = ?',
      [deliveryId]
    );
    
    if (deliveryCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: '해당 배송을 찾을 수 없습니다.'
      });
    }
    
    const delivery = deliveryCheck[0];
    
    // 의뢰종류에 따른 완료 status 결정
    let completedStatus;
    switch (delivery.request_type) {
      case '회수':
        completedStatus = '회수완료';
        break;
      case '조처':
        completedStatus = '조처완료';
        break;
      default: // 일반, 네이버, 쿠팡 등
        completedStatus = '배송완료';
        break;
    }
    
    // 이미 취소된 배송은 완료 처리할 수 없음
    if (delivery.status === '배송취소' || delivery.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: '취소된 배송은 완료 처리할 수 없습니다.'
      });
    }
    
    // 현재 시간 (MySQL datetime 형식으로 변환)
    const now = completedAt ? 
      new Date(completedAt).toISOString().slice(0, 19).replace('T', ' ') :
      new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // action_date/time 컬럼이 존재하는 경우와 없는 경우를 구분하여 처리
    let updateResult;
    if (hasActionColumns) {
      // 컬럼이 존재하는 경우: action_date/time 포함
      [updateResult] = await pool.execute(
        `UPDATE deliveries SET 
           status = ?,
           driver_notes = ?,
           customer_requested_completion = ?,
           furniture_company_requested_completion = ?,
           completion_audio_file = ?,
           actual_delivery = ?,
           action_date = ?,
           action_time = ?,
           updated_at = NOW()
         WHERE id = ?`,
        [
          completedStatus,
        driverNotes || '',
        customerRequestedCompletion ? 1 : 0,
        furnitureCompanyRequestedCompletion ? 1 : 0,
        completionAudioFile || null,
        now,
        action_date,
        action_time,
        deliveryId
      ]
    );
    } else {
      // 컬럼이 없는 경우: action_date/time 제외
      [updateResult] = await pool.execute(
        `UPDATE deliveries SET 
           status = ?,
           driver_notes = ?,
           customer_requested_completion = ?,
           furniture_company_requested_completion = ?,
           completion_audio_file = ?,
           actual_delivery = ?,
           updated_at = NOW()
         WHERE id = ?`,
        [
          completedStatus,
          driverNotes || '',
          customerRequestedCompletion ? 1 : 0,
          furnitureCompanyRequestedCompletion ? 1 : 0,
          completionAudioFile || null,
          now,
          deliveryId
        ]
      );
    }
    
    if (updateResult.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        error: '배송완료 처리에 실패했습니다.'
      });
    }
    
    console.log('배송완료 처리 성공:', {
      deliveryId,
      trackingNumber: delivery.tracking_number,
      customerName: delivery.customer_name,
      previousStatus: delivery.status,
      newStatus: completedStatus,
      completedAt: now,
      audioFile: completionAudioFile
    });
    
    // 실시간 업데이트 브로드캐스트
    const io = req.app.get('io');
    if (io) {
      io.to('delivery_updates').emit('delivery_completed', {
        id: parseInt(deliveryId),
        status: completedStatus,
        requestType: delivery.request_type,
        completedAt: now,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: '배송이 성공적으로 완료되었습니다.',
      data: {
        deliveryId,
        trackingNumber: delivery.tracking_number,
        customerName: delivery.customer_name,
        previousStatus: delivery.status,
        newStatus: completedStatus,
        completedAt: now,
        customerRequestedCompletion: customerRequestedCompletion,
        furnitureCompanyRequestedCompletion: furnitureCompanyRequestedCompletion,
        completionAudioFile: completionAudioFile,
        action_date,
        action_time
      }
    });
    
  } catch (error) {
    console.error('배송완료 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '배송완료 처리 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

/**
 * 배송 연기 처리
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function postponeDelivery(req, res) {
  try {
    const deliveryId = req.params.id;
    const { postponeDate, postponeReason } = req.body;
    
    console.log('배송연기 요청:', {
      deliveryId,
      postponeDate,
      postponeReason,
      userId: req.user?.user_id
    });
    
    // 입력 검증
    if (!postponeDate || !postponeReason) {
      return res.status(400).json({
        success: false,
        error: '연기 날짜와 사유를 입력해주세요.'
      });
    }
    
    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(postponeDate)) {
      return res.status(400).json({
        success: false,
        error: '올바른 날짜 형식이 아닙니다. (YYYY-MM-DD)'
      });
    }
    
    // 연기 날짜가 과거가 아닌지 확인
    const today = new Date().toISOString().split('T')[0];
    if (postponeDate <= today) {
      return res.status(400).json({
        success: false,
        error: '연기 날짜는 오늘 이후로 설정해주세요.'
      });
    }
    
    // 배송 정보 존재 여부 확인
    const [deliveryCheck] = await pool.execute(
      'SELECT id, tracking_number, customer_name, status FROM deliveries WHERE id = ?',
      [deliveryId]
    );
    
    if (deliveryCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: '해당 배송을 찾을 수 없습니다.'
      });
    }
    
    const delivery = deliveryCheck[0];
    
    // 이미 완료된 배송은 연기할 수 없음
    if (delivery.status === 'delivery_completed' || delivery.status === 'collection_completed' || delivery.status === 'processing_completed') {
      return res.status(400).json({
        success: false,
        error: '이미 완료된 배송은 연기할 수 없습니다.'
      });
    }
    
    // 배송 연기 처리 (status, visit_date 업데이트 및 연기 사유 저장)
    const [updateResult] = await pool.execute(
      `UPDATE deliveries SET 
         status = 'delivery_postponed',
         visit_date = ?, 
         driver_notes = CONCAT(COALESCE(driver_notes, ''), IF(COALESCE(driver_notes, '') = '', '', '\n'), '배송연기 (', ?, '): ', ?),
         updated_at = NOW()
       WHERE id = ?`,
      [postponeDate, postponeDate, postponeReason, deliveryId]
    );
    
    if (updateResult.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        error: '배송연기 처리에 실패했습니다.'
      });
    }
    
    console.log('배송연기 처리 완료:', {
      deliveryId,
      trackingNumber: delivery.tracking_number,
      customerName: delivery.customer_name,
      newVisitDate: postponeDate,
      reason: postponeReason
    });
    
    res.json({
      success: true,
      message: '배송이 성공적으로 연기되었습니다.',
      data: {
        deliveryId,
        trackingNumber: delivery.tracking_number,
        customerName: delivery.customer_name,
        newVisitDate: postponeDate,
        postponeReason
      }
    });
    
  } catch (error) {
    console.error('배송연기 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '배송연기 처리 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

/**
 * 배송 연기 (delay_date 필드 사용)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function delayDelivery(req, res) {
  try {
    const trackingNumber = req.params.trackingNumber;
    const { delayDate, delayReason } = req.body;
    
    console.log('배송연기 요청:', {
      trackingNumber,
      delayDate,
      delayReason,
      userId: req.user?.user_id
    });
    
    // 입력 검증
    if (!delayDate) {
      return res.status(400).json({
        success: false,
        error: '연기 날짜를 입력해주세요.'
      });
    }
    
    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(delayDate)) {
      return res.status(400).json({
        success: false,
        error: '올바른 날짜 형식이 아닙니다. (YYYY-MM-DD)'
      });
    }
    
    // 연기 날짜가 과거가 아닌지 확인
    const today = new Date().toISOString().split('T')[0];
    if (delayDate <= today) {
      return res.status(400).json({
        success: false,
        error: '연기 날짜는 오늘 이후로 설정해주세요.'
      });
    }
    
    // 배송 정보 존재 여부 확인
    const [deliveryCheck] = await executeWithRetry(() =>
      pool.execute(
        'SELECT id, tracking_number, customer_name, status FROM deliveries WHERE tracking_number = ?',
        [trackingNumber]
      )
    );
    
    if (deliveryCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: '해당 배송을 찾을 수 없습니다.'
      });
    }
    
    const delivery = deliveryCheck[0];
    
    // 이미 완료된 배송은 연기할 수 없음
    if (delivery.status === 'delivery_completed' || delivery.status === 'collection_completed' || delivery.status === 'processing_completed') {
      return res.status(400).json({
        success: false,
        error: '이미 완료된 배송은 연기할 수 없습니다.'
      });
    }
    
    // action_date와 action_time 처리
    const { action_date, action_time } = req.body;
    
    console.log('🔄 [배송연기] action 필드 수신:', {
      action_date,
      action_time,
      hasActionDate: !!action_date,
      hasActionTime: !!action_time,
      trackingNumber
    });
    
    // action_date/time 컬럼 확인 및 생성 (production 환경에서 실패할 수 있음)
    let hasActionColumns = false;
    try {
      hasActionColumns = await ensureActionDateTimeColumns();
    } catch (error) {
      console.log('⚠️ action_date/time 컬럼 생성 실패, 기본 SQL 사용:', error.message);
    }
    
    // PlanetScale 환경에서는 DDL 제한으로 인해 컬럼을 생성할 수 없음
    // driver_notes에 JSON 형태로 action 정보 포함
    const actionInfo = action_date && action_time ? 
      ` [액션: ${action_date} ${action_time}]` : '';
    
    const noteText = `배송연기 (${delayDate})${delayReason ? ': ' + delayReason : ''}${actionInfo}`;
    
    // action_date/time 컬럼이 존재하는 경우와 없는 경우를 구분하여 처리
    let updateResult;
    if (hasActionColumns) {
      // 컬럼이 존재하는 경우: action_date/time 포함
      [updateResult] = await executeWithRetry(() =>
        pool.execute(
          `UPDATE deliveries SET 
             status = '배송연기',
             driver_notes = CONCAT(COALESCE(driver_notes, ''), IF(COALESCE(driver_notes, '') = '', '', '\n'), ?),
             action_date = ?,
             action_time = ?,
             updated_at = NOW()
           WHERE tracking_number = ?`,
          [noteText, action_date, action_time, trackingNumber]
        )
      );
    } else {
      // 컬럼이 없는 경우: action_date/time을 driver_notes에 포함
      [updateResult] = await executeWithRetry(() =>
        pool.execute(
          `UPDATE deliveries SET 
             status = '배송연기',
             driver_notes = CONCAT(COALESCE(driver_notes, ''), IF(COALESCE(driver_notes, '') = '', '', '\n'), ?),
             updated_at = NOW()
           WHERE tracking_number = ?`,
          [noteText, trackingNumber]
        )
      );
    }
    
    console.log('📝 [배송연기] SQL 실행 결과:', {
      affectedRows: updateResult.affectedRows,
      action_date,
      action_time
    });
    
    if (updateResult.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        error: '배송연기 처리에 실패했습니다.'
      });
    }
    
    console.log('배송연기 처리 완료:', {
      trackingNumber,
      customerName: delivery.customer_name,
      previousStatus: delivery.status,
      newStatus: '배송연기',
      delayDate,
      delayReason
    });
    
    const responseData = {
      trackingNumber,
      customerName: delivery.customer_name,
      previousStatus: delivery.status,
      newStatus: '배송연기',
      delayDate,
      delayReason: delayReason || null
    };
    
    // action_date/time 컬럼이 존재하는 경우에만 포함
    if (hasActionColumns) {
      responseData.action_date = action_date;
      responseData.action_time = action_time;
    }

    res.json({
      success: true,
      message: '배송이 성공적으로 연기되었습니다.',
      data: responseData
    });
    
  } catch (error) {
    console.error('배송연기 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '배송연기 처리 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

/**
 * 배송 취소 처리
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function cancelDelivery(req, res) {
  try {
    const deliveryId = req.params.id;
    const { cancelReason } = req.body;
    
    console.log('배송취소 요청:', {
      deliveryId,
      cancelReason,
      userId: req.user?.user_id
    });
    
    // 입력 검증
    if (!cancelReason || cancelReason.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '취소 사유를 입력해주세요.'
      });
    }
    
    // 배송 정보 존재 여부 확인
    const [deliveryCheck] = await pool.execute(
      'SELECT id, tracking_number, customer_name, status, canceled_at FROM deliveries WHERE id = ?',
      [deliveryId]
    );
    
    if (deliveryCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: '해당 배송을 찾을 수 없습니다.'
      });
    }
    
    const delivery = deliveryCheck[0];
    
    // 이미 취소된 배송은 다시 취소할 수 없음
    if (delivery.canceled_at) {
      return res.status(400).json({
        success: false,
        error: '이미 취소된 배송입니다.'
      });
    }
    
    // 이미 완료된 배송은 취소할 수 없음
    if (delivery.status === 'delivery_completed' || delivery.status === 'collection_completed' || delivery.status === 'processing_completed') {
      return res.status(400).json({
        success: false,
        error: '이미 완료된 배송은 취소할 수 없습니다.'
      });
    }
    
    // 현재 시간
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // action_date와 action_time 처리
    const { action_date, action_time } = req.body;
    
    // action_date/time 컬럼 확인 및 생성 (production 환경에서 실패할 수 있음)
    let hasActionColumns = false;
    try {
      hasActionColumns = await ensureActionDateTimeColumns();
    } catch (error) {
      console.log('⚠️ action_date/time 컬럼 생성 실패, 기본 SQL 사용:', error.message);
    }
    
    // PlanetScale 환경에서는 DDL 제한으로 인해 컬럼을 생성할 수 없음  
    // driver_notes에 action 정보 포함
    const actionInfo = action_date && action_time ? 
      ` [액션: ${action_date} ${action_time}]` : '';
    
    const noteText = `배송취소 (${now}): ${cancelReason.trim()}${actionInfo}`;
    
    // action_date/time 컬럼이 존재하는 경우와 없는 경우를 구분하여 처리
    let updateResult;
    if (hasActionColumns) {
      // 컬럼이 존재하는 경우: action_date/time 포함
      [updateResult] = await executeWithRetry(() =>
        pool.execute(
          `UPDATE deliveries SET 
             cancel_status = 1,
             cancel_reason = ?, 
             canceled_at = ?,
             status = '배송취소',
             driver_notes = CONCAT(COALESCE(driver_notes, ''), IF(COALESCE(driver_notes, '') = '', '', '\n'), ?),
             action_date = ?,
             action_time = ?,
             updated_at = NOW()
           WHERE id = ?`,
          [cancelReason.trim(), now, noteText, action_date, action_time, deliveryId]
        )
      );
    } else {
      // 컬럼이 없는 경우: action_date/time을 driver_notes에 포함
      [updateResult] = await executeWithRetry(() =>
        pool.execute(
          `UPDATE deliveries SET 
             cancel_status = 1,
             cancel_reason = ?, 
             canceled_at = ?,
             status = '배송취소',
             driver_notes = CONCAT(COALESCE(driver_notes, ''), IF(COALESCE(driver_notes, '') = '', '', '\n'), ?),
             updated_at = NOW()
           WHERE id = ?`,
          [cancelReason.trim(), now, noteText, deliveryId]
        )
      );
    }
    
    if (updateResult.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        error: '배송취소 처리에 실패했습니다.'
      });
    }
    
    console.log('배송 취소 처리 완료:', {
      deliveryId,
      trackingNumber: delivery.tracking_number,
      customerName: delivery.customer_name,
      previousStatus: delivery.status,
      newStatus: '배송취소',
      cancelReason: cancelReason.trim(),
      canceledAt: now
    });
    
    // 실시간 업데이트 브로드캐스트
    const io = req.app.get('io');
    if (io) {
      io.to('delivery_updates').emit('delivery_cancelled', {
        id: parseInt(deliveryId),
        status: '배송취소',
        cancelReason: cancelReason.trim(),
        timestamp: now
      });
    }
    
    res.json({
      success: true,
      message: '배송이 성공적으로 취소되었습니다.',
      data: {
        deliveryId,
        trackingNumber: delivery.tracking_number,
        customerName: delivery.customer_name,
        previousStatus: delivery.status,
        newStatus: '배송취소',
        cancelReason: cancelReason.trim(),
        canceledAt: now,
        action_date,
        action_time
      }
    });
    
  } catch (error) {
    console.error('배송 취소 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '배송 취소 처리 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

/**
 * 테스트 배송 데이터 생성 (개발용)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function createTestData(req, res) {
  try {
    // test-token 사용자만 사용 가능
    if (!req.user || req.user.id !== 'test-user') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '테스트 데이터 생성 권한이 없습니다.'
      });
    }

    const testDeliveries = [
      {
        sender_name: '테스트 발송인1',
        sender_phone: '010-1111-2222',
        sender_address: '서울시 강남구 테스트로 123',
        receiver_name: '테스트 수취인1',
        receiver_phone: '010-3333-4444',
        receiver_address: '부산시 해운대구 배송로 456',
        product_name: '테스트 상품1',
        request_type: '일반',
        status: 'pending'
      },
      {
        sender_name: '테스트 발송인2',
        sender_phone: '010-5555-6666',
        sender_address: '대구시 중구 샘플길 789',
        receiver_name: '테스트 수취인2',
        receiver_phone: '010-7777-8888',
        receiver_address: '광주시 북구 예시로 321',
        product_name: '테스트 상품2',
        request_type: '네이버',
        status: 'in_transit'
      },
      {
        sender_name: '테스트 발송인3',
        sender_phone: '010-9999-0000',
        sender_address: '인천시 남동구 데모로 654',
        receiver_name: '테스트 수취인3',
        receiver_phone: '010-1234-5678',
        receiver_address: '대전시 서구 시험길 987',
        product_name: '테스트 상품3',
        request_type: '쿠팡',
        status: 'delivery_completed'
      }
    ];

    const createdDeliveries = [];

    for (const deliveryData of testDeliveries) {
      // 트래킹 번호 생성
      const trackingNumber = await generateTrackingNumber();
      
      const [result] = await executeWithRetry(() => 
        pool.execute(`
          INSERT INTO deliveries (
            tracking_number, sender_name, sender_phone, sender_address,
            receiver_name, receiver_phone, receiver_address, product_name,
            request_type, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          trackingNumber,
          deliveryData.sender_name,
          deliveryData.sender_phone,
          deliveryData.sender_address,
          deliveryData.receiver_name,
          deliveryData.receiver_phone,
          deliveryData.receiver_address,
          deliveryData.product_name,
          deliveryData.request_type,
          deliveryData.status
        ])
      );

      createdDeliveries.push({
        id: result.insertId,
        tracking_number: trackingNumber,
        ...deliveryData
      });
    }

    res.json({
      success: true,
      message: `${createdDeliveries.length}개의 테스트 배송 데이터가 생성되었습니다.`,
      deliveries: createdDeliveries
    });

  } catch (error) {
    console.error('테스트 데이터 생성 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '테스트 데이터 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

/**
 * 강제 컬럼 생성 (production용)
 */
async function forceCreateColumns(req, res) {
  try {
    console.log('🚀 강제 컬럼 생성 시작...');
    
    // 먼저 현재 컬럼 상태 확인
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deliveries' 
      AND COLUMN_NAME IN ('action_date', 'action_time')
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 기존 action 컬럼:', existingColumns);
    
    const results = [];
    
    // action_date 컬럼 강제 생성
    if (!existingColumns.includes('action_date')) {
      try {
        await pool.execute(`ALTER TABLE deliveries ADD COLUMN action_date DATE NULL`);
        console.log('✅ action_date 컬럼 추가 완료');
        results.push({ column: 'action_date', status: 'created' });
      } catch (error) {
        console.error('❌ action_date 컬럼 추가 실패:', error.message);
        results.push({ column: 'action_date', status: 'failed', error: error.message });
      }
    } else {
      console.log('ℹ️ action_date 컬럼이 이미 존재함');
      results.push({ column: 'action_date', status: 'already_exists' });
    }
    
    // action_time 컬럼 강제 생성
    if (!existingColumns.includes('action_time')) {
      try {
        await pool.execute(`ALTER TABLE deliveries ADD COLUMN action_time TIME NULL`);
        console.log('✅ action_time 컬럼 추가 완료');
        results.push({ column: 'action_time', status: 'created' });
      } catch (error) {
        console.error('❌ action_time 컬럼 추가 실패:', error.message);
        results.push({ column: 'action_time', status: 'failed', error: error.message });
      }
    } else {
      console.log('ℹ️ action_time 컬럼이 이미 존재함');
      results.push({ column: 'action_time', status: 'already_exists' });
    }
    
    // 최종 상태 확인
    const [finalColumns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deliveries' 
      AND COLUMN_NAME IN ('action_date', 'action_time')
    `);
    
    res.json({
      success: true,
      message: '강제 컬럼 생성 완료',
      results,
      finalColumns: finalColumns.map(col => col.COLUMN_NAME)
    });
    
  } catch (error) {
    console.error('❌ 강제 컬럼 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '강제 컬럼 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

/**
 * 컬럼 상태 확인 (디버깅용)
 * @param {Object} req - Express 요청 객체  
 * @param {Object} res - Express 응답 객체
 */
async function checkColumns(req, res) {
  try {
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deliveries' 
      ORDER BY ORDINAL_POSITION
    `);
    
    const actionColumns = columns.filter(col => 
      col.COLUMN_NAME.includes('action') || 
      col.COLUMN_NAME.includes('visit') ||
      ['id', 'tracking_number', 'status'].includes(col.COLUMN_NAME)
    );
    
    // 모든 컬럼 이름 목록도 반환
    const allColumnNames = columns.map(col => col.COLUMN_NAME);
    
    res.json({
      success: true,
      allColumns: columns.length,
      allColumnNames: allColumnNames,
      relevantColumns: actionColumns,
      hasActionDate: columns.some(col => col.COLUMN_NAME === 'action_date'),
      hasActionTime: columns.some(col => col.COLUMN_NAME === 'action_time')
    });
  } catch (error) {
    console.error('컬럼 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: '컬럼 확인 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

/**
 * 수동 마이그레이션 실행 (개발/테스트용)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function runMigration(req, res) {
  try {
    console.log('🔄 [수동 마이그레이션] 시작...');
    const success = await ensureActionDateTimeColumns();
    
    if (success) {
      res.json({
        success: true,
        message: 'action_date, action_time 컬럼 마이그레이션이 완료되었습니다.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '마이그레이션 중 오류가 발생했습니다.'
      });
    }
  } catch (error) {
    console.error('마이그레이션 실행 오류:', error);
    res.status(500).json({
      success: false,
      message: '마이그레이션 실행 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

/**
 * 모든 배송 데이터 삭제 (테스트용)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function deleteAllDeliveries(req, res) {
  console.log('🗑️ 모든 배송 데이터 삭제 요청 - 사용자:', req.user?.username);
  
  try {
    // 관리자 권한 확인
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }

    // 삭제 전 현재 데이터 개수 확인
    const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM deliveries');
    const totalCount = countResult[0].count;
    
    console.log(`📊 삭제 대상 배송 데이터: ${totalCount}개`);

    // 모든 배송 데이터 삭제
    const [deleteResult] = await pool.execute('DELETE FROM deliveries');
    
    console.log('✅ 모든 배송 데이터가 성공적으로 삭제되었습니다.');
    console.log(`📋 삭제된 레코드 수: ${deleteResult.affectedRows}`);

    res.json({
      success: true,
      message: `총 ${totalCount}개의 배송 데이터가 성공적으로 삭제되었습니다.`,
      deletedCount: deleteResult.affectedRows,
      totalCount: totalCount
    });

  } catch (error) {
    console.error('❌ 배송 데이터 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '배송 데이터 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

module.exports = {
  createDelivery,
  getDeliveries,
  getDelivery,
  trackDelivery,
  updateDeliveryStatus,
  updateDelivery,
  completeDelivery,
  postponeDelivery,
  delayDelivery,
  cancelDelivery,
  createTestData,
  runMigration,
  forceCreateColumns,
  checkColumns,
  deleteAllDeliveries
};