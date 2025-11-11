// geminiService.ts (REVISED)

import { GoogleGenAI } from "@google/genai";
import { 
  INFO_COLLECTION_PROMPT, 
  LIABILITY_PROMPT,
  COLLISION_PROMPT,
  COMPREHENSIVE_PROMPT,
  PIP_PROMPT,
  UNDERINSURED_PROMPT,
  SUMMARY_PROMPT,
  RESPONSE_SCHEMA 
} from '../constants';
import { GeminiResponse, HistoryItem, CoverageTopic } from '../types'; // We'll need to add CoverageTopic to types.ts later

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- UPDATED FUNCTION SIGNATURE ---
export async function getInsuranceBotResponse(
  prompt: string, 
  history: HistoryItem[],
  conversationPhase: 'info_collection' | 'coverage_discussion' | 'summary',
  currentCoverageTopic?: CoverageTopic | null
): Promise<GeminiResponse> {
  try {
    let systemPrompt;

    // --- NEW, SMARTER PROMPT SELECTION LOGIC ---
    if (conversationPhase === 'info_collection') {
      systemPrompt = INFO_COLLECTION_PROMPT;
    } else if (conversationPhase === 'summary') {
      systemPrompt = SUMMARY_PROMPT; 
    } else {
      // This is the core of our refactor.
      // We select a small, focused prompt based on the current topic.
      switch (currentCoverageTopic) {
        case 'liability': 
          systemPrompt = LIABILITY_PROMPT; 
          break;
        case 'collision': 
          systemPrompt = COLLISION_PROMPT; 
          break;
        case 'comprehensive': 
          systemPrompt = COMPREHENSIVE_PROMPT; 
          break;
        case 'pip': 
          systemPrompt = PIP_PROMPT; 
          break;
        case 'underinsured': 
          systemPrompt = UNDERINSURED_PROMPT; 
          break;
        default: 
          // Fallback in case something goes wrong
          console.warn(`No specific prompt for topic: ${currentCoverageTopic}. Using a generic fallback.`);
          systemPrompt = SUMMARY_PROMPT; 
      }
    }

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.4,
        topP: 0.9,
      },
      history: history,
    });

    const result = await chat.sendMessage({ message: prompt });
    const jsonString = result.text.trim();
    
    const cleanedJsonString = jsonString.replace(/^```json\n?/, '').replace(/```$/, '');
    
    const parsedResponse: GeminiResponse = JSON.parse(cleanedJsonString);
    return parsedResponse;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof SyntaxError) {
       return {
            responseText: "I'm sorry, I generated an invalid response. Could you please try rephrasing your question?",
            imageKey: 'error',
        };
    }
    return {
      responseText: "I'm having trouble connecting to my brain right now. Please try again in a moment.",
      imageKey: 'error',
    };
  }
}