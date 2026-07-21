import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

// Get the gemini-1.5-flash model
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

/**
 * Helper to generate content from Gemini AI with JSON response formatting
 * @param {string} prompt - Prompt to send to the AI
 * @returns {Promise<string>} - The raw text output (JSON string)
 */
const generateContent = async (prompt) => {
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });
  return result.response.text();
};

export { genAI, model, generateContent };
export default model;
