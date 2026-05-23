import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(128),
  role: z.enum(['student', 'faculty', 'hod', 'principal', 'placement']).optional(),
  college: z.string().min(2).max(200),
  department: z.string().max(100).optional(),
  year: z.number().min(1).max(4).optional(),
  section: z.string().max(10).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string(),
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Auto-generate enrollment/employee ID
const generateEnrollmentId = async (department, year) => {
  const dept = (department || 'GEN').toUpperCase().slice(0, 4);
  const gradYear = year ? (2024 + (4 - year)) : 2028;
  const count = await User.countDocuments({ role: 'student' });
  const seq = String(count + 1).padStart(3, '0');
  return `${dept}-${gradYear}-${seq}`;
};

const generateEmployeeId = async (department) => {
  const dept = (department || 'GEN').toUpperCase().slice(0, 4);
  const count = await User.countDocuments({ role: { $in: ['faculty', 'hod', 'principal', 'placement'] } });
  const seq = String(count + 1).padStart(3, '0');
  return `FAC-${dept}-${seq}`;
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
  skills: user.skills,
  targets: user.targets,
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

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate classroom code for students if applicable
    let classroomCode = '';
    if (department && year && section) {
      classroomCode = `${department}-${year}${section}`.toUpperCase();
    }

    // Auto-generate IDs based on role
    const isStaffRole = ['faculty', 'hod', 'principal', 'placement'].includes(role);
    let enrollmentId;
    let employeeId;
    let assignedClassrooms = [];

    if (isStaffRole) {
      employeeId = await generateEmployeeId(department);
      // For faculty, auto-assign the classroom code so they can manage it immediately
      if (classroomCode) {
        assignedClassrooms = [classroomCode];
      }
    } else {
      enrollmentId = await generateEnrollmentId(department, year);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
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
      enrollmentId,
      employeeId,
    });

    if (user) {
      res.status(201).json(buildUserResponse(user, generateToken(user._id)));
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json(buildUserResponse(user, generateToken(user._id)));
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user data (+ retroactive ID assignment for older accounts)
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  const user = req.user;

  // Retroactive ID generation for users who registered before this feature
  let needsSave = false;
  if (user.role === 'student' && !user.enrollmentId) {
    user.enrollmentId = await generateEnrollmentId(user.department, user.year);
    needsSave = true;
  }
  if (['faculty', 'hod', 'principal', 'placement'].includes(user.role) && !user.employeeId) {
    user.employeeId = await generateEmployeeId(user.department);
    needsSave = true;
  }
  if (needsSave) {
    await user.save();
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

    const { name, college, department, year, section, classroomCode } = req.body;

    // Fields update
    if (name !== undefined) user.name = String(name).substring(0, 100);
    if (college !== undefined) user.college = String(college).substring(0, 200);
    if (department !== undefined) user.department = String(department).substring(0, 100);
    
    // Academic fields updates
    if (year !== undefined) {
      user.year = year ? Number(year) : undefined;
    }
    if (section !== undefined) {
      user.section = section ? String(section).substring(0, 10) : undefined;
    }

    // Dynamic classroom code auto-regeneration
    if (classroomCode !== undefined) {
      const code = String(classroomCode).substring(0, 20).toUpperCase();
      user.classroomCode = code || undefined;
      if (user.role !== 'student' && code) {
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

    // Dynamic ID regeneration if key fields updated
    if (user.role === 'student') {
      if (user.department && user.year) {
        user.enrollmentId = await generateEnrollmentId(user.department, user.year);
      }
    } else {
      if (user.department) {
        user.employeeId = await generateEmployeeId(user.department);
      }
    }

    const updatedUser = await user.save();

    res.json(buildUserResponse(updatedUser, generateToken(updatedUser._id)));
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

