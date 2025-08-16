import { model } from "../config/gemini";
import { safeParseJson } from "../utils/safeParseJson";
import { createJsonPrompt } from "../constant/createJsonPrompt";
import { getMenu } from "./menuService";

export const buildPrompt = async (userText: string) => {
    const now = new Date().toISOString();
    const menus = await getMenu();
    return createJsonPrompt(userText, now, menus);
};

export const parseWithGemini = async (text:string, userId: number | string) => { 
    const prompt = await buildPrompt(text)
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const raw = response.text();

    try{
        const parsed = safeParseJson(raw);

        if(parsed.amount == 0){
            return "sepertinya ada kesalahan input, pastikan nama menu dan harga disebutkan dengan benar."
        }

        parsed.telegram_user_id = userId;
        parsed.raw_text = text;
        return parsed
    }catch(e){
        console.error(e)
    }
};
