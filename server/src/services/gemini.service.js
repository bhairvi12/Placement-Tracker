import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Helper to generate content from Groq API using llama-3.3-70b-versatile
 * @param {string} prompt - Prompt to send to the AI
 * @returns {Promise<string>} - The raw text output (JSON string)
 */
const generateContent = async (prompt) => {
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content || '';
};

/**
 * Utility to parse JSON response robustly, handling potential markdown code blocks.
 */
const parseJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }
};

/**
 * AI Resume Analysis
 * @param {string} resumeText - Parsed text of the resume
 * @param {string} targetRole - Target job title/role
 */
export const analyzeResume = async (resumeText, targetRole) => {
  const prompt = `You are an expert ATS resume analyzer.
Analyze this resume for a CSE student targeting ${targetRole} roles.
Return ONLY a JSON object with:
{
  "overallFeedback": "string (2-3 sentences)",
  "strengths": ["string (item 1)", "string (item 2)", "string (item 3)"],
  "improvements": ["item 1", "item 2", "item 3", "item 4", "item 5"],
  "missingKeywords": ["string", "string"],
  "actionVerbSuggestions": ["string", "string"],
  "estimatedAtsScore": 85
}
Resume text: ${resumeText}`;

  try {
    const rawResult = await generateContent(prompt);
    return parseJSON(rawResult);
  } catch (error) {
    throw new Error(`AI Resume Analysis failed: ${error.message}`);
  }
};

/**
 * Generate customized study plan
 */
export const generateStudyPlan = async (weakSubjects, targetCompanies, daysAvailable) => {
  const prompt = `Create a focused study plan for a CSE placement student.
Weak areas: ${weakSubjects}
Target companies: ${targetCompanies}
Days available: ${daysAvailable}
Return ONLY a JSON object with:
{
  "overview": "string",
  "weeklyPlan": [
    {
      "week": 1,
      "focus": "string",
      "topics": ["string"],
      "resources": ["string"],
      "dailyHours": 4
    }
  ],
  "priorityTopics": ["string"],
  "quickTips": ["string"]
}`;

  try {
    const rawResult = await generateContent(prompt);
    return parseJSON(rawResult);
  } catch (error) {
    throw new Error(`AI Study Plan generation failed: ${error.message}`);
  }
};

/**
 * Explain a specific skill gap
 */
export const explainSkillGap = async (skill, company, studentLevel) => {
  const prompt = `Explain this skill gap for a CSE placement student.
Missing skill: ${skill}
Target company: ${company}
Student current level: ${studentLevel}
Return ONLY a JSON object with:
{
  "whatIsIt": "string (simple explanation)",
  "whyCompanyCares": "string",
  "howToLearn": ["string"],
  "timeToLearn": "string",
  "freeResources": ["string"],
  "practiceIdeas": ["string"]
}`;

  try {
    const rawResult = await generateContent(prompt);
    return parseJSON(rawResult);
  } catch (error) {
    throw new Error(`AI Skill Gap analysis failed: ${error.message}`);
  }
};

/**
 * Safe parser for Gemini JSON responses.
 */
const parseGeminiJSON = (text) => {
  const clean = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(clean);
};

/**
 * Generate multiple choice practice questions.
 */
export const generatePracticeQuestions = async (subject, difficulty, count) => {
  const prompt = `Generate ${count} multiple choice questions for a CSE placement student.
Subject: ${subject}
Difficulty: ${difficulty}
Return ONLY a valid JSON object:
{
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string (exact match to one option)",
      "explanation": "string (why this is correct)",
      "topic": "string (specific topic within subject)"
    }
  ]
}
Make questions realistic for TCS, Infosys, Wipro, Google placement exams.
EASY: basic concepts
MEDIUM: application based
HARD: complex problem solving`;

  try {
    const rawResult = await generateContent(prompt);
    return parseGeminiJSON(rawResult);
  } catch (error) {
    throw new Error(`AI Practice Questions Generation failed: ${error.message}`);
  }
};

/**
 * Evaluate submitted multiple choice answers.
 */
export const evaluatePracticeAnswers = async (subject, questions) => {
  const prompt = `Evaluate these practice test answers for a CSE placement student.
Subject: ${subject}
Questions and answers: ${JSON.stringify(questions)}
Return ONLY a valid JSON object:
{
  "results": [
    {
      "questionId": "string",
      "isCorrect": true,
      "feedback": "string (one sentence explanation)",
      "correctAnswer": "string"
    }
  ],
  "overallFeedback": "string (2-3 sentences)",
  "strongTopics": ["string"],
  "weakTopics": ["string"],
  "studyRecommendations": ["string"]
}`;

  try {
    const rawResult = await generateContent(prompt);
    return parseGeminiJSON(rawResult);
  } catch (error) {
    throw new Error(`AI Practice Evaluation failed: ${error.message}`);
  }
};


