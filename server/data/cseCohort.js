/**
 * ---------------------------------------------------------------------------
 * CSE Department reference cohort
 * ---------------------------------------------------------------------------
 * The department console has to be useful the moment somebody opens it — on a
 * fresh install, on a demo login, or at a college that has not finished
 * importing its own register yet. This module is that starting register.
 *
 * Everything here is generated from a fixed seed, so the same roster comes out
 * on every process. That matters more than it sounds: an Excel export has to be
 * diffable against the export somebody took yesterday, and a roster that
 * reshuffles itself on each cold start makes that impossible.
 *
 * Internal consistency is enforced by construction, not by hand:
 *   attendance.percentage == round(attended / held * 100)
 *   attendance.subjects    sums to the aggregate figures
 *   backlogs.activeCount  == backlogs.subjects.length
 *   iaMarks[].total       == ia1 + ia2
 * ---------------------------------------------------------------------------
 */

export const DEPARTMENT = {
  name: 'Computer Science & Engineering',
  shortName: 'CSE',
  college: 'Apex Institute of Technology',
  university: 'Visvesvaraya Technological University',
  academicYear: '2025-2026',
  term: 'Odd Semester',
  attendanceThreshold: 75,
  placementCgpaCutoff: 7.0,
  meritCgpaCutoff: 9.0,
};

export const MENTORS = [
  'Dr. Ramesh Kulkarni (HOD)',
  'Prof. Anjali Deshpande',
  'Prof. Rajesh Nair',
  'Dr. Meera Iyer',
  'Prof. Vignesh Sundaram',
  'Dr. Kavitha Prabhu',
];

/** Theory papers carrying internal assessment, by year of study. */
export const CURRICULUM = {
  2: {
    semester: 3,
    theory: [
      { code: 'BCS301', subject: 'Mathematics for Computer Science' },
      { code: 'BCS302', subject: 'Digital Design & Computer Organization' },
      { code: 'BCS303', subject: 'Operating Systems' },
      { code: 'BCS304', subject: 'Data Structures & Applications' },
      { code: 'BCS306A', subject: 'Object Oriented Programming with Java' },
    ],
    labs: [
      { code: 'BCSL305', subject: 'Data Structures Laboratory' },
      { code: 'BCSL306A', subject: 'Java Programming Laboratory' },
    ],
  },
  3: {
    semester: 5,
    theory: [
      { code: 'BCS501', subject: 'Software Engineering & Project Management' },
      { code: 'BCS502', subject: 'Computer Networks' },
      { code: 'BCS503', subject: 'Theory of Computation' },
      { code: 'BCS504', subject: 'Design & Analysis of Algorithms' },
      { code: 'BCS515B', subject: 'Artificial Intelligence' },
    ],
    labs: [
      { code: 'BCSL502', subject: 'Computer Networks Laboratory' },
      { code: 'BCSL504', subject: 'Algorithms Laboratory' },
    ],
  },
  4: {
    semester: 7,
    theory: [
      { code: 'BCS701', subject: 'Machine Learning' },
      { code: 'BCS702', subject: 'Cloud Computing & DevOps' },
      { code: 'BCS703', subject: 'Cryptography & Network Security' },
      { code: 'BCS714', subject: 'Big Data Analytics' },
      { code: 'BCS705', subject: 'Major Project Phase II' },
    ],
    labs: [
      { code: 'BCSL701', subject: 'Machine Learning Laboratory' },
      { code: 'BCSL702', subject: 'Cloud & DevOps Laboratory' },
    ],
  },
};

/** Arrears always come from a semester earlier than the student's current one. */
const ARREAR_POOL = [
  'BMATS101 - Mathematics for CSE Stream I',
  'BMATS201 - Mathematics for CSE Stream II',
  'BPHYS102 - Applied Physics for CSE Stream',
  'BESCK104C - Introduction to Electrical Engineering',
  'BCS301 - Mathematics for Computer Science',
  'BCS302 - Digital Design & Computer Organization',
  'BCS403 - Database Management Systems',
  'BCS503 - Theory of Computation',
];

const RECRUITERS = [
  { company: 'Infosys (Systems Engineer)', package: '4.5' },
  { company: 'TCS Digital', package: '7.0' },
  { company: 'Accenture Advanced Technology Centre', package: '6.5' },
  { company: 'Cognizant GenC Next', package: '6.75' },
  { company: 'Zoho Corporation', package: '9.0' },
  { company: 'Bosch Global Software', package: '10.5' },
  { company: 'Juspay Technologies', package: '14.0' },
  { company: 'PhonePe', package: '16.0' },
  { company: 'Oracle Cloud Infrastructure', package: '18.0' },
  { company: 'Amazon (SDE-I)', package: '22.0' },
];

const NAMES = [
  'Aarav Deshmukh', 'Ishita Rane', 'Rohan Bhat', 'Sneha Pillai', 'Kabir Malhotra',
  'Priya Venkatesh', 'Aditya Ranganathan', 'Meghna Choudhury', 'Siddharth Saxena', 'Ananya Hegde',
  'Farhan Akhtar', 'Tanvi Kulkarni', 'Nikhil Gowda', 'Riya Sharma', 'Arjun Menon',
  'Divya Patil', 'Harsh Vardhan', 'Sanjana Reddy', 'Vikram Chauhan', 'Neha Bansal',
  'Aryan Joshi', 'Pooja Kamath', 'Rahul Dwivedi', 'Shreya Mukherjee', 'Zaid Qureshi',
  'Lakshmi Narayan', 'Manish Tiwari', 'Aisha Siddiqui', 'Karthik Subramanian', 'Nandini Rao',
  'Yash Agarwal', 'Bhavana Shetty', 'Imran Shaikh', 'Ritika Sinha', 'Devansh Mehra',
  'Swati Nayak', 'Abhinav Pandey', 'Kritika Jain', 'Sameer Fernandes', 'Deepika Chandran',
  'Varun Kapoor', 'Trisha Banerjee', 'Om Prakash Yadav', 'Simran Kaur', 'Nithin Acharya',
  'Anushka Ghosh', 'Rehan Ali', 'Gayathri Balaji', 'Pranav Kulkarni', 'Mitali Vora',
  'Sarthak Dubey', 'Keerthana Suresh', 'Aman Verma', 'Ruchi Solanki', 'Tejas Bhosale',
  'Nivedita Menon', 'Krishna Kaushik', 'Sara Thomas', 'Ayush Mishra', 'Preeti Chatterjee',
  'Mohit Sengupta', 'Aparna Krishnan', 'Rishabh Goyal', 'Sanya Kapadia',
];

/* -------------------------------------------------------------------------- */
/* Deterministic pseudo-randomness                                            */
/* -------------------------------------------------------------------------- */

const makeRng = (seed) => {
  let state = seed >>> 0;
  return {
    next: () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      let t = (state + 0x6d2b79f5) >>> 0;
      t = Math.imul(t ^ (t >>> 15), 1 | t);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
};

const pick = (rng, list) => list[Math.floor(rng.next() * list.length) % list.length];
const between = (rng, min, max) => min + rng.next() * (max - min);
const intBetween = (rng, min, max) => Math.floor(between(rng, min, max + 1));
const round2 = (n) => Math.round(n * 100) / 100;

const slugEmail = (name, admissionYear) => {
  const parts = name.toLowerCase().replace(/[^a-z ]/g, '').split(/\s+/).filter(Boolean);
  const first = parts[0] || 'student';
  const initial = parts.length > 1 ? parts[parts.length - 1][0] : 'x';
  return `${first}.${initial}${String(admissionYear).slice(-2)}@cse.apex.edu.in`;
};

/**
 * Student archetypes. A real cohort is not a bell curve over one variable —
 * a department has toppers, steady performers, students carrying arrears, and
 * a short tail at genuine risk of detention. This mix is what a CSE HOD would
 * recognise on a Monday morning.
 */
const ARCHETYPES = [
  { key: 'topper', weight: 8, cgpa: [9.0, 9.7], attendance: [88, 96], arrears: 0, resume: [82, 95] },
  { key: 'strong', weight: 26, cgpa: [8.0, 8.9], attendance: [82, 93], arrears: 0, resume: [72, 88] },
  { key: 'steady', weight: 30, cgpa: [7.0, 7.9], attendance: [76, 86], arrears: 0, resume: [60, 78] },
  { key: 'borderline', weight: 16, cgpa: [6.3, 7.2], attendance: [75, 79], arrears: 1, resume: [52, 68] },
  { key: 'arrears', weight: 12, cgpa: [5.6, 6.8], attendance: [70, 78], arrears: 2, resume: [44, 60] },
  { key: 'atRisk', weight: 8, cgpa: [5.0, 6.4], attendance: [58, 74], arrears: 3, resume: [35, 55] },
];

const ARCHETYPE_BAG = ARCHETYPES.flatMap((a) => Array(a.weight).fill(a));

export const attendanceStatus = (pct, threshold = DEPARTMENT.attendanceThreshold) => {
  if (pct < threshold) return 'defaulter';
  if (pct < threshold + 5) return 'caution';
  return 'safe';
};

/** Lectures a student must attend, missing none, to cross the 75% line. */
export const lecturesToRecover = (attended, held, threshold = DEPARTMENT.attendanceThreshold) => {
  if (!held || held <= 0) return 0;
  if ((attended / held) * 100 >= threshold) return 0;
  const t = threshold / 100;
  return Math.max(0, Math.ceil((t * held - attended) / (1 - t)));
};

/** Split an aggregate attendance target across the year's papers and labs. */
const buildAttendanceLedger = (rng, year, targetPct) => {
  const { theory, labs } = CURRICULUM[year];
  const papers = [
    ...theory.map((s) => ({ ...s, kind: 'Theory', held: intBetween(rng, 36, 46) })),
    ...labs.map((s) => ({ ...s, kind: 'Laboratory', held: intBetween(rng, 20, 26) })),
  ];

  // Labs run higher attendance than theory almost everywhere — they are graded.
  const subjects = papers.map((p) => {
    const bias = p.kind === 'Laboratory' ? between(rng, 4, 9) : between(rng, -6, 4);
    const pct = Math.min(100, Math.max(35, targetPct + bias));
    return { ...p, attended: Math.round((pct / 100) * p.held) };
  });

  const held = subjects.reduce((n, s) => n + s.held, 0);

  // Nudge the largest theory paper so the aggregate lands exactly on target.
  const wanted = Math.round((targetPct / 100) * held);
  const drift = wanted - subjects.reduce((n, s) => n + s.attended, 0);
  if (drift !== 0) {
    const anchor = subjects.filter((s) => s.kind === 'Theory').sort((a, b) => b.held - a.held)[0];
    anchor.attended = Math.min(anchor.held, Math.max(0, anchor.attended + drift));
  }

  const attended = subjects.reduce((n, s) => n + s.attended, 0);
  const percentage = Math.round((attended / held) * 100);

  return {
    percentage,
    totalLectures: held,
    attendedLectures: attended,
    status: attendanceStatus(percentage),
    subjects,
  };
};

/** Internal assessment marks that track the student's overall standing. */
const buildIaMarks = (rng, year, cgpa) => {
  const centre = Math.min(48, Math.max(14, (cgpa / 10) * 50 + between(rng, -2, 2)));
  return CURRICULUM[year].theory.map((s) => {
    const ia1 = Math.round(Math.min(25, Math.max(6, centre / 2 + between(rng, -3, 3))));
    const ia2 = Math.round(Math.min(25, Math.max(6, centre / 2 + between(rng, -2.5, 3.5))));
    return { code: s.code, subject: s.subject, ia1, ia2, total: ia1 + ia2, maxMarks: 50 };
  });
};

const buildRemarks = (archetype, student) => {
  const remarks = [];
  const mentor = student.mentorName;

  if (student.attendance.status === 'defaulter') {
    const shortfall = lecturesToRecover(student.attendance.attendedLectures, student.attendance.totalLectures);
    remarks.push({
      date: new Date('2026-01-19'),
      author: mentor,
      category: 'attendance',
      note: `Attendance at ${student.attendance.percentage}% against the 75% requirement. Parent intimation letter dispatched. Needs ${shortfall} consecutive lectures to clear the shortage.`,
    });
  }
  if (student.backlogs.activeCount > 0) {
    remarks.push({
      date: new Date('2026-02-04'),
      author: mentor,
      category: 'academic',
      note: `Carrying ${student.backlogs.activeCount} arrear(s): ${student.backlogs.subjects.join('; ')}. Enrolled in the departmental remedial batch, Saturday 10:00-12:30.`,
    });
  }
  if (archetype.key === 'topper') {
    remarks.push({
      date: new Date('2026-02-11'),
      author: mentor,
      category: 'merit',
      note: 'Consistent department rank holder. Recommended to the semester merit scholarship panel.',
    });
  }
  if (student.placementStatus.status === 'placed') {
    remarks.push({
      date: new Date('2026-02-21'),
      author: 'Placement Cell',
      category: 'placement',
      note: `Offer accepted — ${student.placementStatus.company} at ${student.placementStatus.package} LPA. Removed from the further-placement pool under the one-offer policy.`,
    });
  }
  return remarks;
};

/* -------------------------------------------------------------------------- */
/* Cohort construction                                                        */
/* -------------------------------------------------------------------------- */

export function buildCohort() {
  const rng = makeRng(20260826);
  const students = [];

  // Year 2 is the largest intake; the final year has thinned out slightly.
  const yearSizes = { 2: 22, 3: 21, 4: 21 };
  let nameIndex = 0;

  for (const year of [2, 3, 4]) {
    const admissionYear = 2026 - year;
    const usnBatch = String(admissionYear).slice(-2);

    for (let i = 0; i < yearSizes[year]; i++) {
      const archetype = pick(rng, ARCHETYPE_BAG);
      const name = NAMES[nameIndex % NAMES.length];
      nameIndex += 1;

      const section = ['A', 'B', 'C'][i % 3];
      const serial = i + 1;
      const usn = `1AP${usnBatch}CS${String(serial).padStart(3, '0')}`;

      const cgpa = round2(between(rng, archetype.cgpa[0], archetype.cgpa[1]));
      const sgpa = round2(Math.min(10, Math.max(4.5, cgpa + between(rng, -0.35, 0.5))));
      const targetAttendance = Math.round(between(rng, archetype.attendance[0], archetype.attendance[1]));
      const attendance = buildAttendanceLedger(rng, year, targetAttendance);

      const activeCount = archetype.arrears === 0
        ? 0
        : intBetween(rng, Math.max(1, archetype.arrears - 1), archetype.arrears);

      const arrearSubjects = [];
      let guard = 0;
      while (arrearSubjects.length < activeCount && guard < 40) {
        const candidate = pick(rng, ARREAR_POOL);
        if (!arrearSubjects.includes(candidate)) arrearSubjects.push(candidate);
        guard += 1;
      }

      // Final-year students with a clean record are the ones on offer lists.
      const eligible = cgpa >= DEPARTMENT.placementCgpaCutoff && arrearSubjects.length === 0;
      let placementStatus = { status: eligible ? 'eligible' : 'ineligible', company: '', package: '' };
      if (year === 4 && eligible && rng.next() < 0.62) {
        const tier = RECRUITERS.filter((r) => (cgpa >= 8.5 ? true : Number(r.package) <= 10.5));
        const offer = pick(rng, tier);
        placementStatus = { status: 'placed', company: offer.company, package: offer.package };
      }

      const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
      const domains = ['Full-Stack Web', 'AI/ML', 'Data Science', 'Cloud & DevOps', 'Cybersecurity', 'Mobile App Dev'];
      const interests = ['Job', 'Job', 'Higher Studies', 'Entrepreneurship'];
      const domain = domains[i % domains.length];
      const interest = interests[(i + year) % interests.length];

      const student = {
        _id: `cse-${usn.toLowerCase()}`,
        source: 'reference',
        usn,
        prn: `PRN202${usnBatch}0${String(serial).padStart(3, '0')}`,
        rollNo: `CSE-${usnBatch}-${String(serial).padStart(3, '0')}`,
        name,
        email: slugEmail(name, admissionYear),
        personalEmail: `${cleanName}@gmail.com`,
        phone: `+91 9${intBetween(rng, 100000000, 899999999)}`,
        parentName: `Mr./Mrs. ${name.split(' ').slice(-1)[0]}`,
        parentPhone: `+91 9${intBetween(rng, 100000000, 899999999)}`,
        address: 'Bangalore, Karnataka, India',
        dob: `${2006 - year}-0${(i % 9) + 1}-1${(i % 8) + 1}`,
        gender: i % 2 === 0 ? 'Female' : 'Male',
        academicYear: DEPARTMENT.academicYear,
        department: DEPARTMENT.name,
        college: DEPARTMENT.college,
        year,
        semester: CURRICULUM[year].semester,
        section,
        classroomCode: `CSE-${year}${section}`,
        admissionYear,
        mentorName: MENTORS[(year + i) % MENTORS.length],
        cgpa,
        sgpa,
        prevSgpa: round2(Math.min(10, Math.max(4.5, sgpa + between(rng, -0.4, 0.4)))),
        currentSubjects: CURRICULUM[year].theory.map((t) => t.subject),
        academicStrengths: ['Data Structures', 'Operating Systems', 'System Design'].slice(0, (i % 3) + 1),
        weakSubjects: arrearSubjects.length > 0 ? arrearSubjects : (cgpa < 7.5 ? ['Theory of Computation'] : []),
        attendance,
        backlogs: {
          activeCount: arrearSubjects.length,
          historyCount: arrearSubjects.length > 0 ? intBetween(rng, 0, 2) : intBetween(rng, 0, 1),
          subjects: arrearSubjects,
        },
        iaMarks: buildIaMarks(rng, year, cgpa),
        placementStatus,
        resumeScore: intBetween(rng, archetype.resume[0], archetype.resume[1]),
        // Professional & Career
        linkedinUrl: `https://linkedin.com/in/${cleanName}`,
        githubUrl: `https://github.com/${cleanName}`,
        portfolioUrl: `https://${cleanName}.dev`,
        careerInterest: interest,
        preferredDomain: domain,
        skills: ['JavaScript', 'Python', 'React', 'Data Structures', 'SQL', 'Git'].slice(0, 3 + (i % 4)),
        projects: [
          {
            title: `${domain} Portal & Engine`,
            description: `A production-ready platform featuring modular architecture, API endpoints, and real-time state sync.`,
            techStack: ['React', 'Node.js', 'TailwindCSS'],
            githubLink: `https://github.com/${cleanName}/project`,
            liveLink: `https://${cleanName}-demo.vercel.app`,
          }
        ],
        internships: year >= 3 ? [
          {
            company: 'TechVentures Labs',
            role: `${domain.split(' ')[0]} Engineering Intern`,
            duration: '2 Months',
            description: 'Assisted in building responsive UI components and automating unit test suites.'
          }
        ] : [],
        certifications: [
          {
            name: `${domain} Professional Specialization`,
            issuer: 'Coursera / AWS',
            year: '2025',
            credentialUrl: 'https://coursera.org/verify/demo',
          }
        ],
        mentorRemarks: [],
        updatedAt: new Date('2026-02-24'),
      };

      student.mentorRemarks = buildRemarks(archetype, student);
      students.push(student);
    }
  }

  return students;
}

/** Built once per process — the roster is deterministic, so caching is safe. */
export const CSE_COHORT = buildCohort();

export default CSE_COHORT;
