/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Eye, ShieldCheck, Mail, Menu, X } from 'lucide-react';

interface NavbarProps {
  onContactClick: () => void;
  onAdminToggle: () => void;
  isAdminOpen: boolean;
  leadCount: number;
  currentView: 'main' | 'blogs';
  onViewChange: (view: 'main' | 'blogs') => void;
}

export default function Navbar({ onContactClick, onAdminToggle, isAdminOpen, leadCount, currentView, onViewChange }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (currentView === 'blogs') {
      setActiveSection('blogs');
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Scroll Spy
      const sections = ['home', 'about', 'services', 'testimonials', 'latest-insights', 'faq', 'contact'];
      const scrollPosition = window.scrollY + 120; // offset

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section === 'latest-insights' ? 'blogs' : section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial call to set correct active section on load/view changes
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (targetId === 'blogs') {
      onViewChange('blogs');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onViewChange('main');
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 80);
    }
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'services', label: 'Services' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'blogs', label: 'Blogs' },
    { id: 'faq', label: 'FAQ' }
  ];

  return (
    <header 
      id="main-header"
      className={`fixed left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'top-4 mx-auto max-w-[92%] md:max-w-[85%] bg-white/95 backdrop-blur-md h-16 rounded-2xl shadow-lg border border-surface-variant/30' 
          : 'top-0 w-full bg-white/80 backdrop-blur-sm h-20 border-b border-surface-variant/20'
      }`}
    >
      <nav className="flex justify-between items-center h-full px-5 md:px-8 max-w-container-max mx-auto">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={() => {
            onViewChange('main');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center cursor-pointer hover:opacity-90 transition-opacity"
        >
          <img 
            src="/logo-full-1.webp" 
            alt="OmniRange Logo" 
            width={220}
            height={56}
            className="h-12 md:h-14 w-auto shrink-0 mix-blend-multiply" 
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Links Navigation (Desktop) */}
        <div className="hidden md:flex items-center gap-1 bg-surface-container/40 p-1 rounded-full border border-surface-variant/20 font-label-md text-xs">
          {navItems.map((item) => (
            <a 
              key={item.id}
              onClick={(e) => handleLinkClick(e, item.id)}
              href={`#${item.id}`}
              className={`transition-all px-4 py-1.5 rounded-full relative ${
                activeSection === item.id 
                  ? 'bg-primary-container text-on-primary-container font-extrabold shadow-sm' 
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/60'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          
          <button 
            onClick={onContactClick}
            className="bg-primary text-white hover:bg-primary-container hover:text-on-primary-container px-5 py-2 rounded-full font-headline text-xs font-bold transition-all shadow-sm active:scale-95"
            id="contact-nav-button"
          >
            Contact Us
          </button>

          {/* Hamburger Menu button (Mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 md:hidden rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </nav>

      {/* Mobile Menu Dropdown Panel */}
      <div 
        className={`md:hidden absolute top-full left-2 right-2 mt-2 bg-white/95 backdrop-blur-md border border-surface-variant/30 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'max-h-[400px] opacity-100 py-4 px-4' : 'max-h-0 opacity-0 pointer-events-none py-0 px-4'
        }`}
      >
        <div className="flex flex-col gap-3.5 text-xs font-semibold">
          {navItems.map((item) => (
            <a 
              key={item.id}
              onClick={(e) => handleLinkClick(e, item.id)}
              href={`#${item.id}`}
              className={`py-1.5 px-3 rounded-lg transition-colors ${
                activeSection === item.id 
                  ? 'bg-primary/10 text-primary font-extrabold' 
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/20'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
