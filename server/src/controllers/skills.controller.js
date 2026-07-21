import Skill from '../models/Skill.model.js';
import Profile from '../models/Profile.model.js';
import ActivityFeed from '../models/ActivityFeed.model.js';

// Predefined map of required skills for target companies
const REQUIRED_SKILLS_MAP = {
  Google: [
    'algorithms',
    'system design',
    'python',
    'distributed systems',
    'problem solving',
    'data structures',
  ],
  Microsoft: [
    'data structures',
    'c++',
    'system design',
    'oop',
    'azure',
    'problem solving',
  ],
  Amazon: [
    'algorithms',
    'system design',
    'aws',
    'leadership',
    'problem solving',
    'java',
  ],
  TCS: ['java', 'sql', 'python', 'communication', 'testing', 'git'],
  Infosys: ['java', 'mysql', 'html', 'css', 'communication', 'agile'],
  Wipro: ['python', 'java', 'sql', 'communication', 'javascript', 'git'],
  Accenture: ['communication', 'sql', 'java', 'python', 'agile', 'testing'],
  Cognizant: ['java', 'sql', 'html', 'css', 'javascript', 'communication'],
};

/**
 * Get all skills logged by the user
 */
export const getSkills = async (req, res, next) => {
  try {
    const skills = await Skill.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Skills retrieved successfully',
      data: skills,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new skill
 */
export const createSkill = async (req, res, next) => {
  try {
    const { name, category, proficiencyLevel } = req.body;

    const skill = await Skill.create({
      userId: req.user._id,
      name,
      category,
      proficiencyLevel,
    });

    // Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'SKILL_CREATE',
      description: `Added skill: ${name} (${proficiencyLevel.toLowerCase()})`,
    });

    res.status(201).json({
      success: true,
      message: 'Skill logged successfully',
      data: skill,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a skill with ownership check
 */
export const deleteSkill = async (req, res, next) => {
  try {
    const { id } = req.params;

    const skill = await Skill.findById(id);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found.',
      });
    }

    // Ownership check
    if (skill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this skill.',
      });
    }

    const skillName = skill.name;
    await Skill.findByIdAndDelete(id);

    // Log Activity
    await ActivityFeed.create({
      userId: req.user._id,
      actionType: 'SKILL_DELETE',
      description: `Removed skill: ${skillName}`,
    });

    res.status(200).json({
      success: true,
      message: 'Skill deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Performs skill gap analysis against target companies listed in user profile
 */
export const getGapAnalysis = async (req, res, next) => {
  try {
    // 1. Fetch user's logged skills and lowercase them
    const userSkills = await Skill.find({ userId: req.user._id });
    const userSkillNames = userSkills.map((s) => (s.name || '').toLowerCase());

    // 2. Fetch user's profile to extract target companies
    const profile = await Profile.findOne({ userId: req.user._id });
    const targetCompanies = profile?.targetCompanies || [];

    const analysis = targetCompanies.map((company) => {
      // Find required skills from map or fallback to standard placement requirements
      let required = REQUIRED_SKILLS_MAP[company];

      // If company has exact match in map, use it.
      // Otherwise search case-insensitive keys.
      if (!required) {
        const key = Object.keys(REQUIRED_SKILLS_MAP).find(
          (k) => k.toLowerCase() === company.toLowerCase()
        );
        required = key
          ? REQUIRED_SKILLS_MAP[key]
          : [
              'data structures',
              'algorithms',
              'problem solving',
              'communication',
              'git',
              'sql',
            ]; // Fallback required skills
      }

      // Compute intersection and differences
      const matched = required.filter((reqSkill) => userSkillNames.includes(reqSkill));
      const missing = required.filter((reqSkill) => !userSkillNames.includes(reqSkill));
      const matchPercent = required.length > 0 ? (matched.length / required.length) * 100 : 0;

      return {
        company,
        required,
        matched,
        missing,
        matchPercent: Math.round((matchPercent + Number.EPSILON) * 100) / 100,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Skill gap analysis completed successfully',
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};
