import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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
