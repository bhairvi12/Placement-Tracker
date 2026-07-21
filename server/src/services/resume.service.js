import pdf from 'pdf-parse';

/**
 * Parses a resume PDF buffer and calculates keyword, ATS, format, and impact scores.
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} - Promise resolving to score dashboard properties
 */
export const parseAndScore = async (pdfBuffer) => {
  const data = await pdf(pdfBuffer);
  const text = (data.text || '').toLowerCase();

  // 1. Keyword Score
  const keywords = [
    'python',
    'java',
    'javascript',
    'react',
    'node',
    'sql',
    'data structures',
    'algorithms',
    'git',
    'api',
    'problem solving',
    'communication',
    'teamwork',
    'leadership',
    'project',
    'html',
    'css',
    'mongodb',
    'express',
    'rest api',
    'object oriented',
  ];
  const matchedKeywords = keywords.filter((keyword) => text.includes(keyword));
  const missingKeywords = keywords.filter((keyword) => !text.includes(keyword));
  const keywordScore = (matchedKeywords.length / keywords.length) * 100;

  // 2. ATS Section Score
  const sections = [
    'education',
    'experience',
    'skills',
    'projects',
    'summary',
    'achievements',
    'certifications',
    'objective',
  ];
  const detectedSections = sections.filter((section) => text.includes(section));
  const atsScore = (detectedSections.length / sections.length) * 100;

  // 3. Format Score
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  let formatScore = 40;
  if (wordCount >= 300 && wordCount <= 900) {
    formatScore = 100;
  } else if (
    (wordCount >= 200 && wordCount < 300) ||
    (wordCount > 900 && wordCount <= 1200)
  ) {
    formatScore = 70;
  }

  // 4. Impact Score (Action Verbs)
  const verbs = [
    'built',
    'developed',
    'designed',
    'implemented',
    'led',
    'improved',
    'created',
    'optimized',
    'launched',
    'reduced',
    'increased',
    'managed',
    'delivered',
    'architected',
    'automated',
    'engineered',
    'spearheaded',
    'achieved',
    'established',
    'transformed',
  ];

  const verbCount = verbs.reduce((count, verb) => {
    // Escape word boundaries and count occurrences
    const matches = text.match(new RegExp('\\b' + verb + '\\b', 'g'));
    return count + (matches ? matches.length : 0);
  }, 0);
  const impactScore = Math.min(verbCount * 5, 100);

  // 5. Overall Score
  const overallScore =
    atsScore * 0.3 + keywordScore * 0.3 + formatScore * 0.2 + impactScore * 0.2;

  // Round scores to 2 decimal places
  const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

  return {
    atsScore: round(atsScore),
    keywordScore: round(keywordScore),
    formatScore: round(formatScore),
    impactScore: round(impactScore),
    overallScore: round(overallScore),
    detectedSections,
    matchedKeywords,
    missingKeywords,
    wordCount,
  };
};
