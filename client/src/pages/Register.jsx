import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, Briefcase, ArrowRight, ArrowLeft, CheckCircle2,
  Building, BookOpen, GraduationCap, Phone, MapPin, Hash,
  Globe, Sparkles, Star, Award, Code2, Rocket, Plus, X
} from 'lucide-react';
import { LinkedinIcon as Linkedin, GithubIcon as Github } from '../components/ui/SocialIcons';
import { Button } from '../components/ui';

const DOMAINS = [
  'Full-Stack Web',
  'AI / Machine Learning',
  'Data Science & Analytics',
  'Cloud & DevOps',
  'Cybersecurity',
  'Mobile App Dev (Android/iOS)',
  'Embedded Systems & IoT',
  'Blockchain & Web3'
];

const CAREER_INTERESTS = [
  'Campus Placement / Tech Job',
  'Core Engineering Role',
  'Higher Studies (MS / M.Tech / MBA)',
  'Entrepreneurship / Startup',
  'Government & Civil Services'
];

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic & Account
    name: '',
    email: '',
    password: '',
    role: 'student',
    staffSignupCode: '',
    college: '',
    department: '',
    year: '3',
    section: 'A',
    rollNo: '',
    prn: '',
    dob: '',
    gender: '',
    academicYear: '2025–2026',

    // Step 2: Contact & Guardian
    phone: '',
    personalEmail: '',
    address: '',
    parentName: '',
    parentPhone: '',

    // Step 3: Academic
    cgpa: '',
    prevSgpa: '',
    currentSubjects: '',
    academicStrengths: '',
    weakSubjects: '',

    // Step 4: Professional & Career ⭐
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    careerInterest: 'Campus Placement / Tech Job',
    preferredDomain: 'Full-Stack Web',
    skillsList: ['JavaScript', 'React', 'Node.js', 'Python'],
    newSkillInput: '',

    // Project highlight
    projectTitle: '',
    projectDescription: '',
    projectTech: '',
    projectLink: '',

    // Internship
    internshipCompany: '',
    internshipRole: '',
    internshipDuration: '',

    // Certification
    certName: '',
    certIssuer: '',
    certYear: '2025',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { register, demoLogin } = useAuth();

  const handleDemoStudentContinue = () => {
    const studentUser = demoLogin('student');
    const enriched = {
      ...studentUser,
      name: formData.name?.trim() || studentUser.name,
      college: formData.college?.trim() || studentUser.college,
      department: formData.department?.trim() || studentUser.department,
      skills: formData.skillsList?.length > 0 ? formData.skillsList : studentUser.skills,
      careerInterest: formData.careerInterest || studentUser.careerInterest,
      preferredDomain: formData.preferredDomain || studentUser.preferredDomain,
    };
    localStorage.setItem('levelup_user', JSON.stringify(enriched));
    navigate('/dashboard');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSkill = () => {
    const trimmed = formData.newSkillInput.trim();
    if (trimmed && !formData.skillsList.includes(trimmed)) {
      setFormData({
        ...formData,
        skillsList: [...formData.skillsList, trimmed],
        newSkillInput: '',
      });
    }
  };

  const removeSkill = (skill) => {
    setFormData({
      ...formData,
      skillsList: formData.skillsList.filter((s) => s !== skill),
    });
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.college) {
      setError('Please fill in your Name, Email, Password, and College.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (formData.role !== 'student' && !formData.staffSignupCode.trim()) {
      setError('A staff access code is required for faculty, HOD, principal and placement accounts.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!validateStep1()) return;
      // Non-students can finish registration directly at Step 1
      if (formData.role !== 'student') {
        submitRegistration();
        return;
      }
    }
    setStep((prev) => Math.min(4, prev + 1));
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const submitRegistration = async () => {
    setLoading(true);
    setError('');

    try {
      const isStudent = formData.role === 'student';

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        // Required by the server for any non-student role.
        staffSignupCode: isStudent ? undefined : (formData.staffSignupCode?.trim() || undefined),
        college: formData.college.trim(),
        department: formData.department?.trim() || undefined,
        year: isStudent && formData.year ? Number(formData.year) : undefined,
        section: isStudent && formData.section ? formData.section : undefined,
        // Step 1 additions
        rollNo: formData.rollNo?.trim() || undefined,
        prn: formData.prn?.trim() || undefined,
        dob: formData.dob || undefined,
        gender: formData.gender || undefined,
        academicYear: formData.academicYear || '2025–2026',
        // Step 2
        phone: formData.phone?.trim() || undefined,
        personalEmail: formData.personalEmail?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        parentName: formData.parentName?.trim() || undefined,
        parentPhone: formData.parentPhone?.trim() || undefined,
        // Step 3
        cgpa: formData.cgpa ? Number(formData.cgpa) : undefined,
        prevSgpa: formData.prevSgpa ? Number(formData.prevSgpa) : undefined,
        currentSubjects: formData.currentSubjects ? formData.currentSubjects.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        academicStrengths: formData.academicStrengths ? formData.academicStrengths.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        weakSubjects: formData.weakSubjects ? formData.weakSubjects.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        // Step 4
        linkedinUrl: formData.linkedinUrl?.trim() || undefined,
        githubUrl: formData.githubUrl?.trim() || undefined,
        portfolioUrl: formData.portfolioUrl?.trim() || undefined,
        careerInterest: formData.careerInterest || undefined,
        preferredDomain: formData.preferredDomain || undefined,
        skills: formData.skillsList.length > 0 ? formData.skillsList : undefined,
        projects: formData.projectTitle ? [{
          title: formData.projectTitle.trim(),
          description: formData.projectDescription.trim(),
          techStack: formData.projectTech.split(',').map((t) => t.trim()).filter(Boolean),
          githubLink: formData.projectLink.trim(),
        }] : undefined,
        internships: formData.internshipCompany ? [{
          company: formData.internshipCompany.trim(),
          role: formData.internshipRole.trim(),
          duration: formData.internshipDuration.trim(),
        }] : undefined,
        certifications: formData.certName ? [{
          name: formData.certName.trim(),
          issuer: formData.certIssuer.trim(),
          year: formData.certYear.trim(),
        }] : undefined,
      };

      await register(payload);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please review the form.');
      setLoading(false);
    }
  };

  const stepsMeta = [
    { num: 1, label: 'Identity', icon: User },
    { num: 2, label: 'Contact', icon: Phone },
    { num: 3, label: 'Academic', icon: GraduationCap },
    { num: 4, label: 'Career', icon: Rocket },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* ─── Register Form Container ─── */}
      <div className="flex-1 flex items-center justify-center py-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-2xl"
        >
          <div className="bg-card border border-border rounded-md p-6 sm:p-9 relative overflow-hidden">
            {/* Success Overlay */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                  >
                    <CheckCircle2 className="text-success mb-4" size={64} />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">Welcome to LevelUp!</h2>
                  <p className="text-muted-foreground">Setting up your personalized profile and dashboard...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="text-center mb-6">
              <Link to="/" className="inline-flex items-center gap-2.5 mb-4 no-underline">
                <span className="font-display text-xl font-semibold tracking-tight text-foreground">LevelUp</span>
              </Link>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {formData.role === 'student' ? 'Student Registration & Profile Setup' : 'Create Staff Account'}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                {formData.role === 'student'
                  ? 'Complete your profile so your faculty & mentors can guide your career growth.'
                  : 'Register for faculty, HOD, and administrative access.'}
              </p>
            </div>

            {/* Step Progress Tracker (Only for students) */}
            {formData.role === 'student' && (
              <div className="mb-8">
                <div className="grid grid-cols-4 gap-2">
                  {stepsMeta.map((s) => {
                    const Icon = s.icon;
                    const isDone = step > s.num;
                    const isCurrent = step === s.num;
                    return (
                      <button
                        key={s.num}
                        type="button"
                        onClick={() => {
                          if (step === 1 && !validateStep1()) return;
                          setStep(s.num);
                        }}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-md transition-all text-xs font-medium ${
                          isCurrent
                            ? 'bg-secondary text-foreground border border-input font-semibold'
                            : isDone
                            ? 'text-foreground border border-transparent'
                            : 'text-muted-foreground border border-transparent'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${
                            isCurrent
                              ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                              : isDone
                              ? 'bg-success/20 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isDone ? '✓' : <Icon size={14} />}
                        </div>
                        <span className="truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="w-full bg-secondary/50 h-1 rounded-full mt-3 overflow-hidden">
                  <motion.div
                    className="bg-[hsl(var(--primary-accent))] h-full"
                    initial={{ width: '25%' }}
                    animate={{ width: `${(step / 4) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>{error}</div>
                {formData.role === 'student' && (
                  <button
                    type="button"
                    onClick={handleDemoStudentContinue}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-destructive/20 hover:bg-destructive/30 text-destructive transition-colors inline-flex items-center gap-1.5 w-fit shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Continue as Demo Student
                  </button>
                )}
              </motion.div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); if (step === 4 || formData.role !== 'student') submitRegistration(); else handleNext(); }}>
              
              {/* ───────────────────────────────────────────────────────────── */}
              {/* STEP 1: Basic Information & Account Credentials               */}
              {/* ───────────────────────────────────────────────────────────── */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full bg-card border border-input rounded-md h-9 pl-9 pr-3 text-sm outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                          placeholder="e.g. Aditi Sharma"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        College / Institutional Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full bg-card border border-input rounded-md h-9 pl-9 pr-3 text-sm outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                          placeholder="student@college.edu"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full bg-card border border-input rounded-md h-9 pl-9 pr-3 text-sm outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                          placeholder="Minimum 6 characters"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Role
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="w-full bg-card border border-input rounded-md h-9 pl-9 pr-8 text-sm outline-none transition-colors hover:border-muted-foreground/50 appearance-none text-foreground"
                        >
                          <option value="student">Student (Learner & Mentee)</option>
                          <option value="faculty">Faculty (Teaching & Class Advisor)</option>
                          <option value="hod">HOD (Head of Department)</option>
                          <option value="principal">Principal (Institution Head)</option>
                          <option value="placement">Placement Officer</option>
                        </select>
                      </div>
                    </div>

                    {/* Staff access code — a staff role grants visibility over
                        other students' records, so it has to be proven rather
                        than merely selected from a dropdown. */}
                    {formData.role !== 'student' && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                          Staff Access Code *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                          <input
                            type="password"
                            name="staffSignupCode"
                            value={formData.staffSignupCode}
                            onChange={handleChange}
                            autoComplete="off"
                            className="w-full bg-card border border-input rounded-md h-9 pl-9 pr-3 text-sm outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                            placeholder="Code provided by your department"
                            required
                          />
                        </div>
                        <p className="text-xs text-muted-foreground ml-1">
                          Staff accounts can read student records, so they need a code from your department administrator.
                        </p>
                      </div>
                    )}

                    {/* College */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        College / Institution *
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                          type="text"
                          name="college"
                          value={formData.college}
                          onChange={handleChange}
                          className="w-full bg-card border border-input rounded-md h-9 pl-9 pr-3 text-sm outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                          placeholder="e.g. Apex Institute of Technology"
                          required
                        />
                      </div>
                    </div>

                    {/* Department */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Department
                      </label>
                      <div className="relative">
                        <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className="w-full bg-card border border-input rounded-md h-9 pl-9 pr-3 text-sm outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                          placeholder="e.g. Computer Science & Engineering"
                        />
                      </div>
                    </div>

                    {/* Student Academic Specifics */}
                    {formData.role === 'student' && (
                      <>
                        {/* Year */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                            Current Year
                          </label>
                          <div className="relative">
                            <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <select
                              name="year"
                              value={formData.year}
                              onChange={handleChange}
                              className="w-full bg-card border border-input rounded-md outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground text-sm py-2 pl-9 pr-3 appearance-none"
                            >
                              <option value="1">1st Year (Sem 1–2)</option>
                              <option value="2">2nd Year (Sem 3–4)</option>
                              <option value="3">3rd Year (Sem 5–6)</option>
                              <option value="4">4th Year (Sem 7–8)</option>
                            </select>
                          </div>
                        </div>

                        {/* Section */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                            Class Division / Section
                          </label>
                          <div className="relative">
                            <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <select
                              name="section"
                              value={formData.section}
                              onChange={handleChange}
                              className="w-full bg-card border border-input rounded-md outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground text-sm py-2 pl-9 pr-3 appearance-none"
                            >
                              <option value="A">Section A</option>
                              <option value="B">Section B</option>
                              <option value="C">Section C</option>
                              <option value="D">Section D</option>
                            </select>
                          </div>
                        </div>

                        {/* PRN / Roll Number */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                            PRN / USN / Roll Number
                          </label>
                          <div className="relative">
                            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                              type="text"
                              name="prn"
                              value={formData.prn}
                              onChange={handleChange}
                              className="w-full bg-card border border-input rounded-md outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground text-sm py-2 pl-9 pr-3 font-mono"
                              placeholder="e.g. 1AP22CS045"
                            />
                          </div>
                        </div>

                        {/* Date of Birth & Gender */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            className="w-full bg-card border border-input rounded-md py-2 px-3 text-sm outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                            Gender (Institutional)
                          </label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full bg-card border border-input rounded-md outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground text-sm py-2 px-3 appearance-none"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* STEP 2: Contact Information & Parent / Guardian               */}
              {/* ───────────────────────────────────────────────────────────── */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Student Mobile */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Student Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full bg-card border border-input rounded-md h-9 pl-9 pr-3 text-sm outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>

                    {/* Personal Email */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Personal Alternate Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                          type="email"
                          name="personalEmail"
                          value={formData.personalEmail}
                          onChange={handleChange}
                          className="w-full bg-card border border-input rounded-md h-9 pl-9 pr-3 text-sm outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                          placeholder="personal@gmail.com"
                        />
                      </div>
                    </div>

                    {/* Current Address */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Current Residential Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3 text-muted-foreground" size={16} />
                        <textarea
                          rows={2}
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          className="w-full bg-card border border-input rounded-md outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground text-sm py-2 pl-9 pr-3 resize-none text-foreground"
                          placeholder="Hostel / Local Address, City, State"
                        />
                      </div>
                    </div>

                    {/* Parent Name */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Parent / Guardian Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                          type="text"
                          name="parentName"
                          value={formData.parentName}
                          onChange={handleChange}
                          className="w-full bg-card border border-input rounded-md h-9 pl-9 pr-3 text-sm outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                          placeholder="Mr./Mrs. Sharma"
                        />
                      </div>
                    </div>

                    {/* Parent Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Parent Contact Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                          type="tel"
                          name="parentPhone"
                          value={formData.parentPhone}
                          onChange={handleChange}
                          className="w-full bg-card border border-input rounded-md h-9 pl-9 pr-3 text-sm outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                          placeholder="Parent Phone Number"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* STEP 3: Academic Information                                  */}
              {/* ───────────────────────────────────────────────────────────── */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* CGPA */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Cumulative CGPA (0 - 10)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        name="cgpa"
                        value={formData.cgpa}
                        onChange={handleChange}
                        className="w-full bg-card border border-input rounded-md outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground text-sm py-2 px-3 font-mono"
                        placeholder="e.g. 8.45"
                      />
                    </div>

                    {/* Previous SGPA */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Previous Semester SGPA
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        name="prevSgpa"
                        value={formData.prevSgpa}
                        onChange={handleChange}
                        className="w-full bg-card border border-input rounded-md outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground text-sm py-2 px-3 font-mono"
                        placeholder="e.g. 8.60"
                      />
                    </div>

                    {/* Current Subjects */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Current Enrolled Subjects (Comma separated)
                      </label>
                      <input
                        type="text"
                        name="currentSubjects"
                        value={formData.currentSubjects}
                        onChange={handleChange}
                        className="w-full bg-card border border-input rounded-md py-2 px-3 text-sm outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                        placeholder="Data Structures, Operating Systems, Computer Networks, AI"
                      />
                    </div>

                    {/* Academic Strengths */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Academic Strengths / Strong Subjects
                      </label>
                      <input
                        type="text"
                        name="academicStrengths"
                        value={formData.academicStrengths}
                        onChange={handleChange}
                        className="w-full bg-card border border-input rounded-md py-2 px-3 text-sm outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                        placeholder="e.g. Algorithms, Java OOP, DBMS"
                      />
                    </div>

                    {/* Weak Subjects / Need Help */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Weak Subjects / Require Faculty Assistance
                      </label>
                      <input
                        type="text"
                        name="weakSubjects"
                        value={formData.weakSubjects}
                        onChange={handleChange}
                        className="w-full bg-card border border-input rounded-md py-2 px-3 text-sm outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground"
                        placeholder="e.g. Theory of Computation, Mathematics"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* STEP 4: Professional & Career Information ⭐                   */}
              {/* ───────────────────────────────────────────────────────────── */}
              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  {/* Preferred Domain & Career Interest */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Preferred Technology Domain ⭐
                      </label>
                      <select
                        name="preferredDomain"
                        value={formData.preferredDomain}
                        onChange={handleChange}
                        className="w-full bg-card border border-input rounded-md outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground text-sm py-2 px-3 appearance-none"
                      >
                        {DOMAINS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Primary Career Interest ⭐
                      </label>
                      <select
                        name="careerInterest"
                        value={formData.careerInterest}
                        onChange={handleChange}
                        className="w-full bg-card border border-input rounded-md outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground text-sm py-2 px-3 appearance-none"
                      >
                        {CAREER_INTERESTS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Profile Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        LinkedIn Profile
                      </label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                        <input
                          type="url"
                          name="linkedinUrl"
                          value={formData.linkedinUrl}
                          onChange={handleChange}
                          className="w-full bg-card border border-input rounded-md outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground text-xs py-2 pl-9 pr-3"
                          placeholder="linkedin.com/in/..."
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        GitHub Profile
                      </label>
                      <div className="relative">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                        <input
                          type="url"
                          name="githubUrl"
                          value={formData.githubUrl}
                          onChange={handleChange}
                          className="w-full bg-card border border-input rounded-md outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground text-xs py-2 pl-9 pr-3"
                          placeholder="github.com/..."
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        Portfolio / Website
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                        <input
                          type="url"
                          name="portfolioUrl"
                          value={formData.portfolioUrl}
                          onChange={handleChange}
                          className="w-full bg-card border border-input rounded-md outline-none transition-colors hover:border-muted-foreground/50 placeholder:text-muted-foreground text-xs py-2 pl-9 pr-3"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Skills Cloud */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-secondary/30 border border-border/50">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                      Technical Skills & Tools
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {formData.skillsList.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-transparent text-[hsl(var(--primary-accent))] border border-[hsl(var(--primary-accent))]/35 text-[11px] font-medium"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="hover:text-destructive transition-colors ml-0.5"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="newSkillInput"
                        value={formData.newSkillInput}
                        onChange={handleChange}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                        className="flex-1 bg-background/60 border border-border rounded-md py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Add skill (e.g. Docker, TypeScript, PyTorch) and press Enter"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors"
                      >
                        <Plus size={14} className="inline mr-1" /> Add
                      </button>
                    </div>
                  </div>

                  {/* Project Highlight */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Code2 size={14} className="text-accent" /> Featured Project (Optional)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        name="projectTitle"
                        value={formData.projectTitle}
                        onChange={handleChange}
                        className="bg-background/60 border border-border rounded-md py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Project Title (e.g. AI Tutor Platform)"
                      />
                      <input
                        type="text"
                        name="projectTech"
                        value={formData.projectTech}
                        onChange={handleChange}
                        className="bg-background/60 border border-border rounded-md py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Tech Stack (e.g. React, Python, FastAPI)"
                      />
                      <input
                        type="text"
                        name="projectDescription"
                        value={formData.projectDescription}
                        onChange={handleChange}
                        className="bg-background/60 border border-border rounded-md py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 sm:col-span-2"
                        placeholder="Brief 1-sentence description of the project"
                      />
                      <input
                        type="url"
                        name="projectLink"
                        value={formData.projectLink}
                        onChange={handleChange}
                        className="bg-background/60 border border-border rounded-md py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 sm:col-span-2"
                        placeholder="GitHub / Live Demo URL"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* Form Navigation Controls                                      */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="mt-8 pt-4 border-t border-border/50 flex items-center justify-between gap-3">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={loading}
                    size="sm"
                    className="gap-1.5"
                  >
                    <ArrowLeft size={16} /> Back
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  {formData.role === 'student' && step < 4 && (
                    <button
                      type="button"
                      onClick={submitRegistration}
                      disabled={loading}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                    >
                      Quick Register (Finish later)
                    </button>
                  )}

                  {formData.role === 'student' && step < 4 ? (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleNext}
                      size="md"
                      className="gap-1.5"
                    >
                      Next Step <ArrowRight size={16} />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="primary"
                      loading={loading}
                      disabled={success}
                      size="md"
                      className="rounded-md gap-1.5 shadow-lg shadow-primary/20"
                    >
                      Complete Registration <CheckCircle2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </form>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
