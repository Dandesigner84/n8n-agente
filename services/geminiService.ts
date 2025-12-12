import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIResponseSchema, Message, N8nWorkflow } from "../types";

// Helper to sanitize JSON string if Markdown code blocks are included
const cleanJsonString = (str: string): string => {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
  }
  return cleaned;
};

// Internal interface to match the raw response from Gemini (where workflow is a string)
interface GeminiRawResponse {
  explanation: string;
  workflowJson?: string;
  requiredCredentials?: string[];
  tips?: string[];
}

const SYSTEM_INSTRUCTION = `
You are an expert n8n Automation Architect. Your goal is to help users create, configure, and understand n8n workflows.
You respond in Portuguese (PT-BR) unless requested otherwise.

When a user asks to create a workflow:
1. Generate a valid n8n JSON object structure containing 'nodes' and 'connections'.
2. Use standard n8n node types (e.g., 'n8n-nodes-base.webhook', 'n8n-nodes-base.httpRequest', 'n8n-nodes-base.set', 'n8n-nodes-base.if').
3. Arrange nodes with reasonable X/Y positions so they don't overlap.
4. Explain how the workflow works.
5. List specific credentials the user will need to configure.

Your response must ALWAYS be a JSON object adhering to this schema:
{
  "explanation": "Markdown text explaining the solution or answering the question",
  "workflowJson": "STRINGIFIED_JSON_OBJECT_OF_THE_WORKFLOW",
  "requiredCredentials": ["Cred 1", "Cred 2"],
  "tips": ["Tip 1", "Tip 2"]
}

IMPORTANT: The 'workflowJson' field must be a VALID JSON STRING representing the n8n workflow object. Do not put the object directly; stringify it.
If no workflow is needed, leave 'workflowJson' as null or empty.
`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    explanation: {
      type: Type.STRING,
      description: "The chat response in Markdown format."
    },
    workflowJson: {
      type: Type.STRING,
      description: "The complete n8n workflow JSON object serialized as a string. It must contain 'nodes' and 'connections'.",
      nullable: true
    },
    requiredCredentials: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of credentials required for this workflow."
    },
    tips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Short tips for configuration."
    }
  },
  required: ["explanation"]
};

export const sendMessageToGemini = async (
  history: Message[],
  currentMessage: string
): Promise<AIResponseSchema> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found in environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Convert history to Gemini format
    const chatHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4,
      },
      history: chatHistory
    });

    const result = await chat.sendMessage({ message: currentMessage });
    const text = result.text;

    if (!text) {
      throw new Error("No response from Gemini");
    }

    const parsedRaw = JSON.parse(cleanJsonString(text)) as GeminiRawResponse;

    // Parse the workflow string into an object if it exists
    let workflowObj: N8nWorkflow | null = null;
    if (parsedRaw.workflowJson) {
      try {
        workflowObj = JSON.parse(parsedRaw.workflowJson);
      } catch (e) {
        console.error("Failed to parse workflowJson string:", e);
        // Fallback: we keep workflowObj as null but still show explanation
      }
    }

    return {
      explanation: parsedRaw.explanation,
      workflow: workflowObj,
      requiredCredentials: parsedRaw.requiredCredentials,
      tips: parsedRaw.tips
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      explanation: `⚠️ Desculpe, encontrei um erro ao processar sua solicitação: ${(error as Error).message}. Tente novamente.`,
      workflow: null
    };
  }
};
