import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq', 'checkbox', 'short', 'paragraph', 'file'],
    required: true,
  },
  text: { type: String, required: true },
  required: { type: Boolean, default: false },
  points: { type: Number, default: 0 },
  options: [
    {
      text: String,
      isCorrect: { type: Boolean, default: false },
    }
  ],
});

const answerSchema = new mongoose.Schema({
  questionIndex: Number,
  selectedOptions: [Number], // indexes into question.options
  textAnswer: String,
  fileUrl: String,
});

const responseSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: String,
  studentEnrollmentId: String,
  submittedAt: { type: Date, default: Date.now },
  answers: [answerSchema],
  totalScore: { type: Number, default: 0 },
});

const formSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    classroomCode: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    deadline: Date,
    questions: [questionSchema],
    responses: [responseSchema],
    // External Google Form link (optional)
    googleFormUrl: String,
    importedData: [mongoose.Schema.Types.Mixed], // CSV imported rows
  },
  { timestamps: true }
);

formSchema.index({ classroomCode: 1, createdAt: -1 });

export default mongoose.model('Form', formSchema);
