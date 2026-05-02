/**
 * seed_demo.js — Populates the database with realistic demo accounts
 * for testing all role-based features.
 *
 * Usage:  node scripts/seed_demo.js
 *
 * Creates:
 *   - 1 Faculty account
 *   - 1 HOD account
 *   - 1 Principal account
 *   - 1 Placement Officer account
 *   - 2 Student accounts
 *   - Sample assignments, attendance, announcements, marks
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Models
import User from '../models/User.js';
import Assignment from '../models/Assignment.js';
import Attendance from '../models/Attendance.js';
import Announcement from '../models/Announcement.js';
import Mark from '../models/Mark.js';

const COLLEGE = 'CSMSS College of Engineering';
const DEPARTMENT = 'Computer Science';
const CLASSROOM_CODE = 'CSE-3A';
const PASSWORD = 'demo123';

const DEMO_ACCOUNTS = [
  {
    name: 'Dr. Rajesh Kumar',
    email: 'faculty@demo.com',
    role: 'faculty',
    department: DEPARTMENT,
    college: COLLEGE,
    employeeId: 'FAC-COMP-001',
    assignedClassrooms: [CLASSROOM_CODE],
  },
  {
    name: 'Dr. Priya Sharma',
    email: 'hod@demo.com',
    role: 'hod',
    department: DEPARTMENT,
    college: COLLEGE,
    employeeId: 'FAC-COMP-002',
    assignedClassrooms: [CLASSROOM_CODE, 'CSE-3B'],
  },
  {
    name: 'Prof. Sunil Mehta',
    email: 'principal@demo.com',
    role: 'principal',
    department: DEPARTMENT,
    college: COLLEGE,
    employeeId: 'FAC-COMP-003',
    assignedClassrooms: [],
  },
  {
    name: 'Neha Patel',
    email: 'placement@demo.com',
    role: 'placement',
    department: DEPARTMENT,
    college: COLLEGE,
    employeeId: 'FAC-COMP-004',
    assignedClassrooms: [],
  },
  {
    name: 'Aarav Singh',
    email: 'student@demo.com',
    role: 'student',
    department: DEPARTMENT,
    college: COLLEGE,
    year: 3,
    section: 'A',
    classroomCode: CLASSROOM_CODE,
    enrollmentId: 'COMP-2025-001',
  },
  {
    name: 'Meera Joshi',
    email: 'student2@demo.com',
    role: 'student',
    department: DEPARTMENT,
    college: COLLEGE,
    year: 3,
    section: 'A',
    classroomCode: CLASSROOM_CODE,
    enrollmentId: 'COMP-2025-002',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(PASSWORD, salt);

    // ── Create / update demo users ──────────────────────────────
    const createdUsers = {};

    for (const account of DEMO_ACCOUNTS) {
      const existing = await User.findOne({ email: account.email });
      if (existing) {
        // Update the existing user to match demo config
        Object.assign(existing, account);
        existing.password = hashedPassword;
        await existing.save();
        createdUsers[account.role === 'student' ? account.email : account.role] = existing;
        console.log(`🔄 Updated: ${account.name} (${account.email}) — ${account.role}`);
      } else {
        const user = await User.create({ ...account, password: hashedPassword });
        createdUsers[account.role === 'student' ? account.email : account.role] = user;
        console.log(`✨ Created: ${account.name} (${account.email}) — ${account.role}`);
      }
    }

    const faculty = createdUsers['faculty'];
    const student1 = createdUsers['student@demo.com'];
    const student2 = createdUsers['student2@demo.com'];

    // ── Sample Assignments ──────────────────────────────────────
    const existingAssignment = await Assignment.findOne({ classroomCode: CLASSROOM_CODE, title: 'DBMS ER Diagram Assignment' });
    if (!existingAssignment) {
      await Assignment.create({
        classroomCode: CLASSROOM_CODE,
        subject: 'DBMS',
        title: 'DBMS ER Diagram Assignment',
        description: 'Design an ER diagram for a university management system covering Students, Courses, Faculty, and Departments with proper relationships.',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        maxMarks: 25,
        createdBy: faculty._id,
        submissions: [],
      });
      console.log('📝 Created sample assignment: DBMS ER Diagram');
    }

    const existingAssignment2 = await Assignment.findOne({ classroomCode: CLASSROOM_CODE, title: 'OS Process Scheduling Report' });
    if (!existingAssignment2) {
      await Assignment.create({
        classroomCode: CLASSROOM_CODE,
        subject: 'Operating Systems',
        title: 'OS Process Scheduling Report',
        description: 'Compare and contrast FCFS, SJF, Priority, and Round Robin scheduling algorithms with examples and Gantt charts.',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        maxMarks: 30,
        createdBy: faculty._id,
        submissions: [],
      });
      console.log('📝 Created sample assignment: OS Process Scheduling');
    }

    // ── Sample Announcements ────────────────────────────────────
    const existingAnn = await Announcement.findOne({ classroomCodes: CLASSROOM_CODE, title: 'Mid-Semester Exam Schedule Released' });
    if (!existingAnn) {
      await Announcement.create({
        classroomCodes: [CLASSROOM_CODE],
        title: 'Mid-Semester Exam Schedule Released',
        content: 'The mid-semester examination schedule has been released. Please check the notice board for your exam dates and venues. All students must carry their ID cards.',
        createdBy: faculty._id,
        isPinned: true,
      });
      console.log('📢 Created sample announcement: Mid-Semester Exam');
    }

    const existingAnn2 = await Announcement.findOne({ classroomCodes: CLASSROOM_CODE, title: 'Guest Lecture on Cloud Computing' });
    if (!existingAnn2) {
      await Announcement.create({
        classroomCodes: [CLASSROOM_CODE],
        title: 'Guest Lecture on Cloud Computing',
        content: 'A guest lecture on "Cloud Computing & DevOps in Industry" will be held next Monday at 2:00 PM in Seminar Hall B. Attendance is mandatory for all CSE-3A students.',
        createdBy: faculty._id,
        isPinned: false,
      });
      console.log('📢 Created sample announcement: Guest Lecture');
    }

    // ── Sample Marks ────────────────────────────────────────────
    if (student1 && student2) {
      const existingMark = await Mark.findOne({ student: student1._id, subject: 'DBMS', examType: 'CT-1' });
      if (!existingMark) {
        await Mark.create([
          { student: student1._id, classroomCode: CLASSROOM_CODE, subject: 'DBMS', examType: 'CT-1', marksObtained: 17, maxMarks: 20, addedBy: faculty._id },
          { student: student1._id, classroomCode: CLASSROOM_CODE, subject: 'DBMS', examType: 'CT-2', marksObtained: 15, maxMarks: 20, addedBy: faculty._id },
          { student: student1._id, classroomCode: CLASSROOM_CODE, subject: 'OS', examType: 'CT-1', marksObtained: 18, maxMarks: 20, addedBy: faculty._id },
          { student: student2._id, classroomCode: CLASSROOM_CODE, subject: 'DBMS', examType: 'CT-1', marksObtained: 14, maxMarks: 20, addedBy: faculty._id },
          { student: student2._id, classroomCode: CLASSROOM_CODE, subject: 'DBMS', examType: 'CT-2', marksObtained: 16, maxMarks: 20, addedBy: faculty._id },
          { student: student2._id, classroomCode: CLASSROOM_CODE, subject: 'OS', examType: 'CT-1', marksObtained: 12, maxMarks: 20, addedBy: faculty._id },
        ]);
        console.log('📊 Created sample marks for students');
      }
    }

    // ── Summary ─────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════');
    console.log('  ✅  DEMO SEED COMPLETE');
    console.log('═══════════════════════════════════════════════');
    console.log('\n  Login credentials (password for all: demo123)\n');
    console.log('  🏫 Faculty:    faculty@demo.com');
    console.log('  🎓 HOD:        hod@demo.com');
    console.log('  👔 Principal:  principal@demo.com');
    console.log('  💼 Placement:  placement@demo.com');
    console.log('  📚 Student 1:  student@demo.com');
    console.log('  📚 Student 2:  student2@demo.com');
    console.log('\n  Classroom Code: CSE-3A');
    console.log('  College: CSMSS College of Engineering');
    console.log('═══════════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
