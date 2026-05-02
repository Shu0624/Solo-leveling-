import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Briefcase, ArrowRight, Loader2, CheckCircle2, Building, BookOpen, GraduationCap } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'student',
    college: '',
    department: '',
    year: '',
    section: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        college: formData.college,
        department: formData.department || undefined,
        year: formData.year ? Number(formData.year) : undefined,
        section: formData.section || undefined,
      };
      await register(payload);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check all fields.');
      setLoading(false);
    }
  };



  return (
    <div className="relative min-h-[calc(100vh-100px)] flex items-center justify-center overflow-hidden py-10">
      {/* Background */}
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] opacity-40 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg mx-4"
      >
        <div className="glass-morphism rounded-2xl p-8 shadow-2xl overflow-hidden relative">
          
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
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 className="text-success mb-4" size={64} />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Welcome Aboard!</h2>
                <p className="text-muted-foreground">Setting up your personalized dashboard...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Create Account</h1>
            <p className="text-muted-foreground text-sm">Join the elite career preparation platform.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Enter your full name" required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Enter your email address" required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="password" name="password" value={formData.password} onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Enter your password" required minLength="6"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground ml-1">Role</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <select
                  name="role" value={formData.role} onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none text-foreground"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="hod">HOD (Head of Department)</option>
                  <option value="principal">Principal</option>
                  <option value="placement">Placement Officer</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground ml-1">Select your role to access the appropriate dashboard and features.</p>
            </div>

            {/* College (always required) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground ml-1">College / Institution</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text" name="college" value={formData.college} onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Enter your college/institution" required
                />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground ml-1">Department</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text" name="department" value={formData.department} onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Enter your department"
                />
              </div>
            </div>

            {/* Year */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground ml-1">Current Year</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <select
                  name="year" value={formData.year} onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none"
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            {/* Section */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground ml-1">Section</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <select
                  name="section" value={formData.section} onChange={handleChange}
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none"
                >
                  <option value="">Select Section</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-medium shadow-lg shadow-primary/25 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>Complete Registration <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border/50 pt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
