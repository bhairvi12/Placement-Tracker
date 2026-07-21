/**
 * Calculates the weighted readiness percentage for a student.
 * @param {number} resumeScore - Latest overall resume score (0-100)
 * @param {number} avgTest - Average test score percentage across all subjects (0-100)
 * @param {number} certCount - Number of completed certifications
 * @returns {number} - Placement readiness score (0-100)
 */
export const calculateReadiness = (
  resumeScore = 0,
  avgTest = 0,
  certCount = 0
) => {
  // Reweight remaining three components equally (each represents 33.33% of the total score)
  const rScore = Math.min(resumeScore || 0, 100) * (1 / 3);
  const tScore = Math.min(avgTest || 0, 100) * (1 / 3);
  const cScore = Math.min((certCount || 0) * 20, 100) * (1 / 3);

  const total = rScore + tScore + cScore;
  return Math.round((total + Number.EPSILON) * 100) / 100;
};
