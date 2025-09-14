const { pool } = require('../config/database');

/**
 * 의뢰타입 목록 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function getRequestTypes(req, res) {
  try {
    console.log('[의뢰타입 목록 조회] 시작');

    // 활성화된 의뢰타입만 조회, 정렬 순서대로
    const [requestTypes] = await pool.execute(`
      SELECT id, name, description, sort_order
      FROM request_types 
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, name ASC
    `);

    console.log(`[의뢰타입 목록 조회] ${requestTypes.length}개 조회 완료`);

    res.json({
      success: true,
      data: requestTypes,
      message: '의뢰타입 목록을 성공적으로 조회했습니다.'
    });

  } catch (error) {
    console.error('[의뢰타입 목록 조회] 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: '의뢰타입 목록 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 의뢰타입 생성 (관리자만)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function createRequestType(req, res) {
  try {
    const user = req.user || req.session?.user;
    
    // 관리자 권한 확인
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '관리자 권한이 필요합니다.'
      });
    }

    const { name, description, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: '의뢰타입 이름은 필수입니다.'
      });
    }

    console.log('[의뢰타입 생성] 시작:', { name, description, sort_order });

    const [result] = await pool.execute(`
      INSERT INTO request_types (name, description, sort_order)
      VALUES (?, ?, ?)
    `, [name, description || null, sort_order || 0]);

    console.log('[의뢰타입 생성] 완료:', result.insertId);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name,
        description,
        sort_order
      },
      message: '의뢰타입이 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('[의뢰타입 생성] 오류:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: '이미 존재하는 의뢰타입 이름입니다.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: '의뢰타입 생성 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 의뢰타입 수정 (관리자만)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function updateRequestType(req, res) {
  try {
    const user = req.user || req.session?.user;
    
    // 관리자 권한 확인
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '관리자 권한이 필요합니다.'
      });
    }

    const { id } = req.params;
    const { name, description, sort_order, is_active } = req.body;

    console.log('[의뢰타입 수정] 시작:', { id, name, description, sort_order, is_active });

    const [result] = await pool.execute(`
      UPDATE request_types 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          sort_order = COALESCE(?, sort_order),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, sort_order, is_active, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: '의뢰타입을 찾을 수 없습니다.'
      });
    }

    console.log('[의뢰타입 수정] 완료:', id);

    res.json({
      success: true,
      message: '의뢰타입이 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('[의뢰타입 수정] 오류:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: '이미 존재하는 의뢰타입 이름입니다.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: '의뢰타입 수정 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 의뢰타입 삭제 (관리자만)
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function deleteRequestType(req, res) {
  try {
    const user = req.user || req.session?.user;
    
    // 관리자 권한 확인
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '관리자 권한이 필요합니다.'
      });
    }

    const { id } = req.params;

    console.log('[의뢰타입 삭제] 시작:', id);

    // 실제 삭제 대신 비활성화
    const [result] = await pool.execute(`
      UPDATE request_types 
      SET is_active = FALSE,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: '의뢰타입을 찾을 수 없습니다.'
      });
    }

    console.log('[의뢰타입 삭제] 완료:', id);

    res.json({
      success: true,
      message: '의뢰타입이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('[의뢰타입 삭제] 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: '의뢰타입 삭제 중 오류가 발생했습니다.'
    });
  }
}

module.exports = {
  getRequestTypes,
  createRequestType,
  updateRequestType,
  deleteRequestType
};