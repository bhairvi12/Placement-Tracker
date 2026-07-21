import User from '../models/User.model.js';
import Profile from '../models/Profile.model.js';
import ResumeScore from '../models/ResumeScore.model.js';
import TestScore from '../models/TestScore.model.js';
import Certification from '../models/Certification.model.js';
import Settings from '../models/Settings.model.js';
import ActivityFeed from '../models/ActivityFeed.model.js';
import { calculateReadiness } from '../services/stats.service.js';
import { sendPlacementCongrats } from '../services/email.service.js';
import { Readable } from 'stream';

/**
 * Helper: Calculates full stats for a student profile
 */
const getStudentStats = async (profile) => {
  // 1. Get latest resume score
  const latestResume = await ResumeScore.findOne({ userId: profile.userId }).sort({
    uploadedAt: -1,
  });
  const resumeScore = latestResume ? latestResume.overallScore : 0;

  // 2. Get average test score percentage (using latest score per subject)
  const testScores = await TestScore.find({ userId: profile.userId });
  const subjectLatest = {};
  testScores.forEach((t) => {
    if (
      !subjectLatest[t.subject] ||
      t.recordedAt > subjectLatest[t.subject].recordedAt
    ) {
      subjectLatest[t.subject] = t;
    }
  });
  const latestScoresArray = Object.values(subjectLatest);
  const avgTest =
    latestScoresArray.length > 0
      ? latestScoresArray.reduce((sum, t) => sum + t.scorePercentage, 0) /
        latestScoresArray.length
      : 0;

  // 3. Get completed certification count
  const certCount = await Certification.countDocuments({
    userId: profile.userId,
    status: 'completed',
  });

  // 4. Calculate readiness percentage
  const readiness = calculateReadiness(resumeScore, avgTest, certCount);

  return {
    resumeScore,
    avgTest: Math.round(avgTest * 100) / 100,
    certCount,
    readiness,
  };
};

/**
 * GET /api/v1/admin/students
 * Retrieves all students with calculated placement statistics, paginated and filtered.
 */
export const getStudents = async (req, res, next) => {
  try {
    const studentUsers = await User.find({ role: 'student' });
    const studentUserIds = studentUsers.map((u) => u._id);

    const query = { userId: { $in: studentUserIds } };
    if (req.query.branch) {
      query.branch = req.query.branch;
    }
    if (req.query.search) {
      query.fullName = { $regex: req.query.search, $options: 'i' };
    }

    // Fetch all student profiles matching query
    const profiles = await Profile.find(query);

    // Compute stats for each in parallel
    const studentsData = await Promise.all(
      profiles.map(async (profile) => {
        const stats = await getStudentStats(profile);
        return {
          profile,
          stats,
        };
      })
    );

    // Sorting
    const sort = req.query.sort || 'name';
    const order = req.query.order === 'desc' ? -1 : 1;

    studentsData.sort((a, b) => {
      if (sort === 'readiness') {
        return (a.stats.readiness - b.stats.readiness) * order;
      }
      // Default to fullName alphabet sorting
      const nameA = (a.profile.fullName || '').toLowerCase();
      const nameB = (b.profile.fullName || '').toLowerCase();
      return nameA.localeCompare(nameB) * order;
    });

    // Pagination
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedData = studentsData.slice(startIndex, endIndex);
    const totalCount = studentsData.length;
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      message: 'Students list fetched successfully',
      data: {
        totalCount,
        totalPages,
        currentPage: page,
        students: paginatedData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/students/:id
 * Fetch and calculate stats for a single student profile by ID (supports profile _id or userId)
 */
export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Search by profile ID first, fallback to user ID
    let profile = await Profile.findById(id);
    if (!profile) {
      profile = await Profile.findOne({ userId: id });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.',
      });
    }

    const stats = await getStudentStats(profile);

    res.status(200).json({
      success: true,
      message: 'Student details retrieved successfully',
      data: {
        profile,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/students/:id/placement
 * Update a student's placement status. Sends congratulations email if true.
 */
export const updateStudentPlacement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isPlaced, placedCompany } = req.body;

    let profile = await Profile.findById(id);
    if (!profile) {
      profile = await Profile.findOne({ userId: id });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.',
      });
    }

    const user = await User.findById(profile.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account linked to this profile not found.',
      });
    }

    // Update profile fields
    profile.isPlaced = isPlaced === true;
    profile.placedCompany = isPlaced === true ? placedCompany : null;
    await profile.save();

    // Log Activity on student feed
    await ActivityFeed.create({
      userId: profile.userId,
      actionType: 'PLACEMENT_STATUS_CHANGE',
      description: isPlaced
        ? `Placement marked: Placed at ${placedCompany}`
        : 'Placement status reset by Administrator',
    });

    // Send Congrats Email if student is placed
    if (profile.isPlaced) {
      try {
        await sendPlacementCongrats(user.email, profile.fullName, placedCompany);
      } catch (emailError) {
        console.log(`Placement congrats email failed to execute: ${emailError.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Student placement status updated successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/stats
 * Placement stats aggregate dashboard for admin.
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const studentUsers = await User.find({ role: 'student' });
    const studentUserIds = studentUsers.map((u) => u._id);

    const totalStudents = await Profile.countDocuments({ userId: { $in: studentUserIds } });
    const placedCount = await Profile.countDocuments({ userId: { $in: studentUserIds }, isPlaced: true });
    const placedPercentage =
      totalStudents > 0 ? (placedCount / totalStudents) * 100 : 0;

    // Load all students and compute scores in memory to aggregate averages
    const profiles = await Profile.find({ userId: { $in: studentUserIds } });
    const studentsStats = await Promise.all(
      profiles.map((p) => getStudentStats(p))
    );

    const averageReadiness =
      studentsStats.length > 0
        ? studentsStats.reduce((sum, s) => sum + s.readiness, 0) / studentsStats.length
        : 0;

    // Branch wise readiness averages
    const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];
    const branchStats = {};

    for (const branch of branches) {
      const branchProfiles = profiles.filter((p) => p.branch === branch);
      if (branchProfiles.length > 0) {
        const stats = await Promise.all(branchProfiles.map((p) => getStudentStats(p)));
        const avg = stats.reduce((sum, s) => sum + s.readiness, 0) / stats.length;
        branchStats[branch] = Math.round(avg * 100) / 100;
      } else {
        branchStats[branch] = 0;
      }
    }

    // Distinct placed companies
    const placedCompanies = await Profile.distinct('placedCompany', {
      isPlaced: true,
      placedCompany: { $ne: null },
    });
    const allCompanies = new Set(placedCompanies);

    // Load Placement season date from settings
    const seasonSetting = await Settings.findOne({
      key: 'placement_season_date',
    });
    const placementSeasonDate = seasonSetting ? seasonSetting.value : 'Not Set';

    res.status(200).json({
      success: true,
      message: 'Admin stats dashboard loaded successfully',
      data: {
        totalStudents,
        placedCount,
        placedPercentage: Math.round(placedPercentage * 100) / 100,
        averageReadiness: Math.round(averageReadiness * 100) / 100,
        branchAverages: branchStats,
        totalCompaniesVisited: allCompanies.size,
        placementSeasonDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/leaderboard
 * Top 10 students sorted by readiness score.
 */
export const getLeaderboard = async (req, res, next) => {
  try {
    const studentUsers = await User.find({ role: 'student' });
    const studentUserIds = studentUsers.map((u) => u._id);

    const profiles = await Profile.find({ userId: { $in: studentUserIds } });
    const studentsData = await Promise.all(
      profiles.map(async (profile) => {
        const stats = await getStudentStats(profile);
        return {
          name: profile.fullName,
          branch: profile.branch,
          college: profile.college,
          isPlaced: profile.isPlaced,
          readiness: stats.readiness,
        };
      })
    );

    // Sort by readiness descending
    studentsData.sort((a, b) => b.readiness - a.readiness);

    // Map ranks and take top 10
    const leaderboard = studentsData.slice(0, 10).map((student, idx) => ({
      rank: idx + 1,
      ...student,
    }));

    res.status(200).json({
      success: true,
      message: 'Placement readiness leaderboard retrieved successfully',
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/export/csv
 * Exports student performance and readiness metrics as CSV file.
 */
export const exportStudentsCsv = async (req, res, next) => {
  try {
    const studentUsers = await User.find({ role: 'student' });
    const studentUserIds = studentUsers.map((u) => u._id);

    const profiles = await Profile.find({ userId: { $in: studentUserIds } });
    const studentsData = await Promise.all(
      profiles.map(async (profile) => {
        const stats = await getStudentStats(profile);
        return {
          profile,
          stats,
        };
      })
    );

    // Sort by readiness score descending
    studentsData.sort((a, b) => b.stats.readiness - a.stats.readiness);

    // Build CSV content
    let csvContent =
      'Rank,Name,Roll No,Branch,College,Resume Score,Avg Test,Certifications,Readiness %,Placed,Company\n';

    studentsData.forEach((student, index) => {
      const rank = index + 1;
      const name = student.profile.fullName.replace(/"/g, '""');
      const rollNo = student.profile.rollNumber;
      const branch = student.profile.branch;
      const college = (student.profile.college || '').replace(/"/g, '""');
      const resumeScore = student.stats.resumeScore;
      const avgTest = student.stats.avgTest;
      const certs = student.stats.certCount;
      const readiness = student.stats.readiness;
      const placed = student.profile.isPlaced ? 'Yes' : 'No';
      const company = (student.profile.placedCompany || '').replace(/"/g, '""');

      csvContent += `${rank},"${name}","${rollNo}",${branch},"${college}",${resumeScore},${avgTest},${certs},${readiness},${placed},"${company}"\n`;
    });

    // Create a read stream from string
    const stream = Readable.from([csvContent]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=students_readiness.csv'
    );

    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/settings
 * Fetch placement season date setting.
 */
export const getSettings = async (req, res, next) => {
  try {
    let setting = await Settings.findOne({ key: 'placement_season_date' });
    if (!setting) {
      setting = await Settings.create({
        key: 'placement_season_date',
        value: new Date().getFullYear().toString(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Placement settings retrieved successfully',
      data: {
        placementSeasonDate: setting.value,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/settings
 * Update placement season date.
 */
export const updateSettings = async (req, res, next) => {
  try {
    const { placementSeasonDate } = req.body;
    if (!placementSeasonDate) {
      return res.status(400).json({
        success: false,
        message: 'placementSeasonDate value is required.',
      });
    }

    let setting = await Settings.findOne({ key: 'placement_season_date' });
    if (!setting) {
      setting = new Settings({ key: 'placement_season_date' });
    }
    setting.value = placementSeasonDate;
    await setting.save();

    res.status(200).json({
      success: true,
      message: 'Placement settings updated successfully',
      data: {
        placementSeasonDate: setting.value,
      },
    });
  } catch (error) {
    next(error);
  }
};
