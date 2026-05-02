import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    classroomCode: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    // Subject-wise tracking (DBATU/CSMSS style)
    subject: {
      type: String,
      default: 'General',
    },
    // Lecture type: theory or practical
    lectureType: {
      type: String,
      enum: ['theory', 'practical'],
      default: 'theory',
    },
    // Lecture slot number for the day (L1, L2, L3...)
    lectureSlot: {
      type: Number,
      default: 1,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['present', 'absent', 'late'],
          default: 'present',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Allow multiple attendance entries per day per classroom (different subjects/slots)
attendanceSchema.index({ classroomCode: 1, date: 1, subject: 1, lectureSlot: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
