/**
 * Gemini API Configuration
 * 
 * This file manages the Gemini API key and related settings.
 * The API key should be stored in the .env.local file as NEXT_PUBLIC_GEMINI_API_KEY
 */

export const geminiConfig = {
  // API Key - retrieved from environment variables
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',

  // Model configuration
  model: 'gemini-pro',
  
  // API settings
  baseURL: 'https://generativelanguage.googleapis.com/v1',
  
  // Request defaults
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  },

  // Safety settings
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ],
};

/**
 * Validate that the API key is configured
 */
export const validateGeminiConfig = (): boolean => {
  if (!geminiConfig.apiKey) {
    console.error(
      'Gemini API key is not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file.'
    );
    return false;
  }
  return true;
};
