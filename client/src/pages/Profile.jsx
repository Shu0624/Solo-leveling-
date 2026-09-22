import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User, Lock, Save, ShieldCheck, Mail, Building, GraduationCap, MapPin,
  Hash, Check, AlertCircle, IdCard, QrCode, Phone, Globe,
  Briefcase, Code2, Award, Rocket, Plus, X, Sparkles
} from 'lucide-react';
import { LinkedinIcon as Linkedin, GithubIcon as Github } from '../components/ui/SocialIcons';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

const Profile = () => {
  const { user, setUser, api } = useAuth();
  const [activeTab, setActiveTab] = useState('identity');

  const [profileData, setProfileData] = useState({
    // 1. Basic
    name: user?.name || '',
    college: user?.college || '',
    department: user?.department || '',
    year: user?.year || '',
    section: user?.section || '',
    classroomCode: user?.classroomCode || '',
    rollNo: user?.rollNo || '',
    prn: user?.prn || '',
    dob: user?.dob || '',
    gender: user?.gender || '',
    academicYear: user?.academicYear || '2025–2026',

    // 2. Contact
    phone: user?.phone || '',
    personalEmail: user?.personalEmail || '',
    address: user?.address || '',
    parentName: user?.parentName || '',
    parentPhone: user?.parentPhone || '',

    // 3. Academic
    cgpa: user?.cgpa || '',
    sgpa: user?.sgpa || '',
    prevSgpa: user?.prevSgpa || '',
    currentSubjects: (user?.currentSubjects || []).join(', '),
    academicStrengths: (user?.academicStrengths || []).join(', '),
    weakSubjects: (user?.weakSubjects || []).join(', '),

    // 4. Career ⭐
    linkedinUrl: user?.linkedinUrl || '',
    githubUrl: user?.githubUrl || '',
    portfolioUrl: user?.portfolioUrl || '',
    resumeUrl: user?.resumeUrl || '',
    careerInterest: user?.careerInterest || 'Campus Placement / Tech Job',
    preferredDomain: user?.preferredDomain || 'Full-Stack Web',
    skills: user?.skills || [],
    projects: user?.projects || [],
    internships: user?.internships || [],
    certifications: user?.certifications || [],
  });

  const [newSkill, setNewSkill] = useState('');

  // Project modal / temporary inputs
  const [newProject, setNewProject] = useState({ title: '', description: '', techStack: '', githubLink: '', liveLink: '' });
  const [showAddProject, setShowAddProject] = useState(false);

  // Internship temporary inputs
  const [newInternship, setNewInternship] = useState({ company: '', role: '', duration: '', description: '' });
  const [showAddInternship, setShowAddInternship] = useState(false);

  // Certification temporary inputs
  const [newCert, setNewCert] = useState({ name: '', issuer: '', year: '2025', credentialUrl: '' });
  const [showAddCert, setShowAddCert] = useState(false);

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        college: user.college || '',
        department: user.department || '',
        year: user.year || '',
        section: user.section || '',
        classroomCode: user.classroomCode || '',
        rollNo: user.rollNo || '',
        prn: user.prn || '',
        dob: user.dob || '',
        gender: user.gender || '',
        academicYear: user.academicYear || '2025–2026',
        phone: user.phone || '',
        personalEmail: user.personalEmail || '',
        address: user.address || '',
        parentName: user.parentName || '',
        parentPhone: user.parentPhone || '',
        cgpa: user.cgpa || '',
        sgpa: user.sgpa || '',
        prevSgpa: user.prevSgpa || '',
        currentSubjects: (user.currentSubjects || []).join(', '),
        academicStrengths: (user.academicStrengths || []).join(', '),
        weakSubjects: (user.weakSubjects || []).join(', '),
        linkedinUrl: user.linkedinUrl || '',
        githubUrl: user.githubUrl || '',
        portfolioUrl: user.portfolioUrl || '',
        resumeUrl: user.resumeUrl || '',
        careerInterest: user.careerInterest || 'Campus Placement / Tech Job',
        preferredDomain: user.preferredDomain || 'Full-Stack Web',
        skills: user.skills || [],
        projects: user.projects || [],
        internships: user.internships || [],
        certifications: user.certifications || [],
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const addSkillTag = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !profileData.skills.includes(trimmed)) {
      setProfileData({ ...profileData, skills: [...profileData.skills, trimmed] });
      setNewSkill('');
    }
  };

  const removeSkillTag = (skillToRemove) => {
    setProfileData({ ...profileData, skills: profileData.skills.filter((s) => s !== skillToRemove) });
  };

  const handleAddProject = () => {
    if (!newProject.title) return;
    const projectItem = {
      title: newProject.title,
      description: newProject.description,
      techStack: typeof newProject.techStack === 'string' ? newProject.techStack.split(',').map(t => t.trim()).filter(Boolean) : [],
      githubLink: newProject.githubLink,
      liveLink: newProject.liveLink,
    };
    setProfileData({ ...profileData, projects: [...profileData.projects, projectItem] });
    setNewProject({ title: '', description: '', techStack: '', githubLink: '', liveLink: '' });
    setShowAddProject(false);
  };

  const handleAddInternship = () => {
    if (!newInternship.company) return;
    setProfileData({ ...profileData, internships: [...profileData.internships, newInternship] });
    setNewInternship({ company: '', role: '', duration: '', description: '' });
    setShowAddInternship(false);
  };

  const handleAddCert = () => {
    if (!newCert.name) return;
    setProfileData({ ...profileData, certifications: [...profileData.certifications, newCert] });
    setNewCert({ name: '', issuer: '', year: '2025', credentialUrl: '' });
    setShowAddCert(false);
  };

  const submitProfileUpdate = async (e) => {
    if (e) e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const payload = {
        ...profileData,
        year: profileData.year ? Number(profileData.year) : undefined,
        cgpa: profileData.cgpa !== '' ? Number(profileData.cgpa) : undefined,
        sgpa: profileData.sgpa !== '' ? Number(profileData.sgpa) : undefined,
        prevSgpa: profileData.prevSgpa !== '' ? Number(profileData.prevSgpa) : undefined,
        currentSubjects: typeof profileData.currentSubjects === 'string'
          ? profileData.currentSubjects.split(',').map(s => s.trim()).filter(Boolean)
          : profileData.currentSubjects,
        academicStrengths: typeof profileData.academicStrengths === 'string'
          ? profileData.academicStrengths.split(',').map(s => s.trim()).filter(Boolean)
          : profileData.academicStrengths,
        weakSubjects: typeof profileData.weakSubjects === 'string'
          ? profileData.weakSubjects.split(',').map(s => s.trim()).filter(Boolean)
          : profileData.weakSubjects,
      };

      const res = await api.put('/auth/profile', payload);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      setUser(res.data);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setProfileMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const submitPasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      setPasswordLoading(false);
      return;
    }

    try {
      await api.put('/auth/password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const displayId = user?.enrollmentId || user?.employeeId || 'N/A';
  const roleBadge = user?.role === 'student' ? 'Student'
    : user?.role === 'faculty' ? 'Faculty'
    : user?.role === 'hod' ? 'HOD'
    : user?.role === 'principal' ? 'Principal'
    : user?.role === 'placement' ? 'Placement'
    : 'User';

  const tabs = [
    { id: 'identity', label: 'Identity & Basic', icon: User },
    { id: 'contact', label: 'Contact & Guardian', icon: Phone },
    ...(user?.role === 'student' ? [
      { id: 'academic', label: 'Academic Standing', icon: GraduationCap },
      { id: 'career', label: 'Career & Portfolio ⭐', icon: Rocket },
    ] : []),
    { id: 'security', label: 'Security & Password', icon: Lock },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 relative">
      <div className="flex flex-col gap-8">

        {/* ====== PROFESSIONAL ID CARD BANNER ====== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-morphism rounded-md overflow-hidden border border-border/60"
        >
          {/* Gradient Banner */}
          <div className="h-24 bg-elevated border-b border-border relative">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute top-4 right-5 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-secondary backdrop-blur-sm text-foreground text-xs font-bold uppercase tracking-wider border border-border">
                <IdCard size={12} className="inline mr-1.5 -mt-0.5" />{roleBadge}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="px-6 md:px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
              {/* Avatar */}
              <div className="w-24 h-24 -mt-12 shrink-0 rounded-md bg-card border border-border flex items-center justify-center font-display text-foreground text-3xl font-semibold ring-4 ring-background relative z-10">
                {initials}
              </div>

              {/* Name + Details */}
              <div className="flex-1 pt-2 md:pt-3">
                <h1 className="text-2xl font-extrabold text-foreground">{user?.name || 'Unknown'}</h1>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">{user?.email}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
                  <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                    {roleBadge}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-secondary text-foreground text-xs font-bold uppercase tracking-wider border border-border/50 font-mono">
                    ID: {displayId}
                  </span>
                  {user?.classroomCode && (
                    <span className="px-3 py-1 rounded-lg bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider border border-accent/20 font-mono">
                      Class: {user.classroomCode}
                    </span>
                  )}
                  {user?.preferredDomain && (
                    <span className="px-3 py-1 rounded-lg bg-success/10 text-success text-xs font-bold uppercase tracking-wider border border-success/20">{user.preferredDomain}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick QR badge */}
              <div className="hidden md:flex flex-col items-center gap-1 p-3 mt-4 rounded-md bg-secondary/50 border border-border/30">
                <QrCode size={44} className="text-muted-foreground/60" />
                <span className="text-[9px] font-mono text-muted-foreground font-bold">{displayId}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ====== TAB NAVIGATION ====== */}
        <div className="flex border-b border-border gap-2 overflow-x-auto pb-px">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors rounded-t-lg',
                  active
                    ? 'border-primary text-primary bg-primary/5 font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                )}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ====== TAB CONTENTS ====== */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {profileMessage.text && (
            <div className={cn('mb-6 p-4 rounded-md flex items-center gap-3 text-sm border',
              profileMessage.type === 'success' ? 'bg-success/10 border-success/30 text-success' : 'bg-destructive/10 border-destructive/30 text-destructive')}>
              {profileMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
              {profileMessage.text}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 1: IDENTITY & BASIC INFO                                  */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === 'identity' && (
            <div className="glass-morphism rounded-md p-6 sm:p-8 border border-border/60">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <User size={18} className="text-primary" /> Basic Information
              </h2>
              <form onSubmit={submitProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
                    <input
                      type="text" name="name" value={profileData.name} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">College / Institution</label>
                    <input
                      type="text" name="college" value={profileData.college} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</label>
                    <input
                      type="text" name="department" value={profileData.department} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  {user?.role === 'student' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Year</label>
                        <select
                          name="year" value={profileData.year} onChange={handleProfileChange}
                          className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Section / Division</label>
                        <select
                          name="section" value={profileData.section} onChange={handleProfileChange}
                          className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="A">Section A</option>
                          <option value="B">Section B</option>
                          <option value="C">Section C</option>
                          <option value="D">Section D</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">PRN / USN / Roll No</label>
                        <input
                          type="text" name="prn" value={profileData.prn} onChange={handleProfileChange}
                          className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="e.g. 1AP22CS045"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date of Birth</label>
                        <input
                          type="date" name="dob" value={profileData.dob} onChange={handleProfileChange}
                          className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gender</label>
                        <select
                          name="gender" value={profileData.gender} onChange={handleProfileChange}
                          className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Academic Year</label>
                        <input
                          type="text" name="academicYear" value={profileData.academicYear} onChange={handleProfileChange}
                          className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="2025–2026"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit" disabled={profileLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 2: CONTACT & GUARDIAN                                     */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === 'contact' && (
            <div className="glass-morphism rounded-md p-6 sm:p-8 border border-border/60">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Phone size={18} className="text-primary" /> Contact & Guardian Details
              </h2>
              <form onSubmit={submitProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student Mobile Number</label>
                    <input
                      type="tel" name="phone" value={profileData.phone} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Email ID</label>
                    <input
                      type="email" name="personalEmail" value={profileData.personalEmail} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="personal@gmail.com"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Residential Address</label>
                    <textarea
                      rows={2} name="address" value={profileData.address} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      placeholder="Hostel / Local Address, City, State, Pincode"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parent / Guardian Name</label>
                    <input
                      type="text" name="parentName" value={profileData.parentName} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. Mr. Ramesh Sharma"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parent Contact Number</label>
                    <input
                      type="tel" name="parentPhone" value={profileData.parentPhone} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Parent Phone Number"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit" disabled={profileLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 3: ACADEMIC STANDING                                      */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === 'academic' && (
            <div className="glass-morphism rounded-md p-6 sm:p-8 border border-border/60">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <GraduationCap size={18} className="text-primary" /> Academic Information & Performance
              </h2>
              <form onSubmit={submitProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cumulative CGPA</label>
                    <input
                      type="number" step="0.01" min="0" max="10" name="cgpa" value={profileData.cgpa} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. 8.45"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latest SGPA</label>
                    <input
                      type="number" step="0.01" min="0" max="10" name="sgpa" value={profileData.sgpa} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. 8.60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Previous Semester SGPA</label>
                    <input
                      type="number" step="0.01" min="0" max="10" name="prevSgpa" value={profileData.prevSgpa} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. 8.30"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Subjects</label>
                    <input
                      type="text" name="currentSubjects" value={profileData.currentSubjects} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Data Structures, Operating Systems, Computer Networks, AI (comma separated)"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Academic Strengths</label>
                    <input
                      type="text" name="academicStrengths" value={profileData.academicStrengths} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. Algorithms, OOP, Database Design (comma separated)"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weak Subjects / Need Faculty Guidance</label>
                    <input
                      type="text" name="weakSubjects" value={profileData.weakSubjects} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. Theory of Computation, Discrete Mathematics"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit" disabled={profileLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 4: CAREER & PORTFOLIO ⭐                                  */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === 'career' && (
            <div className="glass-morphism rounded-md p-6 sm:p-8 border border-border/60 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Rocket size={18} className="text-accent" /> Career & Mentoring Portfolio ⭐
                </h2>
                <button
                  type="button" onClick={submitProfileUpdate} disabled={profileLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:brightness-110"
                >
                  <Save size={14} /> Save Profile
                </button>
              </div>

              {/* Domain & Interest */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md bg-secondary/30 border border-border/50">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preferred Technology Domain</label>
                  <select
                    name="preferredDomain" value={profileData.preferredDomain} onChange={handleProfileChange}
                    className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Primary Career Interest</label>
                  <select
                    name="careerInterest" value={profileData.careerInterest} onChange={handleProfileChange}
                    className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {CAREER_INTERESTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Social & Portfolio Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">LinkedIn</label>
                  <div className="relative">
                    <Linkedin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="url" name="linkedinUrl" value={profileData.linkedinUrl} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="linkedin.com/in/..."
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GitHub</label>
                  <div className="relative">
                    <Github size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="url" name="githubUrl" value={profileData.githubUrl} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="github.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Portfolio Website</label>
                  <div className="relative">
                    <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="url" name="portfolioUrl" value={profileData.portfolioUrl} onChange={handleProfileChange}
                      className="w-full bg-background/50 border border-border rounded-md py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="space-y-2 p-4 rounded-md bg-secondary/30 border border-border/50">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Technical Skills</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {profileData.skills.map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                      {skill}
                      <button type="button" onClick={() => removeSkillTag(skill)} className="hover:text-destructive transition-colors ml-1">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkillTag(); } }}
                    className="flex-1 bg-background/60 border border-border rounded-md py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Add skill and press Enter"
                  />
                  <button type="button" onClick={addSkillTag} className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-xs font-medium">
                    Add
                  </button>
                </div>
              </div>

              {/* Projects Section */}
              <div className="space-y-3 p-4 rounded-md bg-secondary/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Code2 size={15} className="text-accent" /> Featured Projects ({profileData.projects.length})
                  </h3>
                  <button
                    type="button" onClick={() => setShowAddProject(!showAddProject)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Project
                  </button>
                </div>

                {showAddProject && (
                  <div className="p-3.5 rounded-md bg-background/80 border border-border/70 space-y-2.5">
                    <input
                      type="text" placeholder="Project Title" value={newProject.title}
                      onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-xs"
                    />
                    <input
                      type="text" placeholder="Tech Stack (comma separated)" value={newProject.techStack}
                      onChange={e => setNewProject({ ...newProject, techStack: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-xs"
                    />
                    <input
                      type="text" placeholder="Description" value={newProject.description}
                      onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-xs"
                    />
                    <input
                      type="url" placeholder="GitHub / Live Link" value={newProject.githubLink}
                      onChange={e => setNewProject({ ...newProject, githubLink: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg py-1.5 px-3 text-xs"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setShowAddProject(false)} className="px-3 py-1 text-xs text-muted-foreground">Cancel</button>
                      <button type="button" onClick={handleAddProject} className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Save Project</button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {profileData.projects.map((proj, idx) => (
                    <div key={idx} className="p-3 rounded-md bg-background/50 border border-border/40 flex justify-between items-start gap-3">
                      <div>
                        <p className="text-xs font-bold text-foreground">{proj.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{proj.description}</p>
                        {proj.techStack?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {proj.techStack.map((t, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground font-mono">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setProfileData({ ...profileData, projects: profileData.projects.filter((_, i) => i !== idx) })}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 5: SECURITY & PASSWORD                                    */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <div className="glass-morphism rounded-md p-6 sm:p-8 border border-border/60">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Lock size={18} className="text-primary" /> Password & Security
              </h2>

              {passwordMessage.text && (
                <div className={cn('mb-6 p-4 rounded-md flex items-center gap-3 text-sm border',
                  passwordMessage.type === 'success' ? 'bg-success/10 border-success/30 text-success' : 'bg-destructive/10 border-destructive/30 text-destructive')}>
                  {passwordMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                  {passwordMessage.text}
                </div>
              )}

              <form onSubmit={submitPasswordUpdate} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Password</label>
                  <input
                    type="password" name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange}
                    className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</label>
                  <input
                    type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange}
                    className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required minLength={6}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm New Password</label>
                  <input
                    type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange}
                    className="w-full bg-background/50 border border-border rounded-md py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required minLength={6}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit" disabled={passwordLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    <Lock size={16} /> Update Password
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
};

export default Profile;
