const fetch = require("node-fetch");
 
exports.handler = async function (event) {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
 
    let userInput = "";
    try {
        const body = JSON.parse(event.body);
        userInput = body.userInput || "";
    } catch (e) { return { statusCode: 400, body: "Invalid JSON" }; }
 
    const systemPrompt = `
You are a voice chat room topic normalizer.
Your job is to convert any user input into a single, canonical English keyword — regardless of the input language.
 
[RULES]
1. Analyze the MEANING of the input, not the language.
2. Output EXACTLY ONE English word (lowercase, no spaces, no punctuation).
3. Normalize synonyms and translations to the same word:
   - "햄스터", "hamster", "ハムスター" → "hamster"
   - "우주", "universe", "space", "cosmos", "宇宙" → "space"
   - "사랑", "love", "愛", "amor" → "love"
   - "음식", "food", "먹방", "요리" → "food"
   - "여행", "travel", "trip", "voyage" → "travel"
4. For very specific or niche topics, pick the most common English word for that concept.
5. Output ONLY the single lowercase English word. Nothing else — no explanation, no quotes.
`;
 
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                temperature: 0,
                max_tokens: 10,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userInput.slice(0, 100) }
                ]
            })
        });
 
        const data = await response.json();
        let topic = data.choices?.[0]?.message?.content?.trim().toLowerCase() || "general";
 
        // 영어 소문자만 남기기
        topic = topic.replace(/[^a-z]/g, "");
 
        // 빈 문자열 방어
        if (!topic) topic = "general";
 
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ topic })
        };
    } catch (err) {
        console.error("OpenAI Fetch Error:", err);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ topic: "general" })
        };
    }
};