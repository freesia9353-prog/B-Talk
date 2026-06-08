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

// netlify/functions/sendVerifyEmail.js
// 필요한 패키지: nodemailer (또는 SendGrid 등 선호하는 메일 서비스로 교체 가능)
// npm install nodemailer
 
const nodemailer = require("nodemailer");
 
exports.handler = async function (event) {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
 
    let email, code;
    try {
        const body = JSON.parse(event.body);
        email = body.email;
        code = body.code;
    } catch (e) {
        return { statusCode: 400, body: "Invalid JSON" };
    }
 
    if (!email || !code) return { statusCode: 400, body: "Missing email or code" };
 
    // Gmail SMTP 예시 — 환경변수로 관리 (Netlify 대시보드 > Site settings > Environment variables)
    // MAIL_USER: 발신 Gmail 주소 (예: btalk.noreply@gmail.com)
    // MAIL_PASS: Gmail 앱 비밀번호 (2단계 인증 후 생성)
    const transporter = nodemailer.createTransporter({
        service: "gmail",
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });
 
    const mailOptions = {
        from: `"B-TALK" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "[B-TALK] 이메일 인증 코드",
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0d0e12; color: #ffffff; border-radius: 12px;">
                <h2 style="color: #00e5ff; letter-spacing: 2px; margin-top: 0;">B-TALK</h2>
                <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">아래 인증 코드를 입력하여 이메일 인증을 완료해 주세요.</p>
                <div style="background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.3); border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #00e5ff;">${code}</span>
                </div>
                <p style="color: rgba(255,255,255,0.4); font-size: 12px;">이 코드는 10분간 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
            </div>
        `
    };
 
    try {
        await transporter.sendMail(mailOptions);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: true })
        };
    } catch (err) {
        console.error("Mail send error:", err);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ success: false, error: err.message })
        };
    }
};