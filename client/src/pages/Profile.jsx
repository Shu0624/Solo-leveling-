import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Save, ShieldCheck, Mail, Building, GraduationCap, MapPin, Hash, Check, AlertCircle, IdCard, QrCode } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user, setUser, api } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    college: user?.college || '',
    department: user?.department || '',
    year: user?.year || '',
    section: user?.section || '',
    classroomCode: user?.classroomCode || '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const submitProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const res = await api.put('/auth/profile', profileData);
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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 relative">
      <div className="flex flex-col gap-8">

        {/* ====== PROFESSIONAL ID CARD ====== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-morphism rounded-3xl overflow-hidden"
        >
          {/* Gradient Banner */}
          <div className="h-28 bg-gradient-to-r from-primary via-primary/80 to-accent relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            <div className="absolute top-4 right-5 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider border border-white/20">
                <IdCard size={12} className="inline mr-1.5 -mt-0.5" />{roleBadge}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="px-6 md:px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
              {/* Avatar */}
              <div className="w-24 h-24 -mt-12 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-primary/30 border-4 border-background relative z-10">
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
                </div>
              </div>

              {/* QR-like visual (decorative) */}
              <div className="hidden md:flex flex-col items-center gap-1 p-3 mt-4 rounded-xl bg-secondary/50 border border-border/30">
                <QrCode size={48} className="text-muted-foreground/40" />
                <span className="text-[9px] font-mono text-muted-foreground font-bold">{displayId}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/30">
              {[
                { label: 'College', value: user?.college || 'N/A', icon: Building },
                { label: 'Department', value: user?.department || 'N/A', icon: GraduationCap },
                { label: 'Year / Section', value: user?.year ? `Year ${user.year}${user.section ? ` - ${user.section}` : ''}` : 'N/A', icon: MapPin },
                { label: 'Classroom', value: user?.classroomCode || 'N/A', icon: Hash },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="p-3 rounded-xl bg-secondary/30 border border-border/30">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Icon size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground truncate">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Account Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal information, classroom assignments, and security preferences.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Profile Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 glass-morphism rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
              <User className="text-primary" size={24} />
              <h2 className="text-xl font-bold text-foreground">Personal Profile</h2>
            </div>

            {profileMessage.text && (
              <div className={cn(
                "p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-medium",
                 profileMessage.type === 'success' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}>
                {profileMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                {profileMessage.text}
              </div>
            )}

            <form onSubmit={submitProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Email (Disabled) */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-secondary/50 text-muted-foreground cursor-not-allowed cursor-pointer focus:outline-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1 px-1">Email cannot be changed.</p>
                </div>
              </div>

              {/* Full Name */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none"
                />
              </div>

              {/* College */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">College / Institution</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    name="college"
                    value={profileData.college}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Department</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    name="department"
                    value={profileData.department}
                    onChange={handleProfileChange}
                    className="w-full bg-background/50 border border-border rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                    placeholder="Enter your department"
                  />
                </div>
              </div>

              {/* Section */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Section</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    name="section"
                    value={profileData.section}
                    onChange={handleProfileChange}
                    className="w-full bg-background/50 border border-border rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                    placeholder="Enter your section"
                  />
                </div>
              </div>

              {/* Year */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Year</label>
                <input
                  type="number"
                  name="year"
                  min="1"
                  max="5"
                  value={profileData.year}
                  onChange={handleProfileChange}
                  className="w-full bg-background/50 border border-border rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                  placeholder="Enter your current year"
                />
              </div>

              {/* Classroom Code */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Classroom Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    name="classroomCode"
                    value={profileData.classroomCode}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none uppercase"
                    placeholder="Enter your classroom code"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-70"
                >
                  {profileLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Save Profile
                </button>
              </div>
            </form>
          </motion.div>

          {/* Security Settings */}
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="glass-morphism rounded-2xl p-6 md:p-8 h-fit"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
              <Lock className="text-primary" size={24} />
              <h2 className="text-xl font-bold text-foreground">Security</h2>
            </div>

            {passwordMessage.text && (
              <div className={cn(
                "p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-medium",
                 passwordMessage.type === 'success' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}>
                {passwordMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={submitPasswordUpdate} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Current Password</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full flex justify-center items-center gap-2 px-6 py-3 mt-2 bg-secondary text-foreground rounded-xl font-bold border border-border/50 hover:bg-secondary/80 transition-colors disabled:opacity-70"
              >
                {passwordLoading ? (
                  <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                ) : (
                  <Lock size={18} />
                )}
                Change Password
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
