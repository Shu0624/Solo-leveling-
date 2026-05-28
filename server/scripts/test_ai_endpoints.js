import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import User from '../models/User.js';
import Assignment from '../models/Assignment.js';

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: '../.env' });

const makeRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- STARTING AI ENDPOINTS END-TO-END VALIDATION ---');

  // 1. Login as Faculty to get token
  const facultyLoginData = JSON.stringify({
    email: 'faculty@demo.com',
    password: 'demo123'
  });
  console.log('Logging in as faculty@demo.com...');
  const facultyLogin = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(facultyLoginData)
    }
  }, facultyLoginData);

  if (facultyLogin.status !== 200 || !facultyLogin.data.token) {
    console.error('Faculty login failed:', facultyLogin.status, facultyLogin.data);
    process.exit(1);
  }

  const facultyToken = facultyLogin.data.token;
  console.log('✅ Faculty login successful! Token acquired.');

  // Connect to DB directly to fetch an assignment ID and student ID for tests
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected!');

  // Find student ID
  const studentUser = await User.findOne({ email: 'student@demo.com' });
  if (!studentUser) {
    console.error('student@demo.com not found in database');
    process.exit(1);
  }
  const studentId = studentUser._id.toString();
  console.log(`Found student ID: ${studentId}`);

  // Find or create an assignment with a submission for testing
  let assignment = await Assignment.findOne({ classroomCode: 'CSMSS-CO-3A' });
  if (!assignment) {
    // try to find any assignment
    assignment = await Assignment.findOne({});
  }

  if (!assignment) {
    console.log('Creating a dummy assignment and submission for test...');
    assignment = await Assignment.create({
      classroomCode: 'CSMSS-CO-3A',
      subject: 'Data Structures',
      title: 'Linked List Implementation',
      description: 'Implement a singly linked list in C++.',
      deadline: new Date(Date.now() + 86400000),
      maxMarks: 100,
      submissions: [{
        studentId: studentUser._id,
        text: 'My submission contains full Linked List implementation in C++ using struct Node.',
        isLate: false
      }]
    });
  } else {
    // Ensure it has a submission
    if (!assignment.submissions || assignment.submissions.length === 0) {
      assignment.submissions = [{
        studentId: studentUser._id,
        text: 'My submission contains full Linked List implementation in C++ using struct Node.',
        isLate: false
      }];
      await assignment.save();
    }
  }

  const assignmentId = assignment._id.toString();
  console.log(`Using Assignment ID: ${assignmentId} for AI grading test.`);

  // 2. Test AI Grading Endpoint
  console.log('Testing AI Grade Assignment endpoint (/api/assessment/assignment/:id/ai-grade)...');
  const aiGradePayload = JSON.stringify({ studentId });
  const aiGradeRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/assessment/assignment/${assignmentId}/ai-grade`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(aiGradePayload),
      'Authorization': `Bearer ${facultyToken}`
    }
  }, aiGradePayload);

  console.log('AI Grade status:', aiGradeRes.status);
  console.log('AI Grade response data:', JSON.stringify(aiGradeRes.data, null, 2));

  if (aiGradeRes.status === 200) {
    console.log('✅ AI Grading endpoint verified successfully!');
  } else {
    console.error('❌ AI Grading endpoint validation failed!');
  }

  // 3. Test Student Intervention Endpoint (Faculty-led)
  console.log('Testing Academic Intervention endpoint as faculty (/api/assessment/intervention)...');
  const interventionPayload = JSON.stringify({
    studentId,
    classroomCode: 'CSMSS-CO-3A'
  });
  const interventionRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/assessment/intervention`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(interventionPayload),
      'Authorization': `Bearer ${facultyToken}`
    }
  }, interventionPayload);

  console.log('Intervention status:', interventionRes.status);
  console.log('Intervention plan summary snippet:', interventionRes.data.intervention?.slice(0, 300) + '...');

  if (interventionRes.status === 200) {
    console.log('✅ AI Intervention endpoint (Faculty) verified successfully!');
  } else {
    console.error('❌ AI Intervention endpoint (Faculty) validation failed!');
  }

  // 4. Login as Student to check self-intervention
  const studentLoginData = JSON.stringify({
    email: 'student@demo.com',
    password: 'demo123'
  });
  console.log('Logging in as student@demo.com...');
  const studentLogin = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(studentLoginData)
    }
  }, studentLoginData);

  if (studentLogin.status !== 200 || !studentLogin.data.token) {
    console.error('Student login failed:', studentLogin.status, studentLogin.data);
    process.exit(1);
  }

  const studentToken = studentLogin.data.token;
  console.log('✅ Student login successful! Token acquired.');

  // 5. Test Student Intervention Endpoint (Student-led)
  console.log('Testing Academic Intervention endpoint as student (/api/assessment/intervention)...');
  const studentInterventionPayload = JSON.stringify({
    classroomCode: 'CSMSS-CO-3A'
  });
  const studentInterventionRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/assessment/intervention`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(studentInterventionPayload),
      'Authorization': `Bearer ${studentToken}`
    }
  }, studentInterventionPayload);

  console.log('Student Self-Intervention status:', studentInterventionRes.status);
  console.log('Student Self-Intervention plan summary snippet:', studentInterventionRes.data.intervention?.slice(0, 300) + '...');

  if (studentInterventionRes.status === 200) {
    console.log('✅ AI Intervention endpoint (Student) verified successfully!');
  } else {
    console.error('❌ AI Intervention endpoint (Student) validation failed!');
  }

  await mongoose.disconnect();
  console.log('--- ALL AI ENDPOINT TESTS COMPLETED ---');
  process.exit(0);
};

runTests().catch(err => {
  console.error('Test Execution Error:', err);
  process.exit(1);
});
