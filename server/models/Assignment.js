import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    classroomCode: {
      type: String,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    attachments: [String], // URLs of attached files
    deadline: {
      type: Date,
      required: true,
    },
    maxMarks: {
      type: Number,
      default: 100,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submissions: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        fileUrl: String,
        text: String,
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        isLate: {
          type: Boolean,
          default: false,
        },
        grade: Number,
        feedback: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Assignments are almost always queried by classroom
assignmentSchema.index({ classroomCode: 1, createdAt: -1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
