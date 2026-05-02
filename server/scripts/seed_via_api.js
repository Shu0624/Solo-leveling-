/**
 * seed_via_api.js — Seeds demo accounts through the running server API
 * Usage: node scripts/seed_via_api.js
 */

const BASE = 'http://localhost:5000/api';

const ACCOUNTS = [
  { name: 'Dr. Rajesh Kumar', email: 'faculty@demo.com', password: 'demo123', role: 'faculty', college: 'CSMSS College of Engineering', department: 'Computer Science' },
  { name: 'Dr. Priya Sharma', email: 'hod@demo.com', password: 'demo123', role: 'hod', college: 'CSMSS College of Engineering', department: 'Computer Science' },
  { name: 'Prof. Sunil Mehta', email: 'principal@demo.com', password: 'demo123', role: 'principal', college: 'CSMSS College of Engineering', department: 'Computer Science' },
  { name: 'Neha Patel', email: 'placement@demo.com', password: 'demo123', role: 'placement', college: 'CSMSS College of Engineering', department: 'Computer Science' },
  { name: 'Aarav Singh', email: 'student@demo.com', password: 'demo123', role: 'student', college: 'CSMSS College of Engineering', department: 'Computer Science', year: 3, section: 'A' },
  { name: 'Meera Joshi', email: 'student2@demo.com', password: 'demo123', role: 'student', college: 'CSMSS College of Engineering', department: 'Computer Science', year: 3, section: 'A' },
];

async function seed() {
  console.log('Seeding demo accounts via API...\n');

  for (const account of ACCOUNTS) {
    try {
      const res = await fetch(`${BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✨ Created: ${account.name} (${account.email}) — role: ${data.role}, id: ${data.employeeId || data.enrollmentId}`);
      } else {
        console.log(`⚠️  ${account.email}: ${data.message}`);
      }
    } catch (err) {
      console.log(`❌ ${account.email}: ${err.message}`);
    }
  }

  // Now login as faculty and create sample data
  console.log('\nCreating sample assessment data...\n');

  try {
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'faculty@demo.com', password: 'demo123' }),
    });
    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      console.log('⚠️  Could not login as faculty. Skipping assessment data.');
      return;
    }

    const token = loginData.token;
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // Determine classroom code from faculty's assignedClassrooms
    const classroomCode = loginData.assignedClassrooms?.[0] || 'COMPUTER SCIENCE-3A';

    // Create sample assignment
    try {
      const assignRes = await fetch(`${BASE}/assessment/assignment`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          classroomCode,
          subject: 'DBMS',
          title: 'DBMS ER Diagram Assignment',
          description: 'Design an ER diagram for a university management system covering Students, Courses, Faculty, and Departments.',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          maxMarks: 25,
        }),
      });
      const assignData = await assignRes.json();
      console.log(assignRes.ok ? '📝 Created assignment: DBMS ER Diagram' : `⚠️  Assignment: ${assignData.message}`);
    } catch (e) { console.log('⚠️  Assignment creation failed:', e.message); }

    // Create sample announcement
    try {
      const annRes = await fetch(`${BASE}/assessment/announcement`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          classroomCodes: classroomCode,
          title: 'Mid-Semester Exam Schedule Released',
          content: 'The mid-semester examination schedule has been released. Please check the notice board for your exam dates and venues.',
          isPinned: true,
        }),
      });
      const annData = await annRes.json();
      console.log(annRes.ok ? '📢 Created announcement: Mid-Semester Exam' : `⚠️  Announcement: ${annData.message}`);
    } catch (e) { console.log('⚠️  Announcement creation failed:', e.message); }

  } catch (err) {
    console.log('❌ Faculty login failed:', err.message);
  }

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
  console.log('\n  Classroom Code: COMPUTER SCIENCE-3A');
  console.log('  College: CSMSS College of Engineering');
  console.log('═══════════════════════════════════════════════\n');
}

seed();
