import { GoogleGenerativeAI } from "@google/generative-ai";

export async function askQuestion(req, res) {
    const { question, rightAnswer } = req.body;

    if (!question || !rightAnswer) {
        return res.status(400).json({ error: "Question and user answer are required." });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                candidateCount: 1,
                temperature: 0.7, // Giảm nhiệt độ để có câu trả lời ngắn và chính xác
            },
        });

        const prompt = 'Bạn sẽ vào vai một người giáo viên giải thích cho học sinh.' +
        `Giải thích ngắn gọn cho câu hỏi: "${question}" và câu trả lời đúng là "${rightAnswer}" giải thích tại sao nó đúng. Trả lời ngắn gọn, chỉ văn bản thuần, không sử dụng ký tự đặc biệt. Yêu cầu: trả lời bằng tiếng Việt, xuống dòng gạch đầu dòng bằng dấu • (dấu bullet point)`;


        const result = await model.generateContent(prompt);
        console.log(result.response.text());

        res.json({ generatedText: result.response.text() });
    } catch (error) {
        console.error("Error generating text:", error);
        res.status(500).json({ error: "Failed to generate text" });
    }

}