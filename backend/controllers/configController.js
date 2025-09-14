const fs = require('fs').promises;
const path = require('path');

/**
 * request_type.txt 파일을 읽어서 의뢰타입 목록을 반환
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function getRequestTypes(req, res) {
  try {
    // 메인 디렉토리의 request_type.txt 파일 경로
    const filePath = path.join(__dirname, '../../..', 'request_type.txt');
    
    try {
      // 파일 읽기
      const fileContent = await fs.readFile(filePath, 'utf8');
      const requestTypes = fileContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      res.json({
        requestTypes,
        message: '의뢰타입 목록을 성공적으로 조회했습니다.'
      });
      
    } catch (fileError) {
      // 파일이 없으면 기본값으로 생성
      console.log('request_type.txt 파일이 없어서 기본값으로 생성합니다.');
      
      const defaultTypes = ['일반', '회수', '조치', '쿠팡', '네이버'];
      const defaultContent = defaultTypes.join('\n');
      
      await fs.writeFile(filePath, defaultContent, 'utf8');
      
      res.json({
        requestTypes: defaultTypes,
        message: '의뢰타입 파일을 생성하고 기본값을 반환했습니다.'
      });
    }
    
  } catch (error) {
    console.error('의뢰타입 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '의뢰타입 조회 중 오류가 발생했습니다.'
    });
  }
}

/**
 * request_type.txt 파일을 업데이트
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 */
async function updateRequestTypes(req, res) {
  try {
    // JWT 또는 세션 기반 인증 지원
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    // 관리자만 수정 가능
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '의뢰타입 수정은 관리자만 가능합니다.'
      });
    }

    const { requestTypes } = req.body;
    
    if (!Array.isArray(requestTypes)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '의뢰타입은 배열 형태로 제공되어야 합니다.'
      });
    }

    // 빈 값 제거 및 유효성 검증
    const validTypes = requestTypes
      .map(type => String(type).trim())
      .filter(type => type.length > 0);
    
    if (validTypes.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '최소 하나 이상의 의뢰타입이 필요합니다.'
      });
    }

    // 파일 업데이트
    const filePath = path.join(__dirname, '../../..', 'request_type.txt');
    const content = validTypes.join('\n');
    
    await fs.writeFile(filePath, content, 'utf8');
    
    res.json({
      requestTypes: validTypes,
      message: '의뢰타입이 성공적으로 업데이트되었습니다.'
    });
    
  } catch (error) {
    console.error('의뢰타입 업데이트 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '의뢰타입 업데이트 중 오류가 발생했습니다.'
    });
  }
}

module.exports = {
  getRequestTypes,
  updateRequestTypes
};