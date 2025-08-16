import { model } from "../config/gemini";
import { safeParseJson } from "../utils/safeParseJson";
import { createJsonPrompt } from "../constant/createJsonPrompt";

export const buildPrompt = (userText: string) => {
    const now = new Date().toISOString();
    return createJsonPrompt(userText, now);
};

export const parseWithGemini = async (text:string, userId: number | string) => { 
    const prompt = buildPrompt(text)
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const raw = response.text();

    try{
        const parsed = safeParseJson(raw);
        parsed.telegram_user_id = userId;
        parsed.raw_text = text;
        return parsed
    }catch(e){
        console.error(e)
    }
};
