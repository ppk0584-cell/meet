const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_API_KEY");

const buildPrompt = () => `휴대폰 카메라로 촬영한 정육 사진을 매장 직원이 고객에게 설명하듯 한국어로 분석해줘.
다음 형식으로 짧고 명확하게 답해:
1. 종합 판단: 좋아 보이는 점과 주의할 점
2. 육색/지방/수분감: 사진에서 보이는 특징
3. 추천 용도: 구이, 볶음, 국거리, 찜, 밀키트 중 적합한 방식
4. 보관/조리 팁: 오늘 먹을지, 냉장/냉동 보관 팁
사진만으로 확정할 수 없는 위생, 냄새, 실제 등급은 단정하지 말고 '사진상'이라고 표현해.`;

const analyzeImageData = async (data, mimeType) => {
    if (!process.env.GEMINI_API_KEY) {
        return "AI 분석 키가 아직 설정되지 않았습니다. 촬영 기능은 정상이며, 서버에 GEMINI_API_KEY를 설정하면 분석 결과가 표시됩니다.";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const imageData = {
        inlineData: {
            data,
            mimeType,
        },
    };

    const result = await model.generateContent([buildPrompt(), imageData]);
    const response = await result.response;
    return response.text();
};

exports.analyzeMeatQuality = async (imagePath) => {
    try {
        const ext = path.extname(imagePath).toLowerCase();
        const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
        return analyzeImageData(Buffer.from(fs.readFileSync(imagePath)).toString("base64"), mimeType);
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return "이미지 분석 중 오류가 발생했습니다. 나중에 다시 시도해주세요.";
    }
};

exports.analyzeMeatQualityBuffer = async (buffer, mimeType = "image/jpeg") => {
    try {
        return analyzeImageData(buffer.toString("base64"), mimeType);
    } catch (error) {
        console.error("Gemini Camera Analysis Error:", error);
        return "이미지 분석 중 오류가 발생했습니다. 나중에 다시 시도해주세요.";
    }
};
