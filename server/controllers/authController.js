import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { getJwtSecret, isJwtConfigured } from '../config/jwt.js';
import { demoAllowed } from '../middleware/auth.js';

// Validation schemas
// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(128),
  role: z.enum(['student', 'faculty', 'hod', 'principal', 'placement']).optional(),
  staffSignupCode: z.string().max(200).optional(),
  college: z.string().min(2).max(200),
  department: z.string().max(100).optional(),
  year: z.number().min(1).max(4).optional(),
  section: z.string().max(10).optional(),
  // 1. Basic Information
  rollNo: z.string().max(50).optional(),
  prn: z.string().max(50).optional(),
  dob: z.string().max(30).optional(),
  gender: z.string().max(30).optional(),
  academicYear: z.string().max(30).optional(),
  // 2. Contact Information
  phone: z.string().max(30).optional(),
  personalEmail: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
  address: z.string().max(300).optional(),
  parentName: z.string().max(100).optional(),
  parentPhone: z.string().max(30).optional(),
  // 3. Academic Information
  cgpa: z.number().min(0).max(10).optional(),
  sgpa: z.number().min(0).max(10).optional(),
  prevSgpa: z.number().min(0).max(10).optional(),
  currentSubjects: z.array(z.string()).optional(),
  academicStrengths: z.array(z.string()).optional(),
  weakSubjects: z.array(z.string()).optional(),
  // 4. Professional & Career Information
  linkedinUrl: z.string().max(300).optional().or(z.literal('')),
  githubUrl: z.string().max(300).optional().or(z.literal('')),
  portfolioUrl: z.string().max(300).optional().or(z.literal('')),
  resumeUrl: z.string().max(300).optional().or(z.literal('')),
  careerInterest: z.string().max(100).optional(),
  preferredDomain: z.string().max(100).optional(),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.object({
    name: z.string().optional(),
    issuer: z.string().optional(),
    year: z.string().optional(),
    credentialUrl: z.string().optional(),
  })).optional(),
  projects: z.array(z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    techStack: z.array(z.string()).optional(),
    githubLink: z.string().optional(),
    liveLink: z.string().optional(),
  })).optional(),
  internships: z.array(z.object({
    company: z.string().optional(),
    role: z.string().optional(),
    duration: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string(),
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ---------------------------------------------------------------------------
// Privileged role gate
// ---------------------------------------------------------------------------
// The public registration form offers a role dropdown, and the server used to
// take whatever it was given. That meant anyone could register as `principal`
// against a real college name and read every student record in it — CGPA,
// attendance, backlogs, parent phone numbers, placement status.
//
// Staff roles now require STAFF_SIGNUP_CODE, a shared secret the department
// hands to its own staff. If the variable is unset, staff self-registration is
// refused outright rather than defaulting to open.
const STAFF_ROLES = ['faculty', 'hod', 'principal', 'placement'];

const timingSafeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  // compare fixed-length digests so differing lengths don't throw or leak
  const digestA = crypto.createHash('sha256').update(bufA).digest();
  const digestB = crypto.createHash('sha256').update(bufB).digest();
  return crypto.timingSafeEqual(digestA, digestB);
};

/**
 * @returns {{ok: true}} or {{ok: false, message: string}}
 */
export const checkStaffSignup = (role, providedCode) => {
  if (!STAFF_ROLES.includes(role)) return { ok: true };

  const expected = process.env.STAFF_SIGNUP_CODE;
  if (!expected) {
    return {
      ok: false,
      message: 'Staff accounts cannot be self-registered on this deployment. Contact your department administrator.',
    };
  }
  if (!providedCode || !timingSafeEqual(providedCode, expected)) {
    return { ok: false, message: 'Invalid staff access code.' };
  }
  return { ok: true };
};

// Auto-generate enrollment/employee ID
// These IDs were previously derived from `countDocuments() + 1` over the whole
// collection. Two registrations racing each other computed the same sequence
// and the second one hit the unique index (E11000), surfacing as a bare 500.
// The count also ignored the prefix, so the sequence had nothing to do with the
// run of IDs it was joining.
//
// Now: read the highest sequence already issued *for this prefix*, take the
// next one, and let the unique index arbitrate a race by retrying.
const MAX_CODE_POINT = String.fromCharCode(0xffff);

const nextSequenceForPrefix = async (field, prefix) => {
  // Range scan rather than a regex: prefix-ordered, index-friendly, and it
  // needs no escaping of whatever the department name happens to contain.
  const latest = await User.findOne(
    { [field]: { $gte: prefix, $lt: prefix + MAX_CODE_POINT } },
    { [field]: 1 }
  )
    .sort({ [field]: -1 })
    .lean();

  if (!latest || !latest[field]) return 1;
  const parsed = parseInt(String(latest[field]).slice(prefix.length), 10);
  return Number.isFinite(parsed) ? parsed + 1 : 1;
};

const enrollmentPrefix = (department, year) => {
  const dept = (department || 'GEN').toUpperCase().slice(0, 4);
  const gradYear = year ? (2024 + (4 - year)) : 2028;
  return `${dept}-${gradYear}-`;
};

const employeePrefix = (department) => {
  const dept = (department || 'GEN').toUpperCase().slice(0, 4);
  return `FAC-${dept}-`;
};

export const generateEnrollmentId = async (department, year, attempt = 0) => {
  const prefix = enrollmentPrefix(department, year);
  const seq = (await nextSequenceForPrefix('enrollmentId', prefix)) + attempt;
  return `${prefix}${String(seq).padStart(3, '0')}`;
};

export const generateEmployeeId = async (department, attempt = 0) => {
  const prefix = employeePrefix(department);
  const seq = (await nextSequenceForPrefix('employeeId', prefix)) + attempt;
  return `${prefix}${String(seq).padStart(3, '0')}`;
};

/**
 * Run `save` with a freshly minted ID, stepping the sequence forward each time
 * the unique index rejects it. Concurrent registrations therefore queue up
 * behind each other instead of one of them failing outright.
 */
export const saveWithUniqueId = async (mint, apply, attempts = 5) => {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await apply(await mint(attempt));
    } catch (err) {
      const isDuplicateId =
        err?.code === 11000 &&
        Object.keys(err.keyValue || {}).some((k) => k === 'enrollmentId' || k === 'employeeId');
      if (!isDuplicateId || attempt === attempts - 1) throw err;
    }
  }
};

// Helper to build consistent user response object
const buildUserResponse = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  college: user.college,
  department: user.department,
  year: user.year,
  section: user.section,
  classroomCode: user.classroomCode,
  assignedClassrooms: user.assignedClassrooms,
  enrollmentId: user.enrollmentId,
  employeeId: user.employeeId,
  profilePicture: user.profilePicture,
  streak: user.streak,
  skills: user.skills || [],
  targets: user.targets,
  // 1. Basic Information
  rollNo: user.rollNo,
  prn: user.prn,
  usn: user.usn,
  dob: user.dob,
  gender: user.gender,
  academicYear: user.academicYear || '2025–2026',
  // 2. Contact Information
  phone: user.phone,
  personalEmail: user.personalEmail,
  address: user.address,
  parentName: user.parentName,
  parentPhone: user.parentPhone,
  mentorName: user.mentorName,
  // 3. Academic Information
  cgpa: user.cgpa,
  sgpa: user.sgpa,
  prevSgpa: user.prevSgpa,
  currentSubjects: user.currentSubjects || [],
  academicStrengths: user.academicStrengths || [],
  weakSubjects: user.weakSubjects || [],
  attendance: user.attendance,
  backlogs: user.backlogs,
  iaMarks: user.iaMarks,
  placementStatus: user.placementStatus,
  resumeScore: user.resumeScore,
  // 4. Professional & Career Information
  linkedinUrl: user.linkedinUrl,
  githubUrl: user.githubUrl,
  portfolioUrl: user.portfolioUrl,
  resumeUrl: user.resumeUrl,
  careerInterest: user.careerInterest || 'Job',
  preferredDomain: user.preferredDomain || 'Full-Stack Web',
  certifications: user.certifications || [],
  projects: user.projects || [],
  internships: user.internships || [],
  mentorRemarks: user.mentorRemarks || [],
  token: token || undefined,
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password, college, department, year, section } = validatedData;

    const role = validatedData.role || 'student';

    // A staff role must be proven, not merely claimed. Checked before any
    // database work so a probe for valid codes costs the same as a rejection.
    const staffCheck = checkStaffSignup(role, validatedData.staffSignupCode);
    if (!staffCheck.ok) {
      return res.status(403).json({ code: 'STAFF_SIGNUP_REFUSED', message: staffCheck.message });
    }

    // Generate classroom code for students if applicable
    let classroomCode = '';
    if (department && year && section) {
      classroomCode = `${department}-${year}${section}`.toUpperCase();
    }

    // Auto-generate IDs based on role
    const isStaffRole = STAFF_ROLES.includes(role);
    let assignedClassrooms = [];

    if (isStaffRole && classroomCode) {
      // For faculty, auto-assign the classroom code so they can manage it immediately
      assignedClassrooms = [classroomCode];
    }

    // Check database availability and JWT configuration before DB operations
    const dbReady = mongoose.connection.readyState === 1;
    const jwtReady = isJwtConfigured();

    if (!dbReady || !jwtReady) {
      // If demo mode is permitted and registering as a student, grant immediate seamless access
      if (demoAllowed() && role === 'student') {
        const deptPrefix = (department || 'GEN').toUpperCase().slice(0, 4);
        const gradYear = year ? (2024 + (4 - year)) : 2028;
        const generatedId = `${deptPrefix}-${gradYear}-${Math.floor(100 + Math.random() * 900)}`;

        const syntheticUser = {
          _id: '65f1a1a1a1a1a1a1a1a10001',
          name,
          email,
          role: 'student',
          college,
          department,
          year,
          section,
          classroomCode,
          assignedClassrooms: [],
          enrollmentId: generatedId,
          rollNo: validatedData.rollNo,
          prn: validatedData.prn,
          dob: validatedData.dob,
          gender: validatedData.gender,
          academicYear: validatedData.academicYear || '2025–2026',
          phone: validatedData.phone,
          personalEmail: validatedData.personalEmail,
          address: validatedData.address,
          parentName: validatedData.parentName,
          parentPhone: validatedData.parentPhone,
          cgpa: validatedData.cgpa || 8.5,
          sgpa: validatedData.sgpa || 8.2,
          prevSgpa: validatedData.prevSgpa || 8.0,
          currentSubjects: validatedData.currentSubjects || [],
          academicStrengths: validatedData.academicStrengths || [],
          weakSubjects: validatedData.weakSubjects || [],
          linkedinUrl: validatedData.linkedinUrl,
          githubUrl: validatedData.githubUrl,
          portfolioUrl: validatedData.portfolioUrl,
          resumeUrl: validatedData.resumeUrl,
          careerInterest: validatedData.careerInterest || 'Campus Placement / Tech Job',
          preferredDomain: validatedData.preferredDomain || 'Full-Stack Web',
          skills: (validatedData.skills && validatedData.skills.length > 0) ? validatedData.skills : ['JavaScript', 'React', 'Node.js', 'Python'],
          certifications: validatedData.certifications || [],
          projects: validatedData.projects || [],
          internships: validatedData.internships || [],
          isDemo: true,
        };

        const demoToken = `demo_token_student_${Date.now()}`;
        return res.status(201).json(buildUserResponse(syntheticUser, demoToken));
      }

      return res.status(503).json({
        code: 'DB_UNAVAILABLE',
        message: 'Registration is temporarily unavailable because the database is offline. Please use 1-Click Demo Login on the Sign-in page.',
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email address already exists.' });
    }

    const mintId = (attempt) => (
      isStaffRole
        ? generateEmployeeId(department, attempt)
        : generateEnrollmentId(department, year, attempt)
    );

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with 4-pillar dataset. Wrapped so that a concurrent
    // registration claiming the same sequence retries with the next one
    // instead of failing the request.
    const user = await saveWithUniqueId(mintId, (generatedId) => User.create({
      name,
      email,
      password: hashedPassword,
      role,
      college,
      department,
      year: isStaffRole ? undefined : year,
      section: isStaffRole ? undefined : section,
      classroomCode: isStaffRole ? undefined : classroomCode,
      assignedClassrooms,
      enrollmentId: isStaffRole ? undefined : generatedId,
      employeeId: isStaffRole ? generatedId : undefined,
      // 1. Basic Information
      rollNo: validatedData.rollNo,
      prn: validatedData.prn,
      dob: validatedData.dob,
      gender: validatedData.gender,
      academicYear: validatedData.academicYear || '2025–2026',
      // 2. Contact Information
      phone: validatedData.phone,
      personalEmail: validatedData.personalEmail,
      address: validatedData.address,
      parentName: validatedData.parentName,
      parentPhone: validatedData.parentPhone,
      // 3. Academic Information
      cgpa: validatedData.cgpa || 0,
      sgpa: validatedData.sgpa || 0,
      prevSgpa: validatedData.prevSgpa || 0,
      currentSubjects: validatedData.currentSubjects || [],
      academicStrengths: validatedData.academicStrengths || [],
      weakSubjects: validatedData.weakSubjects || [],
      // 4. Professional & Career Information
      linkedinUrl: validatedData.linkedinUrl,
      githubUrl: validatedData.githubUrl,
      portfolioUrl: validatedData.portfolioUrl,
      resumeUrl: validatedData.resumeUrl,
      careerInterest: validatedData.careerInterest || 'Job',
      preferredDomain: validatedData.preferredDomain || 'Full-Stack Web',
      skills: validatedData.skills || [],
      certifications: validatedData.certifications || [],
      projects: validatedData.projects || [],
      internships: validatedData.internships || [],
    }));

    if (user) {
      res.status(201).json(buildUserResponse(user, generateToken(user._id)));
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0]?.message || 'Validation error' });
    }
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'field';
      return res.status(400).json({ message: `An account with this ${field} already exists.` });
    }
    if (error?.name === 'ValidationError') {
      const firstErr = Object.values(error.errors || {})[0]?.message || error.message;
      return res.status(400).json({ message: firstErr });
    }
    if (error?.name === 'MongooseError' || error?.message?.includes('buffering') || error?.message?.includes('connection')) {
      if (demoAllowed() && req.body?.role !== 'faculty' && req.body?.role !== 'hod' && req.body?.role !== 'principal') {
        const syntheticUser = {
          _id: '65f1a1a1a1a1a1a1a1a10001',
          name: req.body?.name || 'Student',
          email: req.body?.email || 'student@levelup.edu',
          role: 'student',
          college: req.body?.college || 'Apex Institute of Technology',
          department: req.body?.department || 'Computer Science & Engineering',
          year: req.body?.year || 3,
          section: req.body?.section || 'A',
          classroomCode: 'CSE-3A',
          assignedClassrooms: [],
          enrollmentId: 'CSE-2028-101',
          isDemo: true,
        };
        const demoToken = `demo_token_student_${Date.now()}`;
        return res.status(201).json(buildUserResponse(syntheticUser, demoToken));
      }
      return res.status(503).json({
        code: 'DB_UNAVAILABLE',
        message: 'Database connection is temporarily offline. Please use 1-Click Demo Login.',
      });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: error?.message || 'Server error during registration' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;
    const lowerEmail = email.toLowerCase().trim();

    // ---------------------------------------------------------------------
    // Real credentials
    // ---------------------------------------------------------------------
    // If the database is unreachable we cannot verify a password, so we say
    // so. The previous behaviour was to fall through and mint a session from
    // the email address alone, which let `principal@anything.com` sign in with
    // any password at all — and, because the "user not found" branch had no
    // return, it did that on a perfectly healthy database too.
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        code: 'DB_UNAVAILABLE',
        message: 'Sign-in is temporarily unavailable. Please try again shortly.',
      });
    }

    const user = await User.findOne({ email: lowerEmail }).select('+password');

    // One message and one shape for both "no such user" and "wrong password",
    // so the response cannot be used to enumerate registered addresses.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json(buildUserResponse(user, generateToken(user._id)));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user data (+ retroactive ID assignment for older accounts)
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  const user = req.user;

  // Demo identities are synthetic objects, not documents — nothing to backfill.
  if (user.isDemo) {
    return res.status(200).json(buildUserResponse(user));
  }

  // Backfill an ID for accounts created before IDs existed. This only ever
  // fills a blank; it never rewrites one that is already set. A failure here
  // must not break reading your own profile, so it is caught and logged.
  try {
    const isStaffRole = STAFF_ROLES.includes(user.role);
    const missingId = isStaffRole ? !user.employeeId : !user.enrollmentId;

    if (missingId) {
      await saveWithUniqueId(
        (attempt) => (isStaffRole
          ? generateEmployeeId(user.department, attempt)
          : generateEnrollmentId(user.department, user.year, attempt)),
        (generatedId) => {
          if (isStaffRole) user.employeeId = generatedId;
          else user.enrollmentId = generatedId;
          return user.save();
        }
      );
    }
  } catch (err) {
    console.error('[AUTH] ID backfill failed for user', String(user._id), '—', err.message);
  }

  res.status(200).json(buildUserResponse(user));
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      name, college, department, year, section, classroomCode,
      // 1. Basic
      rollNo, prn, dob, gender, academicYear, profilePicture,
      // 2. Contact
      phone, personalEmail, address, parentName, parentPhone,
      // 3. Academic
      cgpa, sgpa, prevSgpa, currentSubjects, academicStrengths, weakSubjects,
      // 4. Professional & Career
      linkedinUrl, githubUrl, portfolioUrl, resumeUrl, careerInterest, preferredDomain,
      skills, certifications, projects, internships
    } = req.body;

    // Fields update
    if (name !== undefined) user.name = String(name).substring(0, 100);
    if (college !== undefined) user.college = String(college).substring(0, 200);
    if (department !== undefined) user.department = String(department).substring(0, 100);
    if (profilePicture !== undefined) user.profilePicture = String(profilePicture);

    // 1. Basic updates
    if (rollNo !== undefined) user.rollNo = String(rollNo);
    if (prn !== undefined) user.prn = String(prn);
    if (dob !== undefined) user.dob = String(dob);
    if (gender !== undefined) user.gender = String(gender);
    if (academicYear !== undefined) user.academicYear = String(academicYear);

    // 2. Contact updates
    if (phone !== undefined) user.phone = String(phone);
    if (personalEmail !== undefined) user.personalEmail = String(personalEmail).trim().toLowerCase();
    if (address !== undefined) user.address = String(address);
    if (parentName !== undefined) user.parentName = String(parentName);
    if (parentPhone !== undefined) user.parentPhone = String(parentPhone);

    // 3. Academic updates
    if (cgpa !== undefined) user.cgpa = Number(cgpa);
    if (sgpa !== undefined) user.sgpa = Number(sgpa);
    if (prevSgpa !== undefined) user.prevSgpa = Number(prevSgpa);
    if (currentSubjects !== undefined && Array.isArray(currentSubjects)) user.currentSubjects = currentSubjects;
    if (academicStrengths !== undefined && Array.isArray(academicStrengths)) user.academicStrengths = academicStrengths;
    if (weakSubjects !== undefined && Array.isArray(weakSubjects)) user.weakSubjects = weakSubjects;

    // 4. Professional & Career updates
    if (linkedinUrl !== undefined) user.linkedinUrl = String(linkedinUrl);
    if (githubUrl !== undefined) user.githubUrl = String(githubUrl);
    if (portfolioUrl !== undefined) user.portfolioUrl = String(portfolioUrl);
    if (resumeUrl !== undefined) user.resumeUrl = String(resumeUrl);
    if (careerInterest !== undefined) user.careerInterest = String(careerInterest);
    if (preferredDomain !== undefined) user.preferredDomain = String(preferredDomain);
    if (skills !== undefined && Array.isArray(skills)) user.skills = skills;
    if (certifications !== undefined && Array.isArray(certifications)) user.certifications = certifications;
    if (projects !== undefined && Array.isArray(projects)) user.projects = projects;
    if (internships !== undefined && Array.isArray(internships)) user.internships = internships;
    
    // Academic fields updates
    if (year !== undefined) {
      user.year = year ? Number(year) : undefined;
    }
    if (section !== undefined) {
      user.section = section ? String(section).substring(0, 10) : undefined;
    }

    // A staff member may only self-assign classrooms within their own department.
    // classroomCode is formatted as `${department}-${year}${section}`, so the
    // segment before the first '-' must match the user's department.
    const belongsToDept = (code) => {
      if (!user.department) return false;
      const prefix = String(code).split('-')[0];
      return prefix.toUpperCase() === String(user.department).toUpperCase();
    };

    // Dynamic classroom code auto-regeneration
    if (classroomCode !== undefined) {
      const code = String(classroomCode).substring(0, 20).toUpperCase();
      user.classroomCode = code || undefined;
      if (user.role !== 'student' && code && belongsToDept(code)) {
        if (!user.assignedClassrooms) user.assignedClassrooms = [];
        if (!user.assignedClassrooms.includes(code)) {
          user.assignedClassrooms.push(code);
        }
      }
    } else if (user.department && user.year && user.section) {
      // Auto-compute classroomCode from department-yearSection
      const autoCode = `${user.department}-${user.year}${user.section}`.toUpperCase();
      user.classroomCode = autoCode;
      if (user.role !== 'student') {
        if (!user.assignedClassrooms) user.assignedClassrooms = [];
        if (!user.assignedClassrooms.includes(autoCode)) {
          user.assignedClassrooms.push(autoCode);
        }
      }
    }

    // An enrollment number is an identity, not a derived field. It used to be
    // re-minted on every profile save, so editing your own name silently
    // changed your enrollment ID — and two concurrent saves could collide on
    // the unique index and fail the request. IDs are now issued once, at
    // registration (or retroactively in getMe for pre-existing accounts), and
    // never rewritten here.

    const updatedUser = await user.save();

    // Do not re-mint a token on profile edits — the client keeps its existing
    // session, and re-issuing needlessly extends token lifetime.
    res.json(buildUserResponse(updatedUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (user) {
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide both old and new passwords' });
      }
      if (typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 128) {
        return res.status(400).json({ message: 'New password must be between 6 and 128 characters' });
      }

      if (!(await bcrypt.compare(oldPassword, user.password))) {
        return res.status(401).json({ message: 'Incorrect old password' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

