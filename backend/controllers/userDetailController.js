const pool = require('../config/database');

// 사용자별 상세정보 조회
const getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`📋 사용자 상세정보 조회 요청 - userId: ${userId}`);
    
    const [details] = await pool.execute(
      'SELECT * FROM user_detail WHERE user_id = ?',
      [userId]
    );
    
    if (details.length === 0) {
      return res.json({
        success: true,
        message: '사용자 상세정보가 없습니다.',
        data: null
      });
    }
    
    const detail = details[0];
    
    // JSON 데이터 파싱
    let parsedDetail = {};
    try {
      parsedDetail = typeof detail.detail === 'string' 
        ? JSON.parse(detail.detail) 
        : detail.detail;
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      parsedDetail = {};
    }
    
    const result = {
      id: detail.id,
      user_id: detail.user_id,
      role: detail.role,
      detail: parsedDetail,
      created_at: detail.created_at,
      updated_at: detail.updated_at
    };
    
    console.log('✅ 사용자 상세정보 조회 성공:', result);
    
    res.json({
      success: true,
      message: '사용자 상세정보 조회 성공',
      data: result
    });
    
  } catch (error) {
    console.error('❌ 사용자 상세정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 상세정보 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 사용자 상세정보 생성
const createUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, detail } = req.body;
    
    console.log(`📝 사용자 상세정보 생성 요청 - userId: ${userId}, role: ${role}`);
    console.log('상세정보 데이터:', detail);
    
    // 입력값 검증
    if (!role || !detail) {
      return res.status(400).json({
        success: false,
        message: 'role과 detail은 필수 입력값입니다.'
      });
    }
    
    // 사용자 존재 확인
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '존재하지 않는 사용자입니다.'
      });
    }
    
    // 기존 상세정보 존재 확인
    const [existing] = await pool.execute(
      'SELECT id FROM user_detail WHERE user_id = ?',
      [userId]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: '이미 상세정보가 존재합니다. 업데이트를 사용하세요.'
      });
    }
    
    // JSON 문자열로 변환
    const detailJson = JSON.stringify(detail);
    
    const [result] = await pool.execute(
      'INSERT INTO user_detail (user_id, role, detail) VALUES (?, ?, ?)',
      [userId, role, detailJson]
    );
    
    console.log('✅ 사용자 상세정보 생성 성공 - ID:', result.insertId);
    
    res.json({
      success: true,
      message: '사용자 상세정보가 성공적으로 생성되었습니다.',
      data: {
        id: result.insertId,
        user_id: userId,
        role: role,
        detail: detail
      }
    });
    
  } catch (error) {
    console.error('❌ 사용자 상세정보 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 상세정보 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 사용자 상세정보 업데이트
const updateUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, detail } = req.body;
    
    console.log(`📝 사용자 상세정보 업데이트 요청 - userId: ${userId}`);
    console.log('업데이트 데이터:', { role, detail });
    
    // 입력값 검증
    if (!detail) {
      return res.status(400).json({
        success: false,
        message: 'detail은 필수 입력값입니다.'
      });
    }
    
    // 기존 상세정보 존재 확인
    const [existing] = await pool.execute(
      'SELECT id, role FROM user_detail WHERE user_id = ?',
      [userId]
    );
    
    if (existing.length === 0) {
      // 상세정보가 없으면 생성
      return createUserDetail(req, res);
    }
    
    // 업데이트할 필드 준비
    const updateFields = [];
    const updateValues = [];
    
    if (role && role !== existing[0].role) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    
    updateFields.push('detail = ?');
    updateValues.push(JSON.stringify(detail));
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId);
    
    const query = `UPDATE user_detail SET ${updateFields.join(', ')} WHERE user_id = ?`;
    
    await pool.execute(query, updateValues);
    
    console.log('✅ 사용자 상세정보 업데이트 성공');
    
    res.json({
      success: true,
      message: '사용자 상세정보가 성공적으로 업데이트되었습니다.',
      data: {
        user_id: userId,
        role: role || existing[0].role,
        detail: detail
      }
    });
    
  } catch (error) {
    console.error('❌ 사용자 상세정보 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 상세정보 업데이트 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 사용자 상세정보 삭제
const deleteUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🗑️ 사용자 상세정보 삭제 요청 - userId: ${userId}`);
    
    // 기존 상세정보 존재 확인
    const [existing] = await pool.execute(
      'SELECT id FROM user_detail WHERE user_id = ?',
      [userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '삭제할 상세정보가 존재하지 않습니다.'
      });
    }
    
    await pool.execute(
      'DELETE FROM user_detail WHERE user_id = ?',
      [userId]
    );
    
    console.log('✅ 사용자 상세정보 삭제 성공');
    
    res.json({
      success: true,
      message: '사용자 상세정보가 성공적으로 삭제되었습니다.'
    });
    
  } catch (error) {
    console.error('❌ 사용자 상세정보 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 상세정보 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

module.exports = {
  getUserDetail,
  createUserDetail,
  updateUserDetail,
  deleteUserDetail
};