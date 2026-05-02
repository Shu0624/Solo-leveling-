import mongoose from 'mongoose';

const markSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    classroomCode: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    examType: {
      type: String,
      enum: ['CT-1', 'CT-2', 'CT-3', 'midsem', 'endsem', 'practical', 'assignment', 'other'],
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },
    academicYear: {
      type: String, // e.g. "2025-26"
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookups for leaderboard & student views
markSchema.index({ classroomCode: 1, subject: 1, examType: 1 });
markSchema.index({ studentId: 1, subject: 1 });
markSchema.index({ studentId: 1, classroomCode: 1 });
// Prevent duplicate entries for same student+subject+examType
markSchema.index({ studentId: 1, classroomCode: 1, subject: 1, examType: 1 }, { unique: true });

const Mark = mongoose.model('Mark', markSchema);
export default Mark;
