import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a branded Career Readiness Report PDF
 * Produces a comprehensive, downloadable PDF with performance metrics and AI recommendations.
 */
export const generateReadinessReport = (data) => {
  const { user, resumeScore, quizData, interviewData, streakData, activityData } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date();

  // ---- Color Palette ----
  const PRIMARY = [59, 130, 246];     // Blue
  const DARK = [15, 23, 42];          // Slate-900
  const MUTED = [100, 116, 139];      // Slate-500
  const SUCCESS = [16, 185, 129];     // Green
  const WARNING = [245, 158, 11];     // Amber

  // ---- Helper Functions ----
  const getScoreColor = (score) => {
    if (score >= 80) return SUCCESS;
    if (score >= 60) return WARNING;
    return [239, 68, 68]; // Red
  };

  const drawProgressBar = (x, y, width, value, maxValue = 100) => {
    const fillWidth = (value / maxValue) * width;
    const color = getScoreColor(value);
    doc.setFillColor(230, 230, 235);
    doc.roundedRect(x, y, width, 6, 3, 3, 'F');
    doc.setFillColor(...color);
    doc.roundedRect(x, y, Math.max(fillWidth, 6), 6, 3, 3, 'F');
  };

  // =====================================================================
  // PAGE 1: HEADER + OVERVIEW
  // =====================================================================

  // Header band
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('LevelUp', 20, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Career Readiness Report', 20, 32);

  // Date
  doc.setFontSize(9);
  doc.text(`Generated: ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 20, 28, { align: 'right' });

  // Student Info Section
  let y = 55;
  doc.setTextColor(...DARK);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(user?.name || 'Student', 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  const infoLine = [
    user?.college,
    user?.department,
    user?.year ? `Year ${user.year}` : null,
    user?.section ? `Section ${user.section}` : null,
  ].filter(Boolean).join(' • ');
  doc.text(infoLine || 'Student', 20, y);

  // ---- Overall Readiness Score (big circle) ----
  y += 20;
  const overallScore = Math.round(
    ((resumeScore || 0) * 0.3 +
     (quizData?.avgScore || 0) * 0.3 +
     (interviewData?.sessionsCompleted ? Math.min(interviewData.sessionsCompleted * 10, 100) : 0) * 0.2 +
     (Math.min((streakData?.current || 0) * 10, 100)) * 0.2)
  );
  const scoreColor = getScoreColor(overallScore);

  // Score circle
  doc.setDrawColor(...scoreColor);
  doc.setLineWidth(2);
  doc.circle(pageWidth / 2, y + 20, 22);
  doc.setTextColor(...scoreColor);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`${overallScore}`, pageWidth / 2, y + 24, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('/ 100', pageWidth / 2, y + 32, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Readiness Score', pageWidth / 2, y + 48, { align: 'center' });

  const readinessLabel = overallScore >= 80 ? 'Highly Ready' : overallScore >= 60 ? 'On Track' : overallScore >= 40 ? 'Needs Focus' : 'Getting Started';
  doc.setFontSize(10);
  doc.setTextColor(...scoreColor);
  doc.text(readinessLabel, pageWidth / 2, y + 55, { align: 'center' });

  // ---- Dimension Breakdown Table ----
  y += 70;
  doc.setTextColor(...DARK);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Breakdown', 20, y);

  y += 5;
  autoTable(doc, {
    startY: y,
    head: [['Dimension', 'Score', 'Status', 'Weight']],
    body: [
      ['Resume Quality', `${resumeScore || 0}/100`, resumeScore >= 70 ? '✓ Strong' : '⚠ Needs Work', '30%'],
      ['Technical Knowledge', `${quizData?.avgScore || 0}/100`, (quizData?.avgScore || 0) >= 70 ? '✓ Strong' : '⚠ Needs Work', '30%'],
      ['Interview Practice', `${interviewData?.sessionsCompleted || 0} sessions`, (interviewData?.sessionsCompleted || 0) >= 3 ? '✓ Active' : '⚠ Practice More', '20%'],
      ['Consistency (Streak)', `${streakData?.current || 0} days`, (streakData?.current || 0) >= 5 ? '✓ Consistent' : '⚠ Build Habit', '20%'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: PRIMARY,
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: DARK,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'center', cellWidth: 35 },
      2: { cellWidth: 55 },
      3: { halign: 'center', cellWidth: 25 },
    },
    margin: { left: 20, right: 20 },
  });

  // ---- Activity Summary ----
  y = doc.lastAutoTable.finalY + 15;
  doc.setTextColor(...DARK);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Activity Summary', 20, y);

  y += 5;
  const totalStudyHours = activityData?.totalSeconds
    ? Math.round(activityData.totalSeconds / 3600)
    : 0;
  const totalSessions = activityData?.totalSessions || 0;

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total Study Time', `${totalStudyHours} hours`],
      ['Total Sessions Logged', `${totalSessions}`],
      ['Current Streak', `${streakData?.current || 0} days`],
      ['Longest Streak', `${streakData?.longest || 0} days`],
      ['Quizzes Attempted', `${quizData?.totalAttempts || 0}`],
      ['Interview Sessions', `${interviewData?.sessionsCompleted || 0}`],
      ['Latest Resume Score', `${resumeScore || 'Not analyzed'}`],
    ],
    theme: 'striped',
    headStyles: {
      fillColor: DARK,
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: DARK,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'center' },
    },
    margin: { left: 20, right: 20 },
  });

  // ---- AI Recommendations ----
  y = doc.lastAutoTable.finalY + 15;

  // Check if we need a new page
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setTextColor(...PRIMARY);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('🧠 AI-Powered Recommendations', 20, y);

  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);

  const recommendations = [];
  if (!resumeScore || resumeScore < 60) {
    recommendations.push('• Upload and optimize your resume using the AI Resume Analyzer. Target a score of 70+.');
  }
  if ((quizData?.avgScore || 0) < 60) {
    recommendations.push('• Focus on completing technical modules — your quiz average needs improvement.');
  }
  if ((interviewData?.sessionsCompleted || 0) < 5) {
    recommendations.push('• Complete at least 5 AI mock interview sessions to build confidence and fluency.');
  }
  if ((streakData?.current || 0) < 5) {
    recommendations.push('• Build a daily study habit — aim for at least 30 minutes per day to maintain your streak.');
  }
  if (overallScore >= 70) {
    recommendations.push('• You\'re on a strong trajectory! Consider practicing system design and behavioral questions.');
  }
  if (recommendations.length === 0) {
    recommendations.push('• Excellent progress! Keep up the consistency and explore advanced interview topics.');
  }

  recommendations.forEach((rec) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(rec, 25, y, { maxWidth: pageWidth - 50 });
    y += 7;
  });

  // ---- Footer ----
  const addFooter = (pageNum) => {
    doc.setPage(pageNum);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 282, pageWidth, 15, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`LevelUp Career Readiness Report • ${user?.name || 'Student'} • ${now.toLocaleDateString()}`, 20, 289);
    doc.text(`Page ${pageNum}`, pageWidth - 20, 289, { align: 'right' });
  };

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    addFooter(i);
  }

  // ---- Download ----
  const fileName = `LevelUp_Readiness_Report_${(user?.name || 'Student').replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
