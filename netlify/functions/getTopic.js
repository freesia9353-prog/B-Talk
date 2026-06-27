const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const TOPIC_MAP = {
    "슬픔": "sadness", "sad": "sadness", "sadness": "sadness", "우울": "sadness", "슬프다": "sadness",
    "행복": "happiness", "happy": "happiness", "happiness": "happiness", "기쁨": "happiness",
    "화남": "anger", "angry": "anger", "anger": "anger", "분노": "anger",
    "외로움": "loneliness", "lonely": "loneliness", "외롭다": "loneliness",
    "불안": "anxiety", "anxiety": "anxiety", "걱정": "anxiety",
    "사랑": "love", "love": "love", "연애": "love", "썸": "love",
    "친구": "friendship", "friend": "friendship", "우정": "friendship",
    "가족": "family", "family": "family",
    "음식": "food", "food": "food", "먹방": "food", "맛집": "food", "요리": "food",
    "여행": "travel", "travel": "travel", "trip": "travel",
    "음악": "music", "music": "music", "노래": "music", "kpop": "music",
    "영화": "entertainment", "movie": "entertainment", "드라마": "entertainment",
    "운동": "fitness", "fitness": "fitness", "헬스": "fitness",
    "게임": "gaming", "game": "gaming", "gaming": "gaming",
    "취업": "career", "job": "career", "career": "career", "면접": "career",
    "공부": "study", "study": "study", "학교": "study", "시험": "study",
    "돈": "money", "money": "money", "재테크": "money", "투자": "money",
    "ai": "ai", "인공지능": "ai", "chatgpt": "ai",
    "코딩": "coding", "coding": "coding", "개발": "coding",
    "스포츠": "sports", "sports": "sports", "축구": "sports", "야구": "sports",
    "정치": "politics", "politics": "politics",
    "철학": "philosophy", "philosophy": "philosophy", "인생": "philosophy",
    "건강": "health", "health": "health", "다이어트": "health",
};

function fallbackMapping(userInput) {
    const key = userInput.trim().toLowerCase().replace(/\s/g, "");
    if (TOPIC_MAP[key]) return TOPIC_MAP[key];
    for (const [k, v] of Object.entries(TOPIC_MAP)) {
        if (key.includes(k) || k.includes(key)) return v;
    }
    const cleaned = key.replace(/[^a-z0-9-]/g, "");
    return cleaned || "general";
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const userInput = body.userInput || "general";

        const prompt = `당신은 음성 채팅 앱의 주제 정규화 엔진입니다. 사용자 입력: "${userInput}". 소문자 영문/숫자/하이픈만 사용, 공백 없음, 최대 20자, 키워드 1개만 출력.`;

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(prompt);
            const raw = result.response.text();
            const topic = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ topic: topic || fallbackMapping(userInput) })
            };
        } catch (aiError) {
            console.warn("AI fallback:", aiError.message);
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ topic: fallbackMapping(userInput) })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ topic: "general" })
        };
    }
};
