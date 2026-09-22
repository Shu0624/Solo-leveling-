import { Link } from 'react-router-dom';
import { BookOpen, FileText, Video, Rocket, Mail } from 'lucide-react';
import { GithubIcon as Github, LinkedinIcon as Linkedin, TwitterIcon as Twitter } from '../ui/SocialIcons';

const Footer = () => {
  return (
    <footer className="mt-20 border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 no-underline">
              <span className="font-display text-lg font-semibold tracking-tight text-foreground">LevelUp</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The elite career preparation platform for engineering students.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[11px] font-medium text-muted-foreground mb-3.5 uppercase tracking-[0.1em]">Product</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/modules', label: 'Learning Hub', icon: <BookOpen size={14} /> },
                { to: '/resume', label: 'Resume Analyzer', icon: <FileText size={14} /> },
                { to: '/interview', label: 'Mock Interview', icon: <Video size={14} /> },
                { to: '/roadmap', label: 'Career Roadmap', icon: <Rocket size={14} /> },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.icon} {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[11px] font-medium text-muted-foreground mb-3.5 uppercase tracking-[0.1em]">Resources</h4>
            <ul className="space-y-2.5">
              {['Documentation', 'API Reference', 'Changelog', 'Support'].map(item => (
                <li key={item}>
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-[11px] font-medium text-muted-foreground mb-3.5 uppercase tracking-[0.1em]">Connect</h4>
            <div className="flex gap-3">
              {[
                { icon: <Github size={18} />, href: '#' },
                { icon: <Linkedin size={18} />, href: '#' },
                { icon: <Twitter size={18} />, href: '#' },
                { icon: <Mail size={18} />, href: '#' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="w-9 h-9 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 flex items-center justify-center transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} LevelUp. Built for elite engineers.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
