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

const buildGrillPrompt = () => `너는 야외 그릴에서 굽는 고기의 뒤집기 타이밍을 판단하는 조리 보조 AI야.
사진 한 장만 보고 아래 JSON만 반환해. 설명 문장이나 마크다운은 쓰지 마.
판단 기준:
- 고기 상부 전체 색보다 하단 테두리, 옆면, 가장자리 육즙, 측면 갈변, 그릴 자국, 과도한 탄화를 더 중요하게 본다.
- 화면 아래쪽/측면이 충분히 익어 색이 바뀌면 뒤집기 신호로 판단한다.
- 내부 온도는 사진만으로 확정하지 않는다.
- 확신이 낮으면 wait 또는 soon을 선택한다.

JSON 형식:
{
  "flip_status": "wait|soon|now|over",
  "message": "짧은 한국어 안내",
  "confidence": 0.0,
  "visual_reason": "사진상 판단 근거",
  "safety_note": "사진 기반 참고 안내이며 두꺼운 고기는 내부 온도 확인 권장"
}`;

function parseJsonObject(text) {
    const raw = String(text || '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
        return JSON.parse(match[0]);
    } catch (error) {
        return null;
    }
}

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

const analyzeGrillData = async (data, mimeType) => {
    if (!process.env.GEMINI_API_KEY) {
        return {
            flip_status: 'wait',
            message: 'AI 분석 키가 아직 설정되지 않아 화면 색 변화 기준으로만 안내합니다.',
            confidence: 0,
            visual_reason: '서버에 GEMINI_API_KEY가 설정되면 사진 기반 AI 확인이 추가됩니다.',
            safety_note: '사진 기반 참고 안내이며 두꺼운 고기는 내부 온도 확인을 권장합니다.'
        };
    }

    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
    });
    const imageData = {
        inlineData: {
            data,
            mimeType,
        },
    };

    const result = await model.generateContent([buildGrillPrompt(), imageData]);
    const response = await result.response;
    const parsed = parseJsonObject(response.text());
    if (!parsed) {
        return {
            flip_status: 'wait',
            message: '사진을 다시 맞춰주세요.',
            confidence: 0.2,
            visual_reason: 'AI 응답을 구조화하지 못했습니다.',
            safety_note: '사진 기반 참고 안내이며 두꺼운 고기는 내부 온도 확인을 권장합니다.'
        };
    }

    return {
        flip_status: ['wait', 'soon', 'now', 'over'].includes(parsed.flip_status) ? parsed.flip_status : 'wait',
        message: parsed.message || '화면을 보며 조금 더 기다려주세요.',
        confidence: Number(parsed.confidence || 0),
        visual_reason: parsed.visual_reason || '사진상 표면 상태를 확인했습니다.',
        safety_note: parsed.safety_note || '사진 기반 참고 안내이며 두꺼운 고기는 내부 온도 확인을 권장합니다.'
    };
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

exports.analyzeGrillFrameBuffer = async (buffer, mimeType = 'image/jpeg') => {
    try {
        return analyzeGrillData(buffer.toString('base64'), mimeType);
    } catch (error) {
        console.error('Gemini Grill Analysis Error:', error);
        return {
            flip_status: 'wait',
            message: 'AI 확인 중 오류가 발생했습니다. 화면 색 변화 기준으로 계속 안내합니다.',
            confidence: 0,
            visual_reason: '서버 분석 오류',
            safety_note: '사진 기반 참고 안내이며 두꺼운 고기는 내부 온도 확인을 권장합니다.'
        };
    }
};
