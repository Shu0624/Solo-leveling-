import Assignment from '../models/Assignment.js';
import Attendance from '../models/Attendance.js';
import Announcement from '../models/Announcement.js';
import Form from '../models/Form.js';
import Mark from '../models/Mark.js';
import DSAProgress from '../models/DSAProgress.js';
import User from '../models/User.js';
import XLSX from 'xlsx';
import { getGroqChatCompletion } from '../services/groqService.js';

// @desc    Create an assignment
// @route   POST /api/assessment/assignment
// @access  Private (Faculty/HOD)
export const createAssignment = async (req, res) => {
  try {
    const { classroomCode, subject, title, description, deadline, maxMarks } = req.body;

    const assignment = await Assignment.create({
      classroomCode,
      subject,
      title,
      description,
      deadline,
      maxMarks,
      createdBy: req.user._id,
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
};

// @desc    Get assignments for a specific classroom
// @route   GET /api/assessment/assignment/:code
// @access  Private
export const getClassroomAssignments = async (req, res) => {
  try {
    const { code } = req.params;
    const assignments = await Assignment.find({ classroomCode: code }).sort({ createdAt: -1 });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

// @desc    Submit an assignment (Student)
// @route   POST /api/assessment/assignment/:id/submit
// @access  Private (Student)
export const submitAssignment = async (req, res) => {
  try {
    const { fileUrl, text } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const isLate = new Date() > new Date(assignment.deadline);

    // Check if user already submitted
    const existingSubmissionIndex = assignment.submissions.findIndex(
      (sub) => sub.studentId.toString() === req.user._id.toString()
    );

    if (existingSubmissionIndex !== -1) {
      // Update existing
      assignment.submissions[existingSubmissionIndex].fileUrl = fileUrl || assignment.submissions[existingSubmissionIndex].fileUrl;
      assignment.submissions[existingSubmissionIndex].text = text || assignment.submissions[existingSubmissionIndex].text;
      assignment.submissions[existingSubmissionIndex].submittedAt = Date.now();
      assignment.submissions[existingSubmissionIndex].isLate = isLate;
    } else {
      // Add new
      assignment.submissions.push({
        studentId: req.user._id,
        fileUrl,
        text,
        submittedAt: Date.now(),
        isLate,
      });
    }

    await assignment.save();
    res.status(200).json({ message: 'Assignment submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting assignment', error: error.message });
  }
};

// @desc    Grade an assignment (Faculty)
// @route   PUT /api/assessment/assignment/:id/grade
// @access  Private (Faculty/HOD)
export const gradeAssignment = async (req, res) => {
  try {
    const { studentId, grade, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const subIndex = assignment.submissions.findIndex((sub) => sub.studentId.toString() === studentId);
    if (subIndex === -1) {
      return res.status(404).json({ message: 'Submission not found for this student' });
    }

    assignment.submissions[subIndex].grade = grade;
    assignment.submissions[subIndex].feedback = feedback;

    await assignment.save();
    res.status(200).json({ message: 'Assignment graded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error grading assignment', error: error.message });
  }
};

// @desc    Mark attendance
// @route   POST /api/assessment/attendance
// @access  Private (Faculty/HOD)
export const markAttendance = async (req, res) => {
  try {
    const { classroomCode, date, records, subject, lectureType, lectureSlot } = req.body;

    // Remove the time portion to index by day
    const dayDate = new Date(date);
    dayDate.setHours(0, 0, 0, 0);

    const subj = subject || 'General';
    const slot = lectureSlot || 1;

    let attendance = await Attendance.findOne({
      classroomCode,
      date: dayDate,
      subject: subj,
      lectureSlot: slot,
    });

    if (attendance) {
      // Update records
      attendance.records = records;
      attendance.markedBy = req.user._id;
      attendance.lectureType = lectureType || 'theory';
    } else {
      // Create new
      attendance = await Attendance.create({
        classroomCode,
        date: dayDate,
        subject: subj,
        lectureType: lectureType || 'theory',
        lectureSlot: slot,
        markedBy: req.user._id,
        records,
      });
    }

    await attendance.save();
    res.status(200).json({ message: 'Attendance recorded', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
};

// @desc    Get attendance for a classroom
// @route   GET /api/assessment/attendance/:code
// @access  Private
export const getClassroomAttendance = async (req, res) => {
  try {
    const { code } = req.params;
    const { date, subject, month, year } = req.query;
    
    let filter = { classroomCode: code };
    if (date) {
      const dayDate = new Date(date);
      dayDate.setHours(0, 0, 0, 0);
      filter.date = dayDate;
    }
    if (subject) {
      filter.subject = subject;
    }
    // Monthly filter
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const attendanceRecords = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate('markedBy', 'name email');
    res.status(200).json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
};

// @desc    Get monthly attendance summary with DBATU formula (subject-wise)
// @route   GET /api/assessment/attendance/:code/monthly-summary
// @access  Private
export const getMonthlyAttendanceSummary = async (req, res) => {
  try {
    const { code } = req.params;
    const { month, year, studentId } = req.query;

    const m = Number(month) || (new Date().getMonth() + 1);
    const y = Number(year) || new Date().getFullYear();
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const records = await Attendance.find({
      classroomCode: code,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Collect all unique subjects
    const subjects = [...new Set(records.map(r => r.subject || 'General'))];

    // Build per-subject and overall stats
    const buildStudentStats = (sid) => {
      const subjectStats = {};
      let totalConducted = 0;
      let totalPresent = 0;

      subjects.forEach(subj => {
        const subjectRecords = records.filter(r => (r.subject || 'General') === subj);
        let conducted = 0;
        let present = 0;
        let theoryC = 0, theoryP = 0, practicalC = 0, practicalP = 0;

        subjectRecords.forEach(rec => {
          const studentRec = rec.records.find(r => r.studentId?.toString() === sid);
          if (studentRec) {
            conducted++;
            if (studentRec.status === 'present' || studentRec.status === 'late') {
              present++;
            }
            if (rec.lectureType === 'practical') {
              practicalC++;
              if (studentRec.status === 'present' || studentRec.status === 'late') practicalP++;
            } else {
              theoryC++;
              if (studentRec.status === 'present' || studentRec.status === 'late') theoryP++;
            }
          }
        });

        // DBATU formula: (Present / Conducted) × 100
        const percentage = conducted > 0 ? Math.round((present / conducted) * 100) : 0;

        subjectStats[subj] = {
          conducted,
          present,
          percentage,
          theory: { conducted: theoryC, present: theoryP, percentage: theoryC > 0 ? Math.round((theoryP / theoryC) * 100) : 0 },
          practical: { conducted: practicalC, present: practicalP, percentage: practicalC > 0 ? Math.round((practicalP / practicalC) * 100) : 0 },
          isDefaulter: percentage < 75,
        };

        totalConducted += conducted;
        totalPresent += present;
      });

      return {
        subjects: subjectStats,
        overall: {
          conducted: totalConducted,
          present: totalPresent,
          percentage: totalConducted > 0 ? Math.round((totalPresent / totalConducted) * 100) : 0,
          isDefaulter: totalConducted > 0 ? Math.round((totalPresent / totalConducted) * 100) < 75 : false,
        },
      };
    };

    // If specific student requested
    if (studentId) {
      const stats = buildStudentStats(studentId);
      return res.status(200).json({
        month: m,
        year: y,
        classroomCode: code,
        subjects,
        totalRecords: records.length,
        student: stats,
      });
    }

    // Faculty: get all students
    const allStudentIds = new Set();
    records.forEach(rec => {
      rec.records.forEach(r => {
        if (r.studentId) allStudentIds.add(r.studentId.toString());
      });
    });

    const User = (await import('../models/User.js')).default;
    const studentUsers = await User.find({ _id: { $in: [...allStudentIds] } }).select('name enrollmentId email');

    const allStats = studentUsers.map(u => ({
      studentId: u._id,
      name: u.name,
      enrollmentId: u.enrollmentId || 'N/A',
      email: u.email,
      ...buildStudentStats(u._id.toString()),
    }));

    res.status(200).json({
      month: m,
      year: y,
      classroomCode: code,
      subjects,
      totalRecords: records.length,
      students: allStats,
    });
  } catch (error) {
    console.error('Monthly summary error:', error);
    res.status(500).json({ message: 'Error generating summary', error: error.message });
  }
};


// @desc    Create an announcement
// @route   POST /api/assessment/announcement
// @access  Private (Faculty/HOD/Principal)
export const createAnnouncement = async (req, res) => {
  try {
    const { classroomCodes, title, content, isPinned } = req.body;

    const announcement = await Announcement.create({
      classroomCodes,
      title,
      content,
      isPinned,
      createdBy: req.user._id,
    });

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Error creating announcement', error: error.message });
  }
};

// @desc    Get announcements for a classroom
// @route   GET /api/assessment/announcement/:code
// @access  Private
export const getClassroomAnnouncements = async (req, res) => {
  try {
    const { code } = req.params;
    // Also include announcements targeted globally or to this specific code
    const announcements = await Announcement.find({ 
      classroomCodes: { $in: [code, 'ALL'] } 
    }).sort({ isPinned: -1, createdAt: -1 });
    
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
};

// ====================================================
// FORMS — Google Forms-style Assessment Builder
// ====================================================

// @desc    Create a form
// @route   POST /api/assessment/form
// @access  Private (Faculty)
export const createForm = async (req, res) => {
  try {
    const { title, description, classroomCode, questions, deadline, googleFormUrl } = req.body;

    const form = await Form.create({
      title,
      description,
      classroomCode,
      questions: questions || [],
      deadline,
      googleFormUrl,
      createdBy: req.user._id,
    });

    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ message: 'Error creating form', error: error.message });
  }
};

// @desc    Get forms for a classroom
// @route   GET /api/assessment/form/:code
// @access  Private
export const getClassroomForms = async (req, res) => {
  try {
    const { code } = req.params;
    const forms = await Form.find({ classroomCode: code })
      .select('-responses -importedData')
      .sort({ createdAt: -1 });
    res.status(200).json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching forms', error: error.message });
  }
};

// @desc    Get single form detail (with questions, without full response data for students)
// @route   GET /api/assessment/form/:id/detail
// @access  Private
export const getFormDetail = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });

    const isFaculty = ['faculty', 'hod', 'principal'].includes(req.user.role);

    if (isFaculty) {
      return res.status(200).json(form);
    }

    // Students: hide correct answers and other responses
    const studentForm = {
      _id: form._id,
      title: form.title,
      description: form.description,
      classroomCode: form.classroomCode,
      isActive: form.isActive,
      deadline: form.deadline,
      googleFormUrl: form.googleFormUrl,
      questions: form.questions.map(q => ({
        _id: q._id,
        type: q.type,
        text: q.text,
        required: q.required,
        points: q.points,
        options: q.options?.map(o => ({ text: o.text, _id: o._id })), // hide isCorrect
      })),
      alreadySubmitted: form.responses.some(r => r.studentId.toString() === req.user._id.toString()),
    };

    res.status(200).json(studentForm);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching form', error: error.message });
  }
};

// @desc    Submit a form response (Student)
// @route   POST /api/assessment/form/:id/respond
// @access  Private (Student)
export const submitFormResponse = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    if (!form.isActive) return res.status(400).json({ message: 'This form is no longer accepting responses' });

    // Check for existing submission
    const existing = form.responses.find(r => r.studentId.toString() === req.user._id.toString());
    if (existing) return res.status(400).json({ message: 'You have already submitted this form' });

    const { answers } = req.body;

    // Auto-grade MCQ and checkbox questions
    let totalScore = 0;
    if (answers && answers.length > 0) {
      answers.forEach((ans) => {
        const question = form.questions[ans.questionIndex];
        if (!question) return;

        if (question.type === 'mcq' && question.options?.length > 0) {
          const correct = question.options.findIndex(o => o.isCorrect);
          if (ans.selectedOptions?.includes(correct)) {
            totalScore += question.points || 0;
          }
        } else if (question.type === 'checkbox' && question.options?.length > 0) {
          const correctSet = new Set(question.options.map((o, i) => o.isCorrect ? i : -1).filter(i => i >= 0));
          const selectedSet = new Set(ans.selectedOptions || []);
          if (correctSet.size === selectedSet.size && [...correctSet].every(i => selectedSet.has(i))) {
            totalScore += question.points || 0;
          }
        }
      });
    }

    form.responses.push({
      studentId: req.user._id,
      studentName: req.user.name,
      studentEnrollmentId: req.user.enrollmentId || '',
      answers,
      totalScore,
    });

    await form.save();
    res.status(200).json({ message: 'Response submitted successfully', totalScore });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting response', error: error.message });
  }
};

// @desc    Get form results (Faculty)
// @route   GET /api/assessment/form/:id/results
// @access  Private (Faculty)
export const getFormResults = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });

    res.status(200).json({
      title: form.title,
      questions: form.questions,
      responses: form.responses,
      totalResponses: form.responses.length,
      importedData: form.importedData || [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching results', error: error.message });
  }
};

// @desc    Export form results as Excel
// @route   GET /api/assessment/form/:id/export
// @access  Private (Faculty)
export const exportFormExcel = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });

    // Build spreadsheet data
    const headers = ['Student Name', 'Enrollment ID', 'Submitted At', 'Total Score'];
    form.questions.forEach((q, i) => {
      headers.push(`Q${i + 1}: ${q.text.slice(0, 50)}`);
    });

    const rows = form.responses.map(r => {
      const row = [
        r.studentName || 'Unknown',
        r.studentEnrollmentId || 'N/A',
        r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '',
        r.totalScore || 0,
      ];

      form.questions.forEach((q, i) => {
        const ans = r.answers?.find(a => a.questionIndex === i);
        if (!ans) { row.push(''); return; }

        if (q.type === 'mcq' || q.type === 'checkbox') {
          const selected = (ans.selectedOptions || []).map(idx => q.options?.[idx]?.text || '').join(', ');
          row.push(selected);
        } else {
          row.push(ans.textAnswer || ans.fileUrl || '');
        }
      });

      return row;
    });

    // Add imported CSV data as separate sheet if exists
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Responses');

    if (form.importedData && form.importedData.length > 0) {
      const importedWs = XLSX.utils.json_to_sheet(form.importedData);
      XLSX.utils.book_append_sheet(wb, importedWs, 'Imported Data');
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${form.title.replace(/[^a-zA-Z0-9]/g, '_')}_results.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Error exporting form data', error: error.message });
  }
};

// @desc    Import CSV data into a form (Google Form responses)
// @route   POST /api/assessment/form/:id/import-csv
// @access  Private (Faculty)
export const importFormCSV = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });

    if (!req.file) return res.status(400).json({ message: 'Please upload a CSV file' });

    // Parse the CSV using xlsx (it can read CSV too)
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Append to importedData
    form.importedData = [...(form.importedData || []), ...data];
    await form.save();

    res.status(200).json({ message: `Successfully imported ${data.length} rows`, count: data.length });
  } catch (error) {
    res.status(500).json({ message: 'Error importing CSV', error: error.message });
  }
};

// @desc    Toggle form active status
// @route   PUT /api/assessment/form/:id/toggle
// @access  Private (Faculty)
export const toggleFormActive = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    form.isActive = !form.isActive;
    await form.save();
    res.status(200).json({ message: `Form is now ${form.isActive ? 'active' : 'closed'}`, isActive: form.isActive });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling form', error: error.message });
  }
};

// ====================================================
// MARKS — Academic Marks / Scores Tracking
// ====================================================

// @desc    Add or update marks for a student
// @route   POST /api/assessment/marks
// @access  Private (Faculty/HOD/Principal)
export const addMarks = async (req, res) => {
  try {
    const { entries } = req.body;
    // entries: [{ studentId, classroomCode, subject, examType, marksObtained, maxMarks, semester, academicYear }]

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'Please provide marks entries array' });
    }

    const results = [];
    for (const entry of entries) {
      const { studentId, classroomCode, subject, examType, marksObtained, maxMarks, semester, academicYear } = entry;

      if (!studentId || !classroomCode || !subject || !examType || marksObtained == null || !maxMarks) {
        results.push({ studentId, status: 'skipped', reason: 'Missing required fields' });
        continue;
      }

      // Upsert: update if exists, create if not
      const mark = await Mark.findOneAndUpdate(
        { studentId, classroomCode, subject, examType },
        {
          marksObtained,
          maxMarks,
          semester: semester || undefined,
          academicYear: academicYear || undefined,
          enteredBy: req.user._id,
        },
        { upsert: true, new: true, runValidators: true }
      );
      results.push({ studentId, status: 'saved', mark });
    }

    res.status(200).json({ message: `Processed ${results.length} entries`, results });
  } catch (error) {
    console.error('Add marks error:', error);
    res.status(500).json({ message: 'Error saving marks', error: error.message });
  }
};

// @desc    Get my own scores (student)
// @route   GET /api/assessment/marks/my
// @access  Private
export const getMyScores = async (req, res) => {
  try {
    const marks = await Mark.find({ studentId: req.user._id }).sort({ subject: 1, examType: 1 });

    // Group by subject
    const grouped = {};
    marks.forEach(m => {
      if (!grouped[m.subject]) grouped[m.subject] = {};
      grouped[m.subject][m.examType] = {
        obtained: m.marksObtained,
        max: m.maxMarks,
        percentage: Math.round((m.marksObtained / m.maxMarks) * 100),
      };
    });

    // Calculate overall percentage
    let totalObtained = 0, totalMax = 0;
    marks.forEach(m => { totalObtained += m.marksObtained; totalMax += m.maxMarks; });

    res.status(200).json({
      subjects: grouped,
      raw: marks,
      overall: {
        totalObtained,
        totalMax,
        percentage: totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching scores', error: error.message });
  }
};

// @desc    Get all marks for a classroom (faculty)
// @route   GET /api/assessment/marks/class/:code
// @access  Private (Faculty/HOD/Principal)
export const getClassMarks = async (req, res) => {
  try {
    const { code } = req.params;
    const { subject, examType } = req.query;

    let filter = { classroomCode: code };
    if (subject) filter.subject = subject;
    if (examType) filter.examType = examType;

    const marks = await Mark.find(filter)
      .populate('studentId', 'name enrollmentId email')
      .sort({ subject: 1, examType: 1 });

    // Get unique subjects and exam types for filter dropdowns
    const subjects = [...new Set(marks.map(m => m.subject))];
    const examTypes = [...new Set(marks.map(m => m.examType))];

    res.status(200).json({ marks, subjects, examTypes });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching class marks', error: error.message });
  }
};

// @desc    Get neighborhood leaderboard (±5 around student)
// @route   GET /api/assessment/leaderboard/:code
// @access  Private
export const getLeaderboard = async (req, res) => {
  try {
    const { code } = req.params;
    const { subject } = req.query;

    // Build filter
    let filter = { classroomCode: code };
    if (subject) filter.subject = subject;

    // Get all marks for this classroom
    const allMarks = await Mark.find(filter);

    // Aggregate per student: sum of obtained / sum of max
    const studentScores = {};
    allMarks.forEach(m => {
      const sid = m.studentId.toString();
      if (!studentScores[sid]) studentScores[sid] = { obtained: 0, max: 0 };
      studentScores[sid].obtained += m.marksObtained;
      studentScores[sid].max += m.maxMarks;
    });

    // Calculate percentage and sort
    const ranked = Object.entries(studentScores)
      .map(([studentId, { obtained, max }]) => ({
        studentId,
        obtained,
        max,
        percentage: max > 0 ? Math.round((obtained / max) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Assign ranks
    ranked.forEach((r, i) => { r.rank = i + 1; });

    // Find current user's position
    const myIndex = ranked.findIndex(r => r.studentId === req.user._id.toString());

    // Neighborhood: ±5 around user
    const neighborhoodStart = Math.max(0, myIndex - 5);
    const neighborhoodEnd = Math.min(ranked.length, myIndex + 6);
    const neighborhood = ranked.slice(neighborhoodStart, neighborhoodEnd);

    // Populate names
    const studentIds = neighborhood.map(r => r.studentId);
    const users = await User.find({ _id: { $in: studentIds } }).select('name enrollmentId');
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    // Add names and tier badges
    const getTier = (pct) => {
      if (pct >= 90) return { tier: 'Scholar', emoji: '🌟', color: '#f59e0b' };
      if (pct >= 75) return { tier: 'Achiever', emoji: '⭐', color: '#3b82f6' };
      if (pct >= 60) return { tier: 'Rising Star', emoji: '💫', color: '#8b5cf6' };
      return { tier: 'Learner', emoji: '📚', color: '#6b7280' };
    };

    const leaderboard = neighborhood.map(r => ({
      ...r,
      name: userMap[r.studentId]?.name || 'Student',
      enrollmentId: userMap[r.studentId]?.enrollmentId || '',
      isMe: r.studentId === req.user._id.toString(),
      ...getTier(r.percentage),
    }));

    // Get top 3 for podium
    const top3Slice = ranked.slice(0, 3);
    const top3Users = await User.find({ _id: { $in: top3Slice.map(r => r.studentId) } }).select('name');
    const top3UserMap = {};
    top3Users.forEach(u => { top3UserMap[u._id.toString()] = u.name; });
    const top3 = top3Slice.map(r => ({
      ...r,
      name: top3UserMap[r.studentId] || 'Student',
      ...getTier(r.percentage),
    }));


    // Most improved: compare CT-1 vs CT-2
    let mostImproved = [];
    const ct1Marks = await Mark.find({ classroomCode: code, examType: 'CT-1' });
    const ct2Marks = await Mark.find({ classroomCode: code, examType: 'CT-2' });
    if (ct1Marks.length > 0 && ct2Marks.length > 0) {
      const ct1Map = {};
      ct1Marks.forEach(m => {
        const key = m.studentId.toString();
        if (!ct1Map[key]) ct1Map[key] = { obtained: 0, max: 0 };
        ct1Map[key].obtained += m.marksObtained;
        ct1Map[key].max += m.maxMarks;
      });
      const ct2Map = {};
      ct2Marks.forEach(m => {
        const key = m.studentId.toString();
        if (!ct2Map[key]) ct2Map[key] = { obtained: 0, max: 0 };
        ct2Map[key].obtained += m.marksObtained;
        ct2Map[key].max += m.maxMarks;
      });
      const improvements = Object.keys(ct2Map)
        .filter(sid => ct1Map[sid])
        .map(sid => ({
          studentId: sid,
          ct1Pct: Math.round((ct1Map[sid].obtained / ct1Map[sid].max) * 100),
          ct2Pct: Math.round((ct2Map[sid].obtained / ct2Map[sid].max) * 100),
          improvement: Math.round((ct2Map[sid].obtained / ct2Map[sid].max) * 100) - Math.round((ct1Map[sid].obtained / ct1Map[sid].max) * 100),
        }))
        .sort((a, b) => b.improvement - a.improvement)
        .slice(0, 3);

      const improvedUsers = await User.find({ _id: { $in: improvements.map(i => i.studentId) } }).select('name');
      const improvedMap = {};
      improvedUsers.forEach(u => { improvedMap[u._id.toString()] = u.name; });
      mostImproved = improvements.map(i => ({ ...i, name: improvedMap[i.studentId] || 'Student' }));
    }

    // Available subjects for filter
    const subjects = [...new Set(allMarks.map(m => m.subject))];

    res.status(200).json({
      leaderboard,
      myRank: myIndex >= 0 ? ranked[myIndex] : null,
      totalStudents: ranked.length,
      top3,
      mostImproved,
      subjects,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
};

// ====================================================
// DSA PROGRESS — Coding Practice Tracker
// ====================================================

// @desc    Update my DSA progress
// @route   PUT /api/assessment/dsa
// @access  Private (Student)
export const updateDSAProgress = async (req, res) => {
  try {
    const { easySolved, mediumSolved, hardSolved, platform, profileUrl, showOnLeaderboard } = req.body;

    let progress = await DSAProgress.findOne({ studentId: req.user._id });

    if (progress) {
      // Track weekly log
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);

      const existingWeek = progress.weeklyLog.find(
        w => new Date(w.weekStart).getTime() === weekStart.getTime()
      );

      const weeklyEasy = (easySolved || 0) - (progress.easySolved || 0);
      const weeklyMedium = (mediumSolved || 0) - (progress.mediumSolved || 0);
      const weeklyHard = (hardSolved || 0) - (progress.hardSolved || 0);

      if (existingWeek) {
        existingWeek.easy += Math.max(0, weeklyEasy);
        existingWeek.medium += Math.max(0, weeklyMedium);
        existingWeek.hard += Math.max(0, weeklyHard);
        existingWeek.score = (existingWeek.easy * 1) + (existingWeek.medium * 3) + (existingWeek.hard * 5);
      } else {
        progress.weeklyLog.push({
          weekStart,
          easy: Math.max(0, weeklyEasy),
          medium: Math.max(0, weeklyMedium),
          hard: Math.max(0, weeklyHard),
          score: Math.max(0, weeklyEasy) + Math.max(0, weeklyMedium) * 3 + Math.max(0, weeklyHard) * 5,
        });
      }

      progress.easySolved = easySolved || progress.easySolved;
      progress.mediumSolved = mediumSolved || progress.mediumSolved;
      progress.hardSolved = hardSolved || progress.hardSolved;
      if (platform) progress.platform = platform;
      if (profileUrl !== undefined) progress.profileUrl = profileUrl;
      if (showOnLeaderboard !== undefined) progress.showOnLeaderboard = showOnLeaderboard;
      progress.classroomCode = req.user.classroomCode || progress.classroomCode;

      await progress.save();
    } else {
      progress = await DSAProgress.create({
        studentId: req.user._id,
        classroomCode: req.user.classroomCode || '',
        easySolved: easySolved || 0,
        mediumSolved: mediumSolved || 0,
        hardSolved: hardSolved || 0,
        platform: platform || 'leetcode',
        profileUrl: profileUrl || '',
        showOnLeaderboard: showOnLeaderboard !== false,
      });
    }

    res.status(200).json({ message: 'DSA progress updated', progress });
  } catch (error) {
    res.status(500).json({ message: 'Error updating DSA progress', error: error.message });
  }
};

// @desc    Get DSA leaderboard for a classroom
// @route   GET /api/assessment/dsa/leaderboard/:code
// @access  Private
export const getDSALeaderboard = async (req, res) => {
  try {
    const { code } = req.params;

    const all = await DSAProgress.find({ classroomCode: code, showOnLeaderboard: true })
      .populate('studentId', 'name enrollmentId')
      .sort({ totalScore: -1 });

    const leaderboard = all.map((p, i) => ({
      rank: i + 1,
      studentId: p.studentId?._id || '',
      name: p.studentId?.name || 'Student',
      enrollmentId: p.studentId?.enrollmentId || '',
      easy: p.easySolved,
      medium: p.mediumSolved,
      hard: p.hardSolved,
      totalScore: p.totalScore,
      platform: p.platform,
      profileUrl: p.profileUrl,
      isMe: p.studentId?._id?.toString() === req.user._id.toString(),
    }));

    // Get current user's progress (even if not on leaderboard)
    const myProgress = await DSAProgress.findOne({ studentId: req.user._id });

    res.status(200).json({ leaderboard, myProgress, totalParticipants: leaderboard.length });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching DSA leaderboard', error: error.message });
  }
};

// @desc    Draft AI grading and feedback for a student submission
// @route   POST /api/assessment/assignment/:id/ai-grade
// @access  Private (Faculty/HOD/Principal)
export const aiGradeAssignment = async (req, res) => {
  try {
    const { studentId } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const sub = assignment.submissions.find((s) => s.studentId.toString() === studentId);
    if (!sub) {
      return res.status(404).json({ message: 'Submission not found for this student' });
    }

    // Get student details
    const studentUser = await User.findById(studentId).select('name enrollmentId');

    const prompt = `You are an expert university professor grading a college assignment.
Assignment Title: "${assignment.title}"
Assignment Description:
---
${assignment.description}
---
Maximum Marks: ${assignment.maxMarks}

Student Name: ${studentUser?.name || 'Student'}
Student Submission Content:
---
${sub.text || '(No text submitted. Please evaluate only based on the prompt)'}
---

Your task is to grade the student's submission and provide a constructive, detailed feedback response.
Analyze:
1. Technical correctness and accuracy.
2. Depth of understanding.
3. Completeness of requirements.
4. Suggestions for improvement and further reading.

You MUST respond in valid JSON format only, matching this structure:
{
  "suggestedGrade": <number between 0 and ${assignment.maxMarks}>,
  "feedback": "<markdown formatted detailed feedback review, including strengths, areas of improvement, and specific advice>"
}`;

    const messages = [
      { role: 'system', content: 'You are an elite academic grading engine. Always return valid JSON only.' },
      { role: 'user', content: prompt }
    ];

    const responseText = await getGroqChatCompletion(messages, true, 0.2);
    const result = JSON.parse(responseText);

    res.status(200).json(result);
  } catch (error) {
    console.error('AI grading error:', error);
    res.status(500).json({ message: 'AI grading failed', error: error.message });
  }
};

// @desc    Get AI insights and analytics for Form results
// @route   POST /api/assessment/form/:id/ai-insights
// @access  Private (Faculty/HOD/Principal)
export const aiFormInsights = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });

    // Format questions & responses for AI consumption
    const questionsSummary = form.questions.map((q, idx) => ({
      index: idx,
      text: q.text,
      type: q.type,
      options: q.options?.map(o => ({ text: o.text, isCorrect: o.isCorrect }))
    }));

    const responsesSummary = form.responses.map(r => ({
      studentName: r.studentName,
      totalScore: r.totalScore,
      answers: r.answers?.map(a => ({
        questionIndex: a.questionIndex,
        selectedOptions: a.selectedOptions,
        textAnswer: a.textAnswer
      }))
    }));

    const maxPossible = form.questions.reduce((a, q) => a + (q.points || 0), 0);

    const prompt = `You are a Senior Academic Analytics Specialist at a university.
Analyze the following Google Form-style assessment results to generate high-value, deep academic insights for the teaching faculty.

Assessment Title: "${form.title}"
Description: "${form.description || 'N/A'}"
Total Students Responded: ${form.responses.length}
Max Possible Score: ${maxPossible}

Questions structure:
${JSON.stringify(questionsSummary, null, 2)}

Student Responses:
${JSON.stringify(responsesSummary.slice(0, 50), null, 2)}

Provide a comprehensive, professional, academic analytics report in Markdown format. The report should include:
1. **Executive Summary**: Core metrics, overall distribution of scores, average proficiency level, and passing rates.
2. **Concept Mastery Breakdown**: Analyze which specific questions or concepts the class struggled with the most (e.g. check questions with low correct response rates).
3. **Student Cohort Segmentation**: Group students into categories:
   - High Performers (Top 10-20% who mastered the material).
   - Solid / On Track (Average performers).
   - Critical Intervention Required (Students with very low scores who need immediate 1-on-1 tutoring).
4. **Actionable Curricular Suggestions**: Recommend concrete changes to lectures, assignments, or study guides to address the observed gaps.
5. **Interactive Lesson Practice Prompts**: A set of coding or conceptual quiz prompts that the faculty can write on the board in the next lecture.

Use professional, encouraging, and academically-grounded language.`;

    const messages = [
      { role: 'system', content: 'You are a Senior Academic Analytics Specialist.' },
      { role: 'user', content: prompt }
    ];

    const insights = await getGroqChatCompletion(messages, false, 0.4);
    res.status(200).json({ insights });
  } catch (error) {
    console.error('AI Form insights error:', error);
    res.status(500).json({ message: 'AI insights failed', error: error.message });
  }
};

// @desc    Generate personalized academic study plan/intervention for a student
// @route   POST /api/assessment/intervention
// @access  Private
export const aiStudentIntervention = async (req, res) => {
  try {
    const studentId = req.user.role === 'student' ? req.user._id : req.body.studentId;
    const classroomCode = req.user.role === 'student' ? req.user.classroomCode : req.body.classroomCode;

    if (!studentId || !classroomCode) {
      return res.status(400).json({ message: 'Student ID and Classroom Code are required' });
    }

    const studentUser = await User.findById(studentId).select('name enrollmentId email');
    if (!studentUser) return res.status(404).json({ message: 'Student not found' });

    // Fetch marks
    const marks = await Mark.find({ studentId, classroomCode });

    // Fetch monthly attendance summary
    const attendanceRecords = await Attendance.find({ classroomCode });
    let totalLectures = 0;
    let presentLectures = 0;
    const subjectAttendance = {};

    attendanceRecords.forEach(rec => {
      const studentRec = rec.records.find(r => r.studentId?.toString() === studentId.toString());
      if (studentRec) {
        totalLectures++;
        const isPresent = studentRec.status === 'present' || studentRec.status === 'late';
        if (isPresent) presentLectures++;

        const subj = rec.subject || 'General';
        if (!subjectAttendance[subj]) subjectAttendance[subj] = { conducted: 0, present: 0 };
        subjectAttendance[subj].conducted++;
        if (isPresent) subjectAttendance[subj].present++;
      }
    });

    const attendanceSummary = {
      overallPercentage: totalLectures > 0 ? Math.round((presentLectures / totalLectures) * 100) : 0,
      totalLectures,
      presentLectures,
      subjects: Object.entries(subjectAttendance).map(([subj, stats]) => ({
        subject: subj,
        conducted: stats.conducted,
        present: stats.present,
        percentage: stats.conducted > 0 ? Math.round((stats.present / stats.conducted) * 100) : 0,
      }))
    };

    const prompt = `You are a high-level Academic Counselor and AI Personal Tutor at a university.
Generate a highly personalized Academic Recovery & Study Intervention Plan for a student facing attendance and/or performance challenges.

Student Details:
- Name: ${studentUser.name}
- Enrollment ID: ${studentUser.enrollmentId || 'N/A'}
- Classroom Code: ${classroomCode}

Attendance Record:
- Overall Attendance: ${attendanceSummary.overallPercentage}% (Conducted: ${attendanceSummary.totalLectures}, Attended: ${attendanceSummary.presentLectures})
- Subject-wise Attendance:
${attendanceSummary.subjects.map(s => `  * ${s.subject}: ${s.percentage}% (${s.present}/${s.conducted} lectures)`).join('\n')}

Academic Performance (Marks):
${marks.map(m => `  * ${m.subject} - ${m.examType}: ${m.marksObtained}/${m.maxMarks} (${Math.round((m.marksObtained / m.maxMarks) * 100)}%)`).join('\n')}

Generate a comprehensive recovery plan in Markdown format, with:
1. **Performance Diagnostics**: Identify which subjects need the most urgent attention based on low scores (<60%) or low attendance (<75% - DBATU defaulter threshold).
2. **Attendance Remediation Plan**: Step-by-step guidance on how the student can make up for missed classes (e.g., peer notes, online modules, instructor hours).
3. **Personalized 4-Week Study Schedule**: Structured week-by-week timeline tailored to their weak subjects.
4. **Interactive Coding & Concept Practice Exercises**: Provide 2-3 specific practice questions or mini-projects the student can work on in the LevelUp Code Playground.
5. **Key Resources**: Reference topics and learning paths in the LevelUp Learning Hub they should complete.

Maintain a encouraging, positive, structured, and professional academic tone. Help the student feel motivated to level up!`;

    const messages = [
      { role: 'system', content: 'You are an elite academic tutor and counselor.' },
      { role: 'user', content: prompt }
    ];

    const intervention = await getGroqChatCompletion(messages, false, 0.4);
    res.status(200).json({ intervention });
  } catch (error) {
    console.error('AI intervention error:', error);
    res.status(500).json({ message: 'AI study plan failed to generate', error: error.message });
  }
};
