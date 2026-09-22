import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <div className="relative mb-8">
          <div className="text-[150px] md:text-[200px] font-black text-primary/10 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Search size={40} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3 text-foreground">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 px-5 h-11 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Home size={18} /> Go to Dashboard
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 h-11 rounded-md border border-input bg-card text-foreground font-medium hover:bg-elevated transition-colors"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
