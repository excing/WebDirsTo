// 调用 Gemini API
import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import { request } from "$lib/fetch";

interface GeminiResponse {
    candidates?: {
        content: {
            parts: {
                text: string;
            }[];
        };
    }[];
}

export function gemini(parts: { text: string }[]) {
    if (dev) {
        return callNextChatApi(parts);
    }
    return callGeminiApi(parts);
}

async function callNextChatApi(parts: { text: string }[]) {
    const apiKey = env.NEXTCHAT_API_KEY;
    const apiUrl = 'https://nextchat.blendiv.com/api/google/v1beta/models/gemini-2.0-flash-lite-preview-02-05:generateContent';

    if (!apiKey) {
        throw new Error('Gemini API key is not configured');
    }

    const response = await request(apiUrl, {
        method: 'POST',
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey.trim(),
        },
        body: JSON.stringify(getGeminiRequestBody(parts, 0.9, 1000))
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} ${text}`);
    }

    const result = await response.json() as GeminiResponse;
    return getGeminiResponseBody(result);
}

async function callGeminiApi(parts: { text: string }[]) {
    const apiKey = env.GEMINI_API_KEY;
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    if (!apiKey) {
        throw new Error('Gemini API key is not configured');
    }

    const response = await request(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey.trim(),
        },
        body: JSON.stringify(getGeminiRequestBody(parts, 0.9, 1000))
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json() as GeminiResponse;
    return getGeminiResponseBody(result);
}

function getGeminiRequestBody(parts: { text: string }[], temperature: number, maxOutputTokens: number) {
    return {
        "contents": [{ "role": "user", "parts": parts }],
        "generationConfig": { "temperature": temperature, "maxOutputTokens": maxOutputTokens, "topP": 1 },
        "safetySettings": [{ "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" }, { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" }, { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" }, { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }]
    };
}

function getGeminiResponseBody(result: GeminiResponse) {
    return result.candidates ? result.candidates[0] : null;
}