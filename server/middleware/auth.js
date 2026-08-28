import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ---------------------------------------------------------------------------
// Demo sessions
// ---------------------------------------------------------------------------
// The login page offers one-click demo access so a reviewer can see the product
// without an account. Those sessions carry a `demo_token_<role>_<ts>` string
// rather than a JWT. They are recognised here and given a synthetic identity
// flagged `isDemo`, which every data route uses to serve the reference cohort
// and refuse database writes. A demo session can therefore never read or touch
// a real student record.
const DEMO_IDENTITIES = {
  student: { _id: 'demo_student_01', name: 'Alex Chen', role: 'student', department: 'Computer Science & Engineering', college: 'Apex Institute of Technology', classroomCode: 'CSE-3A', year: 3, section: 'A' },
  faculty: { _id: 'demo_faculty_01', name: 'Dr. Sarah Jenkins', role: 'faculty', department: 'Computer Science & Engineering', college: 'Apex Institute of Technology', assignedClassrooms: ['CSE-3A', 'CSE-4B'] },
  hod: { _id: 'demo_hod_01', name: 'Dr. Ramesh Kulkarni', role: 'hod', department: 'Computer Science & Engineering', college: 'Apex Institute of Technology', employeeId: 'HOD-CSE-001' },
  principal: { _id: 'demo_principal_01', name: 'Dr. A. R. Sundaram', role: 'principal', department: 'Administration', college: 'Apex Institute of Technology' },
};

const demoAllowed = () => process.env.ALLOW_DEMO_LOGIN !== 'false';

export const resolveDemoUser = (token) => {
  if (!token || !token.startsWith('demo_token_') || !demoAllowed()) return null;
  const role = token.split('_')[2];
  const identity = DEMO_IDENTITIES[role] || DEMO_IDENTITIES.student;
  return { ...identity, isDemo: true };
};

/** Refuse writes from a demo session, with an explanation the UI can show. */
export const blockDemoWrites = (req, res, next) => {
  if (req.user?.isDemo) {
    return res.status(403).json({
      code: 'DEMO_READ_ONLY',
      message: 'This is a demo session. Sign in with a department account to save changes.',
    });
  }
  next();
};

// Protect routes (requires DB query)
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      const demoUser = resolveDemoUser(token);
      if (demoUser) {
        req.user = demoUser;
        return next();
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Lightweight token protection (no DB query, prevents hangs when DB is slow)
export const protectTokenOnly = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id }; // Minimal user object
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user ? req.user.role : 'None'} is not authorized to access this route`,
      });
    }
    next();
  };
};

// ---------------------------------------------------------------------------
// Object-level authorization (prevents IDOR / cross-tenant access)
// ---------------------------------------------------------------------------

const ciEquals = (a, b) => String(a || '').toUpperCase() === String(b || '').toUpperCase();

// Can this user read/write data for a given classroom code?
export const canAccessClassroom = async (user, rawCode) => {
  if (!user || !rawCode) return false;
  const code = String(rawCode);
  switch (user.role) {
    case 'student':
      return ciEquals(user.classroomCode, code);
    case 'faculty':
      return (user.assignedClassrooms || []).some(c => ciEquals(c, code));
    case 'hod':
      return Boolean(await User.exists({ classroomCode: code, college: user.college, department: user.department }));
    case 'principal':
    case 'placement':
    case 'admin':
      return Boolean(await User.exists({ classroomCode: code, college: user.college }));
    default:
      return false;
  }
};

// Can this user read another student's records?
export const canAccessStudent = async (user, studentId) => {
  if (!user || !studentId) return false;
  if (String(user._id) === String(studentId)) return true;
  const target = await User.findById(studentId).select('college department classroomCode').lean();
  if (!target) return false;
  switch (user.role) {
    case 'faculty':
      return (user.assignedClassrooms || []).some(c => ciEquals(c, target.classroomCode));
    case 'hod':
      return ciEquals(target.college, user.college) && ciEquals(target.department, user.department);
    case 'principal':
    case 'placement':
    case 'admin':
      return ciEquals(target.college, user.college);
    default:
      return false;
  }
};

// Middleware factory: guard a route by classroom code (default: req.params.code)
export const authorizeClassroom = (getCode = (req) => req.params.code) => async (req, res, next) => {
  try {
    const code = getCode(req);
    if (!code) return res.status(400).json({ message: 'Classroom code is required' });
    if (!(await canAccessClassroom(req.user, code))) {
      return res.status(403).json({ message: 'Not authorized to access this classroom' });
    }
    next();
  } catch (err) {
    console.error('authorizeClassroom error:', err);
    res.status(500).json({ message: 'Authorization check failed' });
  }
};

// Middleware factory: guard a route by student id (default: req.params.studentId)
export const authorizeStudent = (getId = (req) => req.params.studentId) => async (req, res, next) => {
  try {
    const studentId = getId(req);
    if (!studentId) return res.status(400).json({ message: 'Student id is required' });
    if (!(await canAccessStudent(req.user, studentId))) {
      return res.status(403).json({ message: 'Not authorized to access this student' });
    }
    next();
  } catch (err) {
    console.error('authorizeStudent error:', err);
    res.status(500).json({ message: 'Authorization check failed' });
  }
};

// Data scope middleware
export const scopeData = (req, res, next) => {
  const user = req.user;
  if (!user) return next();
  
  switch(user.role) {
    case 'student':
      req.scope = { classroomCode: user.classroomCode };
      break;
    case 'faculty':
      req.scope = { classroomCode: { $in: user.assignedClassrooms } };
      break;
    case 'hod':
      req.scope = { department: user.department, college: user.college };
      break;
    case 'principal':
    case 'placement':
      req.scope = { college: user.college };
      break;
    default:
      req.scope = {};
  }
  next();
}
