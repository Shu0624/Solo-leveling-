/**
 * LevelUp — Demo Data Seed Script
 * 
 * Populates the database with realistic demo data for hackathon presentations.
 * Creates students, activities, quiz attempts, and interview sessions.
 * 
 * Usage: node scripts/seed-demo.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Models
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import QuizAttempt from '../models/QuizAttempt.js';
import InterviewSession from '../models/InterviewSession.js';
import Resume from '../models/Resume.js';
import Event from '../models/Event.js';

const COLLEGE = 'KIET Group of Institutions';
const DEPARTMENT = 'Computer Science';
const CLASSROOM_CODE = 'CS-2026-A';

// Realistic Indian student names
const STUDENTS = [
  { name: 'Aarav Sharma', email: 'aarav@demo.levelup', year: 3, section: 'A' },
  { name: 'Priya Patel', email: 'priya@demo.levelup', year: 3, section: 'A' },
  { name: 'Rohan Gupta', email: 'rohan@demo.levelup', year: 3, section: 'A' },
  { name: 'Ananya Singh', email: 'ananya@demo.levelup', year: 3, section: 'A' },
  { name: 'Arjun Reddy', email: 'arjun@demo.levelup', year: 3, section: 'A' },
  { name: 'Diya Mehra', email: 'diya@demo.levelup', year: 3, section: 'A' },
  { name: 'Vivaan Kumar', email: 'vivaan@demo.levelup', year: 4, section: 'B' },
  { name: 'Ishita Joshi', email: 'ishita@demo.levelup', year: 4, section: 'B' },
  { name: 'Kabir Verma', email: 'kabir@demo.levelup', year: 2, section: 'A' },
  { name: 'Nisha Agarwal', email: 'nisha@demo.levelup', year: 2, section: 'A' },
];

const CATEGORIES = ['java', 'python', 'dsa', 'ai', 'aptitude', 'interview', 'resume'];
const LABELS = {
  java: ['Java Arrays practice', 'OOP Concepts', 'Collections deep-dive', 'Multithreading basics'],
  python: ['Python Data Structures', 'Flask API', 'Pandas & NumPy', 'Decorators & Generators'],
  dsa: ['Linked List problems', 'Binary Search', 'Graph BFS/DFS', 'Dynamic Programming'],
  ai: ['ML Fundamentals', 'Neural Networks', 'NLP Concepts', 'Prompt Engineering'],
  aptitude: ['Quantitative Methods', 'Logical Reasoning', 'Verbal Ability'],
  interview: ['Mock Interview Prep', 'STAR Method Practice', 'Technical Q&A'],
  resume: ['Resume Keywords', 'ATS Optimization', 'Project Descriptions'],
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log('🌱 Starting LevelUp Demo Seed...\n');
  
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  // Clean previous demo data
  console.log('🧹 Cleaning previous demo data...');
  await User.deleteMany({ email: { $regex: /@demo\.levelup$/ } });
  // Don't delete non-demo data
  
  const password = await bcrypt.hash('demo1234', 10);
  const createdUsers = [];

  // ---- Create Faculty ----
  console.log('👨‍🏫 Creating faculty...');
  const faculty = await User.create({
    name: 'Dr. Rajesh Khanna',
    email: 'faculty@demo.levelup',
    password,
    role: 'faculty',
    college: COLLEGE,
    department: DEPARTMENT,
    classroomCode: CLASSROOM_CODE,
    streak: { current: 12, longest: 30, lastActive: new Date() },
  });
  console.log(`   → ${faculty.name} (faculty)`);

  // ---- Create Students ----
  console.log('🎓 Creating students...');
  for (const s of STUDENTS) {
    const streakCurrent = randomInt(0, 21);
    const user = await User.create({
      name: s.name,
      email: s.email,
      password,
      role: 'student',
      college: COLLEGE,
      department: DEPARTMENT,
      year: s.year,
      section: s.section,
      classroomCode: CLASSROOM_CODE,
      streak: {
        current: streakCurrent,
        longest: Math.max(streakCurrent, randomInt(5, 30)),
        lastActive: new Date(),
      },
    });
    createdUsers.push(user);
    console.log(`   → ${user.name} (streak: ${streakCurrent}d)`);
  }

  // ---- Create Activities (last 30 days) ----
  console.log('\n⏱️  Creating study activity logs...');
  let totalActivities = 0;
  for (const user of createdUsers) {
    const sessionsCount = randomInt(15, 60);
    for (let i = 0; i < sessionsCount; i++) {
      const daysAgo = randomInt(0, 30);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(randomInt(8, 22), randomInt(0, 59));
      
      const category = randomItem(CATEGORIES);
      await Activity.create({
        user: user._id,
        classroomCode: user.classroomCode,
        department: user.department,
        college: user.college,
        category,
        label: randomItem(LABELS[category]),
        duration: randomInt(600, 7200), // 10 min to 2 hours
        date,
        type: ['study', 'quiz', 'interview'][Math.floor(Math.random() * 3)],
      });
      totalActivities++;
    }
  }
  console.log(`   → ${totalActivities} activity sessions created`);

  // ---- Create Quiz Attempts ----
  console.log('\n📝 Creating quiz attempts...');
  let totalQuizzes = 0;
  // We need a quiz ID — use a fake but valid ObjectId
  const fakeQuizId = new mongoose.Types.ObjectId();
  const fakeModuleId = new mongoose.Types.ObjectId();
  
  for (const user of createdUsers) {
    const attempts = randomInt(3, 12);
    for (let i = 0; i < attempts; i++) {
      const score = randomInt(3, 10);
      const maxScore = 10;
      await QuizAttempt.create({
        user: user._id,
        quiz: fakeQuizId,
        module: fakeModuleId,
        answers: [],
        score,
        maxScore,
        percentage: Math.round((score / maxScore) * 100),
        completedAt: new Date(Date.now() - randomInt(0, 30) * 86400000),
      });
      totalQuizzes++;
    }
  }
  console.log(`   → ${totalQuizzes} quiz attempts created`);

  // ---- Create Interview Sessions ----
  console.log('\n🎤 Creating interview sessions...');
  let totalInterviews = 0;
  for (const user of createdUsers) {
    const sessions = randomInt(1, 6);
    for (let i = 0; i < sessions; i++) {
      const daysAgo = randomInt(0, 25);
      const startedAt = new Date(Date.now() - daysAgo * 86400000);
      const duration = randomInt(300, 1800);
      await InterviewSession.create({
        host: user._id,
        participants: [user._id],
        roomId: `ai-${user._id.toString().slice(-6)}-${i}`,
        type: 'mock-interview',
        status: 'completed',
        topic: randomItem(['hr', 'java', 'dsa', 'python', 'project']),
        messagesCount: randomInt(5, 20),
        aiScore: randomInt(40, 95),
        startedAt,
        endedAt: new Date(startedAt.getTime() + duration * 1000),
      });
      totalInterviews++;
    }
  }
  console.log(`   → ${totalInterviews} interview sessions created`);

  // ---- Create Resume Scores ----
  console.log('\n📄 Creating resume analysis records...');
  for (const user of createdUsers) {
    const score = randomInt(35, 92);
    await Resume.create({
      user: user._id,
      fileName: `${user.name.replace(/\s+/g, '_')}_Resume.pdf`,
      parsedText: `Experienced ${randomItem(['Full-Stack', 'Backend', 'ML'])} developer with expertise in ${randomItem(['React', 'Node.js', 'Python', 'Java'])}...`,
      analysis: {
        score,
        skillNames: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB'].slice(0, randomInt(2, 5)),
        missingKeywords: ['Docker', 'Kubernetes', 'CI/CD', 'AWS'].slice(0, randomInt(1, 4)),
        weakBullets: ['Worked on various projects', 'Responsible for coding'],
        rewrittenBullets: ['Led development of 3 microservices serving 10K+ users', 'Architected CI/CD pipeline reducing deployment time by 60%'],
      },
    });
  }
  console.log(`   → ${createdUsers.length} resume records created`);

  // ---- Create Events ----
  console.log('\n📅 Creating upcoming events...');
  const events = [
    { title: 'Code-a-thon 2026', description: 'A 36-hour coding marathon open to all branches.', type: 'hackathon', date: new Date(Date.now() + 7 * 86400000) },
    { title: 'Campus Placement Drive — TCS', description: 'TCS NQT-based hiring for 2026 batch students.', type: 'placement', date: new Date(Date.now() + 14 * 86400000) },
    { title: 'DSA Marathon — Week 3', description: 'Competitive coding contest focused on graphs and DP.', type: 'contest', date: new Date(Date.now() + 3 * 86400000) },
    { title: 'AI/ML Workshop by Google', description: 'Hands-on TensorFlow workshop by Google Developer Experts.', type: 'workshop', date: new Date(Date.now() + 10 * 86400000) },
  ];
  for (const evt of events) {
    await Event.create({
      ...evt,
      college: COLLEGE,
      createdBy: faculty._id,
    });
  }
  console.log(`   → ${events.length} events created`);

  // ---- Summary ----
  console.log('\n' + '='.repeat(50));
  console.log('🎉 DEMO SEED COMPLETE!');
  console.log('='.repeat(50));
  console.log(`
  📊 Created:
     • 1 faculty + ${createdUsers.length} students
     • ${totalActivities} study sessions
     • ${totalQuizzes} quiz attempts  
     • ${totalInterviews} interview sessions
     • ${createdUsers.length} resume analyses
     • ${events.length} upcoming events

  🔑 Login Credentials:
     Faculty: faculty@demo.levelup / demo1234
     Student: aarav@demo.levelup / demo1234
             priya@demo.levelup / demo1234
             (any @demo.levelup email / demo1234)

  🏫 Classroom Code: ${CLASSROOM_CODE}
  `);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
