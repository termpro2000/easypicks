const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pool = require('../db/connection');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// uploads/delivery_audio 디렉토리 생성 (존재하지 않을 경우)
const createUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, '../uploads/delivery_audio');
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log('오디오 업로드 디렉토리 생성:', uploadsDir);
  }
};

// multer 설정 - 오디오 파일 저장 설정
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads/delivery_audio');
    await createUploadsDir();
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // 파일명: 배송번호_현재시간_원본파일명
    const trackingNumber = req.params.trackingNumber || 'unknown';
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const fileName = `${trackingNumber}_${timestamp}_${baseName}${ext}`;
    cb(null, fileName);
  }
});

// 파일 필터링 - 오디오 파일만 허용
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'audio/mpeg',           // mp3
    'audio/mp3',            // mp3
    'audio/wav',            // wav
    'audio/wave',           // wav
    'audio/x-wav',          // wav
    'audio/aac',            // aac
    'audio/mp4',            // m4a
    'audio/x-m4a',          // m4a
    'audio/ogg',            // ogg
    'audio/webm',           // webm
    'audio/3gpp',           // 3gp (모바일 녹음)
    'audio/amr'             // amr (모바일 녹음)
  ];
  
  console.log('업로드된 파일 타입:', file.mimetype);
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('오디오 파일만 업로드 가능합니다. 지원 형식: MP3, WAV, AAC, M4A, OGG, 3GP, AMR'), false);
  }
};

// multer 인스턴스 생성
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB 제한 (녹음 파일은 용량이 클 수 있음)
  },
  fileFilter: fileFilter
});

// 배송별 오디오 파일 업로드
router.post('/upload/:trackingNumber', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    console.log('오디오 파일 업로드 요청:', {
      trackingNumber,
      file: req.file,
      userId: req.user?.user_id
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '업로드할 오디오 파일이 없습니다.'
      });
    }

    // 파일 정보
    const fileInfo = {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date()
    };

    console.log('오디오 파일 업로드 완료:', fileInfo);

    res.json({
      success: true,
      message: '오디오 파일이 성공적으로 업로드되었습니다.',
      file: {
        fileName: fileInfo.fileName,
        originalName: fileInfo.originalName,
        size: fileInfo.size,
        mimetype: fileInfo.mimetype,
        uploadedAt: fileInfo.uploadedAt
      }
    });

  } catch (error) {
    console.error('오디오 파일 업로드 오류:', error);
    
    // 업로드된 파일이 있다면 삭제
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('임시 파일 삭제 실패:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: '오디오 파일 업로드 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 배송별 오디오 파일 목록 조회
router.get('/:trackingNumber', authenticateToken, async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const audioDir = path.join(__dirname, '../uploads/delivery_audio');
    
    console.log('오디오 파일 목록 조회:', trackingNumber);

    try {
      const files = await fs.readdir(audioDir);
      const audioFiles = files.filter(file => file.startsWith(`${trackingNumber}_`));
      
      const fileList = await Promise.all(audioFiles.map(async (fileName) => {
        const filePath = path.join(audioDir, fileName);
        const stats = await fs.stat(filePath);
        
        return {
          fileName,
          size: stats.size,
          uploadedAt: stats.mtime,
          url: `/uploads/delivery_audio/${fileName}`
        };
      }));

      res.json({
        success: true,
        files: fileList,
        count: fileList.length
      });

    } catch (error) {
      console.log('오디오 디렉토리 없음 또는 파일 없음:', error.message);
      res.json({
        success: true,
        files: [],
        count: 0
      });
    }

  } catch (error) {
    console.error('오디오 파일 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '오디오 파일 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 오디오 파일 삭제
router.delete('/:trackingNumber/:fileName', authenticateToken, async (req, res) => {
  try {
    const { trackingNumber, fileName } = req.params;
    
    // 보안을 위해 파일명이 해당 배송번호로 시작하는지 확인
    if (!fileName.startsWith(`${trackingNumber}_`)) {
      return res.status(403).json({
        success: false,
        error: '해당 배송의 파일이 아닙니다.'
      });
    }

    const filePath = path.join(__dirname, '../uploads/delivery_audio', fileName);
    
    await fs.unlink(filePath);
    
    console.log('오디오 파일 삭제 완료:', fileName);

    res.json({
      success: true,
      message: '오디오 파일이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('오디오 파일 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '오디오 파일 삭제 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;