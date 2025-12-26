import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ModerationResult, CommentRiskLevel, PolicyType } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize the client once. 
const ai = new GoogleGenAI({ apiKey });

const moderationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    riskLevel: {
      type: Type.STRING,
      enum: [
        'SAFE', 
        'SPAM', 
        'TOXIC', 
        'INAPPROPRIATE', 
        'HATE_SPEECH', 
        'SEXUAL', 
        'RACISM', 
        'HARASSMENT', 
        'VIOLENCE', 
        'SELF_HARM'
      ],
      description: "The classification of the comment's risk level.",
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: "A score from 0 to 100 indicating confidence in the classification.",
    },
    explanation: {
      type: Type.STRING,
      description: "A brief, one-sentence explanation of why the comment was classified this way.",
    },
    suggestedAction: {
      type: Type.STRING,
      enum: ['APPROVE', 'HIDE', 'DELETE', 'REPORT'],
      description: "The recommended action for the moderator to take.",
    },
  },
  required: ['riskLevel', 'confidenceScore', 'explanation', 'suggestedAction'],
};

export const analyzeComment = async (commentText: string, selectedPolicies: PolicyType[] = ['General']): Promise<ModerationResult> => {
  if (!apiKey) {
    console.warn("No API_KEY found. Using mock response.");
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      riskLevel: CommentRiskLevel.SAFE,
      confidenceScore: 95,
      explanation: "This appears to be a genuine, positive comment (Mock Result - API Key Missing).",
      suggestedAction: "APPROVE"
    };
  }

  try {
    const policyContext = selectedPolicies.join(", ");
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following Instagram comment for moderation purposes. 
      Context: The comment is on a public post.
      Strictly enforce the following policies: ${policyContext}.
      
      Comment: "${commentText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: moderationSchema,
        systemInstruction: "You are ShieldGram's AI safety engine. Your job is to protect users from harmful content. Be strict with hate speech, spam, and policy violations."
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI");
    }

    const data = JSON.parse(resultText) as ModerationResult;
    return data;

  } catch (error) {
    console.error("Error analyzing comment:", error);
    // Fallback for error state
    throw error;
  }
};