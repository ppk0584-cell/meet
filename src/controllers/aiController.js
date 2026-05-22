const aiService = require('../config/ai');
const path = require('path');

exports.index = (req, res) => {
    res.render('client/ai/index', {
        title: 'AI 고기 품질 분석',
        layout: 'layout',
        result: null
    });
};

exports.analyze = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('이미지를 업로드해주세요.');
        }

        const imagePath = req.file.path;
        const analysisResult = await aiService.analyzeMeatQuality(imagePath);

        res.render('client/ai/index', {
            title: 'AI 분석 결과',
            layout: 'layout',
            result: analysisResult,
            imageUrl: `/uploads/${req.file.filename}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.analyzeCamera = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: '촬영한 이미지가 없습니다.' });
        }

        const analysisResult = await aiService.analyzeMeatQualityBuffer(req.file.buffer, req.file.mimetype);
        res.json({ result: analysisResult });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '분석 중 오류가 발생했습니다.' });
    }
};
