import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ActivityProvider } from './context/ActivityContext';
import GlobalTimerWidget from './components/layout/GlobalTimerWidget';
import RouteTracker from './components/layout/RouteTracker';
import ErrorBoundary from './components/ErrorBoundary';

// =====================================================================
// LAZY-LOADED PAGES — Code splitting for performance
// =====================================================================
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const DashboardRouter = lazy(() => import('./pages/DashboardRouter'));
const Modules = lazy(() => import('./pages/Modules'));
const ModuleDetail = lazy(() => import('./pages/ModuleDetail'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const ResumeAnalysis = lazy(() => import('./pages/ResumeAnalysis'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const InterviewLobby = lazy(() => import('./pages/InterviewLobby'));
const InterviewRoom = lazy(() => import('./pages/InterviewRoom'));
const InterviewHistory = lazy(() => import('./pages/InterviewHistory'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const Activities = lazy(() => import('./pages/Activities'));
const Benefits = lazy(() => import('./pages/Benefits'));
const Assessment = lazy(() => import('./pages/Assessment'));
const FacultyDashboard = lazy(() => import('./pages/FacultyDashboard'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const StudentAnalytics = lazy(() => import('./pages/StudentAnalytics'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Profile = lazy(() => import('./pages/Profile'));
const LanguageHub = lazy(() => import('./pages/LanguageHub'));

// Minimal loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent animate-pulse" />
      <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="levelup-ui-theme">
      <AuthProvider>
        <ActivityProvider>
          <BrowserRouter>
            <RouteTracker />
            <ErrorBoundary>
            <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
              <Navbar />
              <GlobalTimerWidget />
            <Suspense fallback={<PageLoader />}>
              <main>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['student', 'faculty', 'hod', 'principal', 'placement']}>
                    <DashboardRouter />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/modules" element={<ProtectedRoute><Modules /></ProtectedRoute>} />
                <Route path="/modules/:slug" element={<ProtectedRoute><ModuleDetail /></ProtectedRoute>} />
                <Route path="/quiz/:quizId" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
                <Route path="/resume" element={<ProtectedRoute><ResumeAnalysis /></ProtectedRoute>} />
                <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
                <Route path="/interview" element={<ProtectedRoute><InterviewLobby /></ProtectedRoute>} />
                <Route path="/interview/history" element={<ProtectedRoute><InterviewHistory /></ProtectedRoute>} />
                <Route path="/interview/:roomId" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
                <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
                <Route path="/language" element={<ProtectedRoute><LanguageHub /></ProtectedRoute>} />
                <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
                <Route path="/benefits" element={<ProtectedRoute><Benefits /></ProtectedRoute>} />
                <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
                <Route path="/my-analytics" element={
                  <ProtectedRoute>
                    <StudentAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['faculty', 'hod', 'principal', 'placement', 'admin']}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute allowedRoles={['faculty', 'hod', 'principal', 'placement', 'admin']}>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </main>
            </Suspense>
            </div>
            </ErrorBoundary>
          </BrowserRouter>
        </ActivityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
