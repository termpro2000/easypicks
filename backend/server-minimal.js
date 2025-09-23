const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 기본 미들웨어만
app.use(express.json());

// 데이터베이스 설정 (단순화)
const { pool, generateTrackingNumber } = require('./config/database');

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.json({
    message: '배송접수 웹앱 API - 최소버전',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 데이터베이스 상태 확인
app.get('/db-test', async (req, res) => {
  try {
    const [result] = await pool.execute('SELECT 1 as test');
    res.json({ 
      status: 'OK', 
      database: 'connected',
      result: result[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 배송 생성 (52개 필드 지원)
app.post('/api/deliveries', async (req, res) => {
  try {
    console.log('📦 새로운 배송 접수 생성 시작');
    
    const {
      sender_name, sender_company, sender_phone, sender_email,
      sender_address, sender_detail_address, sender_zipcode,
      receiver_name, receiver_phone, receiver_email,
      receiver_address, receiver_detail_address, receiver_zipcode,
      customer_name, customer_phone, customer_address,
      product_name, product_sku, product_quantity, seller_info,
      has_elevator, can_use_ladder_truck, preferred_delivery_date,
      is_fragile, is_frozen, requires_signature, insurance_amount,
      delivery_memo, special_instructions
    } = req.body;

    // 필드명 통일
    const finalReceiverName = receiver_name || customer_name;
    const finalReceiverPhone = receiver_phone || customer_phone; 
    const finalReceiverAddress = receiver_address || customer_address;

    // 필수 필드 검증
    if (!sender_name || !sender_address || !finalReceiverName || !finalReceiverPhone || !finalReceiverAddress) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '필수 필드가 누락되었습니다.'
      });
    }

    // 운송장 번호 생성
    const tracking_number = generateTrackingNumber();

    // 컬럼 확인
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deliveries'
      ORDER BY ORDINAL_POSITION
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);

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

    // 숫자 파싱 함수
    const parseNumber = (value) => {
      if (!value) return null;
      if (typeof value === 'number') return value;
      const numericValue = parseFloat(value.toString().replace(/[^0-9.]/g, ''));
      return isNaN(numericValue) ? null : numericValue;
    };

    // 추가 필드들
    const additionalFields = [
      { column: 'weight', value: parseNumber(req.body.weight || req.body.product_weight) },
      { column: 'driver_id', value: req.body.driver_id || null },
      { column: 'construction_type', value: req.body.construction_type },
      { column: 'visit_date', value: preferred_delivery_date || req.body.visit_date },
      { column: 'visit_time', value: req.body.visit_time },
      { column: 'furniture_company', value: sender_company || req.body.furniture_company },
      { column: 'emergency_contact', value: req.body.emergency_contact },
      { column: 'main_memo', value: req.body.main_memo || delivery_memo },
      { column: 'special_instructions', value: special_instructions },
      { column: 'detail_notes', value: req.body.detail_notes },
      { column: 'driver_notes', value: req.body.driver_notes },
      { column: 'building_type', value: req.body.building_type },
      { column: 'floor_count', value: req.body.floor_count },
      { column: 'elevator_available', value: has_elevator ? '있음' : (req.body.elevator_available || '없음') },
      { column: 'ladder_truck', value: can_use_ladder_truck ? '필요' : (req.body.ladder_truck || '불필요') },
      { column: 'disposal', value: req.body.disposal },
      { column: 'room_movement', value: req.body.room_movement },
      { column: 'wall_construction', value: req.body.wall_construction },
      { column: 'furniture_product_code', value: product_sku || req.body.furniture_product_code },
      { column: 'product_weight', value: req.body.product_weight },
      { column: 'product_size', value: req.body.product_size },
      { column: 'box_size', value: req.body.box_size },
      { column: 'furniture_requests', value: req.body.furniture_requests },
      { column: 'fragile', value: is_fragile ? 1 : (req.body.fragile ? 1 : 0) },
      { column: 'installation_photos', value: req.body.installation_photos ? JSON.stringify(req.body.installation_photos) : null },
      { column: 'customer_signature', value: req.body.customer_signature },
      { column: 'delivery_fee', value: parseNumber(req.body.delivery_fee) || 0 },
      { column: 'insurance_value', value: parseNumber(insurance_amount || req.body.insurance_value) || 0 },
      { column: 'cod_amount', value: parseNumber(req.body.cod_amount) || 0 },
      { column: 'estimated_delivery', value: preferred_delivery_date || req.body.estimated_delivery },
      { column: 'actual_delivery', value: req.body.actual_delivery },
      { column: 'completed_at', value: req.body.completed_at },
      { column: 'priority', value: req.body.priority || '보통' },
      { column: 'delivery_type', value: req.body.delivery_type || '일반배송' },
      { column: 'payment_method', value: req.body.payment_method },
      { column: 'shipping_method', value: req.body.shipping_method },
      { column: 'sender_phone', value: sender_phone },
      { column: 'sender_email', value: sender_email },
      { column: 'receiver_phone', value: finalReceiverPhone },
      { column: 'receiver_email', value: receiver_email },
      { column: 'sender_zipcode', value: sender_zipcode },
      { column: 'receiver_zipcode', value: receiver_zipcode },
      { column: 'sender_detail_address', value: sender_detail_address },
      { column: 'receiver_detail_address', value: receiver_detail_address },
      { column: 'product_quantity', value: product_quantity || 1 },
      { column: 'seller_info', value: seller_info },
      { column: 'frozen', value: is_frozen ? 1 : (req.body.frozen ? 1 : 0) },
      { column: 'signature_required', value: requires_signature ? 1 : (req.body.signature_required ? 1 : 0) },
      { column: 'notes', value: req.body.notes },
      { column: 'cancellation_reason', value: req.body.cancellation_reason },
      { column: 'cancelled_at', value: req.body.cancelled_at },
      { column: 'updated_at', value: req.body.updated_at }
    ];

    // 실제 존재하는 컬럼만 필터링
    const validAdditionalFields = additionalFields.filter(field => 
      existingColumns.includes(field.column)
    );

    // 최종 컬럼과 값 배열
    const finalColumns = [...baseColumns, ...validAdditionalFields.map(f => f.column)];
    const finalValues = [...baseValues, ...validAdditionalFields.map(f => f.value)];

    // INSERT 쿼리 생성
    const placeholders = finalColumns.map(() => '?').join(', ');
    const insertQuery = `INSERT INTO deliveries (${finalColumns.join(', ')}) VALUES (${placeholders})`;

    // 배송 데이터 삽입
    const [result] = await pool.execute(insertQuery, finalValues);
    
    console.log('✅ 배송 접수 생성 완료:', {
      insertId: result.insertId,
      trackingNumber: tracking_number,
      totalFields: finalColumns.length
    });

    res.status(201).json({
      success: true,
      message: '배송 접수가 성공적으로 생성되었습니다.',
      delivery: {
        id: result.insertId,
        tracking_number: tracking_number,
        status: '접수완료',
        sender_name: sender_name,
        customer_name: finalReceiverName,
        product_name: product_name,
        created_at: new Date().toISOString(),
        fieldsStored: finalColumns.length
      }
    });

  } catch (error) {
    console.error('❌ 배송 접수 생성 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 접수 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 배송 목록 조회
app.get('/api/deliveries', async (req, res) => {
  try {
    const [deliveries] = await pool.execute('SELECT * FROM deliveries ORDER BY created_at DESC');
    res.json({
      success: true,
      count: deliveries.length,
      deliveries: deliveries
    });
  } catch (error) {
    console.error('❌ 배송 목록 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '배송 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});