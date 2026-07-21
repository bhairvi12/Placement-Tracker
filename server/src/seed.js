import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


dotenv.config();

if (process.env.NODE_ENV === 'production') {
  console.log('Production environment detected. Seeding aborted.');
  process.exit(0);
}


import User from './models/User.model.js';
import Profile from './models/Profile.model.js';
import ResumeScore from './models/ResumeScore.model.js';
import TestScore from './models/TestScore.model.js';
import Certification from './models/Certification.model.js';
import Skill from './models/Skill.model.js';
import ActivityFeed from './models/ActivityFeed.model.js';
import Settings from './models/Settings.model.js';

const seedDatabase = async () => {
  try {
   
    await mongoose.connect(process.env.MONGODB_URI);

    
    await User.deleteMany({});
    await Profile.deleteMany({});
    await ResumeScore.deleteMany({});
    await TestScore.deleteMany({});
    await Certification.deleteMany({});
    await Skill.deleteMany({});
    await ActivityFeed.deleteMany({});
    await Settings.deleteMany({});

    console.log('Database cleared');

    // Password hashing helper
    const hashPassword = async (password) => {
      const salt = await bcrypt.genSalt(12);
      return bcrypt.hash(password, salt);
    };

    // 3. Create Admin
    const adminPasswordHash = await hashPassword('Admin@123');
    const adminUser = await User.create({
      email: 'admin@preptracker.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
    });

    await Profile.create({
      userId: adminUser._id,
      fullName: 'Placement Admin',
      rollNumber: 'ADMIN-001',
      branch: 'CSE',
      college: 'SRMIST',
      profileComplete: true,
    });

    console.log('Admin created: admin@preptracker.com');

   
    const studentPasswordHash = await hashPassword('Student@123');

    // Student 1
    const student1 = await User.create({
      email: 'riya@preptracker.com',
      passwordHash: studentPasswordHash,
      role: 'student',
    });
    const profile1 = await Profile.create({
      userId: student1._id,
      fullName: 'Riya Sharma',
      rollNumber: 'RA2011003010001',
      branch: 'CSE',
      college: 'SRMIST',
      targetCompanies: ['Google', 'Microsoft', 'Amazon'],
      isPlaced: false,
      profileComplete: true,
    });

    // Student 2
    const student2 = await User.create({
      email: 'arjun@preptracker.com',
      passwordHash: studentPasswordHash,
      role: 'student',
    });
    const profile2 = await Profile.create({
      userId: student2._id,
      fullName: 'Arjun Mehta',
      rollNumber: 'RA2011003010002',
      branch: 'ECE',
      college: 'SRMIST',
      targetCompanies: ['TCS', 'Infosys', 'Wipro'],
      isPlaced: true,
      placedCompany: 'TCS',
      profileComplete: true,
    });

    // Student 3
    const student3 = await User.create({
      email: 'priya@preptracker.com',
      passwordHash: studentPasswordHash,
      role: 'student',
    });
    const profile3 = await Profile.create({
      userId: student3._id,
      fullName: 'Priya Singh',
      rollNumber: 'RA2011003010003',
      branch: 'CSE',
      college: 'SRMIST',
      targetCompanies: ['Amazon', 'Accenture', 'Cognizant'],
      isPlaced: false,
      profileComplete: true,
    });

    console.log('Students created: 3');

    const students = [
      { user: student1, profile: profile1 },
      { user: student2, profile: profile2 },
      { user: student3, profile: profile3 },
    ];

   
    const daysAgo = (num) => {
      const date = new Date();
      date.setDate(date.getDate() - num);
      return date;
    };

   
    for (const student of students) {
      const uId = student.user._id;

      
      await ResumeScore.create([
        {
          userId: uId,
          atsScore: 65,
          keywordScore: 60,
          formatScore: 70,
          impactScore: 50,
          overallScore: 61.5,
          fileUrl: 'https://res.cloudinary.com/preptracker/raw/upload/v12345/resume_draft.pdf',
          detectedSections: ['education', 'skills', 'projects'],
          matchedKeywords: ['javascript', 'html', 'css', 'react'],
          missingKeywords: ['node', 'sql', 'algorithms', 'data structures'],
          uploadedAt: daysAgo(30),
        },
        {
          userId: uId,
          atsScore: 85,
          keywordScore: 80,
          formatScore: 100,
          impactScore: 80,
          overallScore: 85.5,
          fileUrl: 'https://res.cloudinary.com/preptracker/raw/upload/v12345/resume_final.pdf',
          detectedSections: ['education', 'experience', 'skills', 'projects', 'certifications'],
          matchedKeywords: ['javascript', 'react', 'node', 'sql', 'git', 'algorithms', 'data structures'],
          missingKeywords: ['aws', 'docker'],
          uploadedAt: daysAgo(0),
        },
      ]);

    
      const subjects = ['APTITUDE', 'CODING', 'VERBAL', 'QUANT', 'DSA'];
      const mockTestStats = [
        { easy: 12, medium: 6, hard: 2 },
        { easy: 18, medium: 9, hard: 3 },
        { easy: 24, medium: 12, hard: 4 },
        { easy: 15, medium: 8, hard: 1 },
        { easy: 20, medium: 10, hard: 5 },
      ];

      const testDocs = subjects.map((subject, idx) => {
        const stats = mockTestStats[idx];
        const total = stats.easy + stats.medium + stats.hard;
        // Formula: (easy*1 + medium*3 + hard*5) / ((easy+medium+hard)*5) * 100
        const percentage = ((stats.easy * 1 + stats.medium * 3 + stats.hard * 5) / (total * 5)) * 100;
        return {
          userId: uId,
          subject,
          easySolved: stats.easy,
          mediumSolved: stats.medium,
          hardSolved: stats.hard,
          scorePercentage: Math.round(percentage * 100) / 100,
          recordedAt: daysAgo(10 - idx),
        };
      });
      await TestScore.create(testDocs);

      // --- Certifications ---
      await Certification.create([
        {
          userId: uId,
          name: 'AWS Cloud Practitioner',
          platform: 'AWS',
          status: 'completed',
          progressPercent: 100,
          completedDate: daysAgo(15),
        },
        {
          userId: uId,
          name: 'Python Intermediate',
          platform: 'HackerRank',
          status: 'completed',
          progressPercent: 100,
          completedDate: daysAgo(5),
        },
        {
          userId: uId,
          name: 'Data Structures',
          platform: 'Coursera',
          status: 'in_progress',
          progressPercent: 60,
        },
        {
          userId: uId,
          name: 'SQL Advanced',
          platform: 'Udemy',
          status: 'planned',
          progressPercent: 0,
        },
      ]);


      // --- Skills ---
      await Skill.create([
        {
          userId: uId,
          name: 'Python',
          category: 'LANGUAGE',
          proficiencyLevel: 'ADVANCED',
        },
        {
          userId: uId,
          name: 'Java',
          category: 'LANGUAGE',
          proficiencyLevel: 'INTERMEDIATE',
        },
        {
          userId: uId,
          name: 'React',
          category: 'FRAMEWORK',
          proficiencyLevel: 'ADVANCED',
        },
        {
          userId: uId,
          name: 'Node.js',
          category: 'FRAMEWORK',
          proficiencyLevel: 'INTERMEDIATE',
        },
        {
          userId: uId,
          name: 'Git',
          category: 'TOOL',
          proficiencyLevel: 'ADVANCED',
        },
        {
          userId: uId,
          name: 'Data Structures',
          category: 'CS_FUNDAMENTAL',
          proficiencyLevel: 'ADVANCED',
        },
      ]);

      // --- Activity Feed ---
      await ActivityFeed.create([
        {
          userId: uId,
          actionType: 'AUTH_REGISTER',
          description: 'Account registered successfully',
          createdAt: daysAgo(30),
        },
        {
          userId: uId,
          actionType: 'RESUME_UPLOAD',
          description: 'Uploaded resume - Score: 61.5/100',
          createdAt: daysAgo(30),
        },
        {
          userId: uId,
          actionType: 'SKILL_CREATE',
          description: 'Added skill: Data Structures (advanced)',
          createdAt: daysAgo(25),
        },
        {
          userId: uId,
          actionType: 'RESUME_UPLOAD',
          description: 'Uploaded resume - Score: 85.5/100',
          createdAt: daysAgo(0),
        },
      ]);
    }

    console.log('✅ Resume scores seeded');
    console.log('✅ Test scores seeded');
    console.log('✅ Certifications seeded');
    console.log('✅ Skills seeded');
    console.log('✅ Activity feed seeded');

    // 6. Create Settings document
    await Settings.create({
      key: 'placement_season_start',
      value: '2025-01-15',
    });

    console.log('✅ Settings seeded');
    console.log('🎉 Database seeded successfully!');

    // 8. Disconnect and exit
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding error: ${error.message}`);
    process.exit(1);
  }
};

// Run Seeder
seedDatabase();
