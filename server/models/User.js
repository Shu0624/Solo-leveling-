import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'hod', 'principal', 'placement'],
      default: 'student',
    },
    college: {
      type: String,
      required: [true, 'Please add a college name'],
    },
    department: {
      type: String,
    },
    year: {
      type: Number,
      min: 1,
      max: 4,
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },
    admissionYear: {
      type: Number,
    },
    section: {
      type: String,
    },
    classroomCode: {
      type: String,
    },
    assignedClassrooms: {
      type: [String],
    },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: Date },
    },
    dailyTasks: [
      {
        text: String,
        completed: { type: Boolean, default: false },
        date: Date,
      }
    ],
    enrollmentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },
    profilePicture: {
      type: String,
      default: 'default.jpg',
    },
    skills: {
      type: [String],
    },
    targets: {
      companies: [String],
      roles: [String],
      timeline: String,
    },
    // Academic & Department Management Fields (for Students)
    rollNo: {
      type: String,
      sparse: true,
    },
    usn: {
      type: String,
      sparse: true,
    },
    cgpa: {
      type: Number,
      default: 0,
    },
    sgpa: {
      type: Number,
      default: 0,
    },
    phone: {
      type: String,
    },
    parentPhone: {
      type: String,
    },
    mentorName: {
      type: String,
    },
    attendance: {
      percentage: { type: Number, default: 85 },
      totalLectures: { type: Number, default: 120 },
      attendedLectures: { type: Number, default: 102 },
      status: { type: String, default: 'safe' }, // 'safe' | 'caution' | 'defaulter'
      // Per-paper ledger. This is the bulky part of a student document and the
      // first thing the Excel archive moves off the record at end of term.
      subjects: [
        {
          code: String,
          subject: String,
          kind: { type: String, default: 'Theory' }, // 'Theory' | 'Laboratory'
          held: { type: Number, default: 0 },
          attended: { type: Number, default: 0 },
        }
      ],
    },
    backlogs: {
      activeCount: { type: Number, default: 0 },
      historyCount: { type: Number, default: 0 },
      subjects: { type: [String], default: [] },
    },
    iaMarks: [
      {
        code: String,
        subject: String,
        ia1: Number,
        ia2: Number,
        total: Number,
        maxMarks: { type: Number, default: 50 },
      }
    ],
    placementStatus: {
      status: { type: String, default: 'eligible' }, // 'eligible' | 'placed' | 'ineligible'
      company: String,
      package: String,
    },
    resumeScore: {
      type: Number,
      default: 0,
    },
    mentorRemarks: [
      {
        date: { type: Date, default: Date.now },
        author: String,
        note: String,
        category: { type: String, default: 'academic' },
      }
    ],
    // Set when detail has been exported to a workbook and pruned from this
    // document. Its presence is what lets the console offer a restore.
    archive: {
      archiveId: String,
      archivedAt: Date,
      archivedBy: String,
      categories: { type: [String], default: undefined },
    },
  },
  {
    timestamps: true,
  }
);

// Performance indexes for admin dashboards and analytics scoping
userSchema.index({ classroomCode: 1, role: 1 });
userSchema.index({ college: 1, department: 1, role: 1 });
userSchema.index({ role: 1 });
// Workbook imports match on USN first — this is the hot path for a 400-row
// file. That index already comes from `sparse: true` on the path itself;
// declaring it again here only produces a duplicate-index warning at boot.

const User = mongoose.model('User', userSchema);
export default User;
