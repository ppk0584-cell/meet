const aiService = require('../config/ai');

exports.index = (req, res) => {
    res.render('client/grill-ai/index', {
        title: 'AI 굽기 도우미',
        layout: 'layout'
    });
};

exports.analyzeFrame = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: '분석할 영상 프레임이 없습니다.' });
        }

        const result = await aiService.analyzeGrillFrameBuffer(req.file.buffer, req.file.mimetype);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            flip_status: 'wait',
            message: '프레임 분석 중 오류가 발생했습니다.',
            confidence: 0,
            visual_reason: '서버 처리 오류',
            safety_note: '사진 기반 참고 안내이며 두꺼운 고기는 내부 온도 확인을 권장합니다.'
        });
    }
};
