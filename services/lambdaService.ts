import { ModerationResult, CommentRiskLevel, PolicyType } from "../types";

const LAMBDA_URL = process.env.LAMBDA_URL || "";

export const analyzeCommentWithLambda = async (
  commentText: string, 
  selectedPolicies: PolicyType[]
): Promise<ModerationResult> => {
  try {
    const policiesString = selectedPolicies.join(", ");
    
    const requestBody = {
      policies: policiesString,
      comments: [
        {
          account_id: "playground_user",
          comment_id: "playground_comment_" + Date.now(),
          text: commentText
        }
      ],
    };

    const response = await fetch(LAMBDA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Lambda error: ${response.status}`);
    }

    const data = await response.json();
    
    // The Lambda returns { labels: [...] } where each label matches the Demo result format
    if (!data.labels || data.labels.length === 0) {
      throw new Error("No analysis labels returned from Lambda");
    }

    const result = data.labels[0];
    
    return {
      riskLevel: result.riskLevel as CommentRiskLevel,
      confidenceScore: result.confidenceScore,
      explanation: result.explanation,
      suggestedAction: result.suggestedAction
    };

  } catch (error) {
    console.error("Error calling Lambda moderation agent:", error);
    throw error;
  }
};
