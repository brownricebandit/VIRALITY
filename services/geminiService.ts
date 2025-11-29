import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzeVideo = async (base64Video: string, mimeType: string, maxLength?: number, apiKey?: string): Promise<AnalysisResult> => {
  // Initialize inside the function to avoid top-level process.env access issues
  // Use provided apiKey or fallback to process.env (though process.env might be empty in client-side only builds)
  const key = apiKey || process.env.API_KEY;
  if (!key) {
    throw new Error("API Key is missing. Please provide a valid Gemini API Key.");
  }
  
  const ai = new GoogleGenAI({ apiKey: key });
  const model = "gemini-2.5-flash";

  // Define the schema for structured output
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      transcriptSummary: {
        type: Type.STRING,
        description: "A summary of the spoken content and visual actions in the video.",
      },
      keywords: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "High-traffic keywords relevant to the video content.",
      },
      audienceAnalysis: {
        type: Type.STRING,
        description: "A brief analysis of the target audience for this content.",
      },
      captions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING, description: "The social platform (e.g., TikTok, Instagram, Facebook)." },
            title: { type: Type.STRING, description: "A short SEO-optimized title (Required for Facebook/YouTube, optional for others)." },
            caption: { type: Type.STRING, description: "The optimized caption text." },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5-10 relevant hashtags." },
            strategy: { type: Type.STRING, description: "The strategy used (e.g., Viral/Hook, Educational, Community)." },
            maxLength: { type: Type.NUMBER, description: "The maximum character length constraint used, if applicable." },
          },
          required: ["platform", "caption", "hashtags", "strategy"],
        },
      },
    },
    required: ["transcriptSummary", "keywords", "captions", "audienceAnalysis"],
  };

  try {
    let promptText = `Analyze this video's audio (transcript) and visual content. 
            1. Summarize the transcript and key visual moments.
            2. Identify high-traffic keywords suitable for social media SEO.
            3. Analyze who the ideal audience is.
            4. Generate 3 distinct social media captions:
               - One for Facebook/YouTube Description (Engaging/Community based, moderate length).
                 * IMPORTANT: For Facebook/YouTube, also generate a distinct "title" field containing a short, SEO-optimized headline for the video (5-10 words).
               - One for TikTok/Reels (Viral/Hook based, short, punchy).
               - One for Instagram Main Feed (Storytelling/Engagement based).
            
            STRICT FORMATTING RULES:
            - Do NOT use emojis in the captions or titles.
            - Do NOT use em dashes (—). Use standard periods (.), commas (,), or hyphens (-) if necessary.
            - Write in a natural, casual, human-like tone. Avoid robotic or overly enthusiastic "marketing" language.
            - Use standard ASCII punctuation only.
               `;

    if (maxLength) {
      promptText += `\nIMPORTANT: Ensure each generated caption is approximately ${maxLength} characters or less.`;
    }

    promptText += `\nReturn the result in JSON format.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Video,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4, // Lower temperature for more consistent formatting
      },
    });

    if (!response.text) {
      throw new Error("No response text received from Gemini.");
    }

    const result = JSON.parse(response.text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Error analyzing video:", error);
    throw error;
  }
};