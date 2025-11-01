import { GoogleGenAI } from "@google/genai";
import { INFO_COLLECTION_PROMPT, COVERAGE_DISCUSSION_PROMPT, RESPONSE_SCHEMA } from '../constants';
import { GeminiResponse, HistoryItem } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function getInsuranceBotResponse(
  prompt: string, 
  history: HistoryItem[],
  conversationPhase: 'info_collection' | 'coverage_discussion'
): Promise<GeminiResponse> {
  try {
    const systemPrompt = conversationPhase === 'info_collection' 
      ? INFO_COLLECTION_PROMPT 
      : COVERAGE_DISCUSSION_PROMPT;

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.7,
        topP: 0.9,
      },
      history: history,
    });

    const result = await chat.sendMessage({ message: prompt });
    const jsonString = result.text.trim();
    
    // Sometimes the model might wrap the JSON in markdown backticks
    const cleanedJsonString = jsonString.replace(/^```json\n?/, '').replace(/```$/, '');
    
    const parsedResponse: GeminiResponse = JSON.parse(cleanedJsonString);
    return parsedResponse;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof SyntaxError) {
       return {
            responseText: "I'm sorry, I generated an invalid response. Could you please try rephrasing your question?",
            imageKey: 'error',
            story: ["There was a small glitch in my response format. Let's try that again."],
        };
    }
    return {
      responseText: "I'm having trouble connecting to my brain right now. Please try again in a moment.",
      imageKey: 'error',
      story: ["I can't seem to connect to the network. Please check your connection or try again soon."],
    };
  }
}