/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CompanyLogo from './components/CompanyLogo';
import About from './components/About';
import Services from './components/Services';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Blogs from './components/Blogs';
import ContactForm from './components/ContactForm';
import InteractiveAuditModal from './components/InteractiveAuditModal';
import AnalyticsDashboardModal from './components/AnalyticsDashboardModal';
import AdminPanel from './components/AdminPanel';
import { Lead, AuditRequest, BlogPost, BLOGS_DATA } from './types';
import { Mail, Phone, MapPin, Globe, ShieldCheck, Heart, Clock, ArrowUpRight, Instagram, Facebook, Linkedin, ArrowUp } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, collection, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth, signInWithGoogle, logOut, handleFirestoreError, OperationType } from './firebase';

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [audits, setAudits] = useState<AuditRequest[]>([]);
  const [currentView, setCurrentView] = useState<'main' | 'blogs'>('main');
  const [readingArticle, setReadingArticle] = useState<BlogPost | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Modal toggle states
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Newsletter Subscription state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setNewsletterLoading(true);
    try {
      await handleAddLead({
        name: 'Newsletter Subscriber',
        email: newsletterEmail.trim(),
        service: 'Newsletter',
        message: 'Subscribed to monthly growth insights newsletter.'
      });
      setNewsletterSuccess(true);
      setNewsletterEmail('');
      setTimeout(() => {
        setNewsletterSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Newsletter subscription failed:', err);
    } finally {
      setNewsletterLoading(false);
    }
  };

  // Monitor Scroll position for Back to Top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Professional SEO & GEO Dynamic Meta Tag Generator
  useEffect(() => {
    const updateOrCreateMeta = (nameOrProperty: string, contentValue: string) => {
      const isProperty = nameOrProperty.startsWith('og:') || nameOrProperty.startsWith('fb:');
      const attributeName = isProperty ? 'property' : 'name';
      const selector = `meta[${attributeName}="${nameOrProperty}"]`;
      
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, nameOrProperty);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    const updateCanonical = (url: string) => {
      let element = document.querySelector('link[rel="canonical"]');
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', 'canonical');
        document.head.appendChild(element);
      }
      element.setAttribute('href', url);
    };

    if (readingArticle) {
      // 1. Dynamic metadata when reading a specific blog article
      const postTitle = `${readingArticle.title} | DigiCare`;
      const postDesc = readingArticle.description;
      const postKeywords = readingArticle.metaKeywords 
        ? `${readingArticle.metaKeywords}, ${readingArticle.category}, SEO, GEO, Web Development, DigiCare`
        : `${readingArticle.category}, ${readingArticle.title}, SEO, GEO, Web Development, DigiCare`;
      const postAuthor = readingArticle.author;
      const postImage = readingArticle.image;
      const postUrl = `https://digicares.vercel.app/blog/${readingArticle.id}`;

      document.title = postTitle;
      updateOrCreateMeta('description', postDesc);
      updateOrCreateMeta('keywords', postKeywords);
      updateOrCreateMeta('author', postAuthor);
      updateCanonical(postUrl);

      // Open Graph Tags for Social Media & AI crawlers
      updateOrCreateMeta('og:type', 'article');
      updateOrCreateMeta('og:title', postTitle);
      updateOrCreateMeta('og:description', postDesc);
      updateOrCreateMeta('og:image', postImage);
      updateOrCreateMeta('og:url', postUrl);

      // Twitter Cards
      updateOrCreateMeta('twitter:title', postTitle);
      updateOrCreateMeta('twitter:description', postDesc);
      updateOrCreateMeta('twitter:image', postImage);

    } else if (currentView === 'blogs') {
      // 2. Dynamic metadata for the Blog Listing view
      const blogsTitle = "Growth & Tech Insights Blog | DigiCare";
      const blogsDesc = "Read expert articles, guides, and case studies on modern SEO, Generative Engine Optimization (GEO), custom website development, and content strategy.";
      const blogsKeywords = "blog, digital marketing insights, search engine optimization tips, generative engine optimization, content creation guides, DigiCare";
      const blogsUrl = "https://digicares.vercel.app/blog";
      const blogsImage = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=1200";

      document.title = blogsTitle;
      updateOrCreateMeta('description', blogsDesc);
      updateOrCreateMeta('keywords', blogsKeywords);
      updateOrCreateMeta('author', 'DigiCare');
      updateCanonical(blogsUrl);

      // Open Graph
      updateOrCreateMeta('og:type', 'website');
      updateOrCreateMeta('og:title', blogsTitle);
      updateOrCreateMeta('og:description', blogsDesc);
      updateOrCreateMeta('og:image', blogsImage);
      updateOrCreateMeta('og:url', blogsUrl);

      // Twitter Cards
      updateOrCreateMeta('twitter:title', blogsTitle);
      updateOrCreateMeta('twitter:description', blogsDesc);
      updateOrCreateMeta('twitter:image', blogsImage);

    } else {
      // 3. Reset/Restore main homepage SEO metadata
      const homeTitle = "DigiCare | Best SEO, GEO & Web Performance Agency";
      const homeDesc = "DigiCare is a high-performance digital marketing agency featuring advanced SEO, GEO, PPC, analytics services, client case studies, dynamic testimonial carousels, and an interactive contact manager.";
      const homeKeywords = "SEO, GEO, Generative Engine Optimization, Search Engine Optimization, Website Development, Content Creation, DigiCare, digital marketing, ChatGPT search optimization, Gemini visibility, Perplexity optimization";
      const homeUrl = "https://digicares.vercel.app/";
      const homeImage = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=1200";

      document.title = homeTitle;
      updateOrCreateMeta('description', homeDesc);
      updateOrCreateMeta('keywords', homeKeywords);
      updateOrCreateMeta('author', 'DigiCare');
      updateCanonical(homeUrl);

      // Open Graph
      updateOrCreateMeta('og:type', 'website');
      updateOrCreateMeta('og:title', homeTitle);
      updateOrCreateMeta('og:description', homeDesc);
      updateOrCreateMeta('og:image', homeImage);
      updateOrCreateMeta('og:url', homeUrl);

      // Twitter Cards
      updateOrCreateMeta('twitter:title', homeTitle);
      updateOrCreateMeta('twitter:description', homeDesc);
      updateOrCreateMeta('twitter:image', homeImage);
    }
  }, [currentView, readingArticle]);

  // Monitor Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Sync leads & audits in real-time from Firestore IF admin is signed in
  useEffect(() => {
    const isAdminUser = user?.email === 'krishnan989756@gmail.com' && user?.emailVerified;
    
    if (isAdminUser) {
      const unsubscribeLeads = onSnapshot(collection(db, 'leads'), (snapshot) => {
        const loadedLeads: Lead[] = [];
        snapshot.forEach((doc) => {
          loadedLeads.push(doc.data() as Lead);
        });
        loadedLeads.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return (timeB || 0) - (timeA || 0);
        });
        setLeads(loadedLeads);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'leads');
      });

      const unsubscribeAudits = onSnapshot(collection(db, 'audits'), (snapshot) => {
        const loadedAudits: AuditRequest[] = [];
        snapshot.forEach((doc) => {
          loadedAudits.push(doc.data() as AuditRequest);
        });
        loadedAudits.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return (timeB || 0) - (timeA || 0);
        });
        setAudits(loadedAudits);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'audits');
      });

      return () => {
        unsubscribeLeads();
        unsubscribeAudits();
      };
    } else {
      const savedLeads = localStorage.getItem('growthpulse_leads');
      const savedAudits = localStorage.getItem('growthpulse_audits');
      if (savedLeads) {
        try {
          setLeads(JSON.parse(savedLeads));
        } catch (e) {
          console.error('Failed to parse saved leads', e);
        }
      } else {
        setLeads([]);
      }
      
      if (savedAudits) {
        try {
          setAudits(JSON.parse(savedAudits));
        } catch (e) {
          console.error('Failed to parse saved audits', e);
        }
      } else {
        setAudits([]);
      }
    }
  }, [user]);

  // Lead CRM operations
  const handleAddLead = async (rawLead: Omit<Lead, 'id' | 'timestamp' | 'status'>) => {
    const leadId = `lead-${Date.now()}`;
    const newLead: Lead = {
      ...rawLead,
      id: leadId,
      timestamp: new Date().toLocaleString(),
      status: 'new'
    };
    
    const updated = [newLead, ...leads];
    setLeads(updated);
    localStorage.setItem('growthpulse_leads', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'leads', leadId), newLead);
    } catch (error) {
      console.error("Could not write lead to Firestore:", error);
      handleFirestoreError(error, OperationType.CREATE, `leads/${leadId}`);
    }
  };

  const handleAddAudit = async (rawAudit: Omit<AuditRequest, 'id' | 'timestamp' | 'status'>) => {
    const auditId = `audit-${Date.now()}`;
    const newAudit: AuditRequest = {
      ...rawAudit,
      id: auditId,
      timestamp: new Date().toLocaleString(),
      status: 'pending'
    };
    
    const updated = [newAudit, ...audits];
    setAudits(updated);
    localStorage.setItem('growthpulse_audits', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'audits', auditId), newAudit);
    } catch (error) {
      console.error("Could not write audit request to Firestore:", error);
      handleFirestoreError(error, OperationType.CREATE, `audits/${auditId}`);
    }
  };

  const handleDeleteLead = async (id: string) => {
    const updated = leads.filter((l) => l.id !== id);
    setLeads(updated);
    localStorage.setItem('growthpulse_leads', JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, 'leads', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `leads/${id}`);
    }
  };

  const handleDeleteAudit = async (id: string) => {
    const updated = audits.filter((a) => a.id !== id);
    setAudits(updated);
    localStorage.setItem('growthpulse_audits', JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, 'audits', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `audits/${id}`);
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: 'new' | 'contacted' | 'closed') => {
    const updated = leads.map((l) => l.id === id ? { ...l, status } : l);
    setLeads(updated);
    localStorage.setItem('growthpulse_leads', JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'leads', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${id}`);
    }
  };

  const handleUpdateAuditStatus = async (id: string, status: 'pending' | 'analyzing' | 'completed') => {
    const updated = audits.map((a) => a.id === id ? { ...a, status } : a);
    setAudits(updated);
    localStorage.setItem('growthpulse_audits', JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'audits', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `audits/${id}`);
    }
  };

  const handleContactClick = () => {
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewCaseStudies = () => {
    setReadingArticle(null);
    setCurrentView('blogs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary-container selection:text-white flex flex-col font-sans">
      
      {/* Navigation */}
      <Navbar 
        onContactClick={handleContactClick}
        onAdminToggle={() => setIsAdminOpen(!isAdminOpen)}
        isAdminOpen={isAdminOpen}
        leadCount={leads.length + audits.length}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Main Content Layout */}
      <main className="flex-1">
        
        {currentView === 'blogs' ? (
          <div className="pt-28 pb-12 bg-background relative overflow-hidden">
            {/* Background Decorative Gradient Radial blur */}
            <div className="absolute top-12 right-0 w-80 h-80 bg-primary-fixed-dim/10 rounded-full blur-3xl pointer-events-none z-0" />
            <div className="absolute bottom-0 left-12 w-64 h-64 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none z-0" />
            
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center space-y-4 relative z-10">
              <h1 className="font-display font-extrabold text-display-lg-mobile md:text-headline-lg text-on-surface leading-tight tracking-tight max-w-2xl mx-auto">
                Digicare Growth Hub
              </h1>
              <p className="font-sans text-body-md text-on-surface-variant max-w-xl mx-auto">
                Discover the latest strategy breakdowns, technical performance studies, and creative branding models from our master consultants.
              </p>
            </div>
          </div>
        ) : null}

        {currentView === 'main' ? (
          <>
            {/* Hero Segment */}
            <Hero 
              onGetStartedClick={handleContactClick} 
              onViewCaseStudiesClick={handleViewCaseStudies} 
            />

            {/* Brand partners horizontal ticket band (Marquee Ticker) */}
            <div className="bg-[#1877F2] py-6 border-y border-[#1877F2]/10 overflow-hidden relative z-10">
              <div className="animate-marquee flex items-center gap-12 text-white font-headline font-bold text-xs md:text-sm tracking-widest uppercase">
                {/* First Set of Words */}
                <span className="shrink-0 flex items-center gap-4">Search Engine Optimization <span className="text-[#E7F3FF] text-lg font-black">•</span></span>
                <span className="shrink-0 flex items-center gap-4">Website Development <span className="text-[#E7F3FF] text-lg font-black">•</span></span>
                <span className="shrink-0 flex items-center gap-4">Generative Engine Optimization <span className="text-[#E7F3FF] text-lg font-black">•</span></span>
                <span className="shrink-0 flex items-center gap-4">Content Creation <span className="text-[#E7F3FF] text-lg font-black">•</span></span>
                <span className="shrink-0 flex items-center gap-4">Poster Creation <span className="text-[#E7F3FF] text-lg font-black">•</span></span>
                
                {/* Second Set of Words for infinite seamless transition */}
                <span className="shrink-0 flex items-center gap-4">Search Engine Optimization <span className="text-[#E7F3FF] text-lg font-black">•</span></span>
                <span className="shrink-0 flex items-center gap-4">Website Development <span className="text-[#E7F3FF] text-lg font-black">•</span></span>
                <span className="shrink-0 flex items-center gap-4">Generative Engine Optimization <span className="text-[#E7F3FF] text-lg font-black">•</span></span>
                <span className="shrink-0 flex items-center gap-4">Content Creation <span className="text-[#E7F3FF] text-lg font-black">•</span></span>
                <span className="shrink-0 flex items-center gap-4">Poster Creation <span className="text-[#E7F3FF] text-lg font-black">•</span></span>
              </div>
            </div>

            {/* Our Mission / About Section */}
            <About />

            {/* Precision Services Bento Grid */}
            <Services 
              onOpenAnalyticsDemo={() => setIsAnalyticsOpen(true)} 
              onGetStartedClick={() => setIsAuditOpen(true)}
            />

            {/* Client Testimonials Slider */}
            <Testimonials />

            {/* Latest Insights Section */}
            <section id="latest-insights" className="py-20 bg-background relative z-10 border-t border-surface-variant/30">
              <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                  <div className="space-y-3">
                    <h2 className="font-display font-extrabold text-headline-lg text-on-surface leading-tight tracking-tight">
                      Explore Our Growth Knowledge
                    </h2>
                    <p className="font-sans text-body-md text-on-surface-variant max-w-xl">
                      Actionable strategy, SEO blueprints, and user experience lessons curated by our core architects.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setReadingArticle(null);
                      setCurrentView('blogs');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:opacity-80 transition-all border-b border-primary/30 pb-0.5"
                  >
                    View All Articles <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {BLOGS_DATA.slice(0, 3).map((post) => (
                    <article 
                      key={post.id}
                      onClick={() => {
                        setReadingArticle(post);
                        setCurrentView('blogs');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group cursor-pointer bg-white p-5 rounded-3xl border border-surface-variant shadow-soft hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        {/* Card Image banner */}
                        <div className="rounded-2xl overflow-hidden aspect-[16/10] border border-surface-variant/40 shadow-sm relative">
                          <img 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            alt={post.title}
                            src={post.image}
                          />
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-primary shadow-sm">
                            {post.category}
                          </div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-3 pt-4">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                            <span>{post.date}</span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-primary" /> {post.readTime}
                            </span>
                          </div>

                          <h3 className="font-headline font-bold text-headline-sm text-on-surface leading-tight group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          
                          <p className="font-sans text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                            {post.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-surface-variant/30 mt-2">
                        <div className="flex items-center gap-2">
                          <img className="w-6 h-6 rounded-full object-cover" src={post.authorAvatar} alt={post.author} />
                          <span className="text-[10px] text-on-surface font-semibold">{post.author}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-primary group-hover:translate-x-1 transition-transform">
                          Read Article <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* Frequently Asked Questions */}
            <FAQ />

            {/* Dark Lead Capture Form / Onboarding Call reservation */}
            <ContactForm onAddLead={handleAddLead} />
          </>
        ) : (
          <div className="-mt-12">
            <Blogs readingArticle={readingArticle} onSelectArticle={setReadingArticle} />
          </div>
        )}

      </main>

      {/* Professional Footer */}
      <footer className="bg-on-secondary-fixed text-white border-t border-white/10 pt-16 pb-8 shrink-0">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            
            {/* Branding & Mission details */}
            <div className="space-y-4 col-span-1 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <CompanyLogo className="w-8 h-8 shrink-0" />
                <div className="flex flex-col items-start -space-y-1">
                  <span className="font-headline font-extrabold text-lg md:text-xl tracking-tight bg-gradient-to-r from-[#0052FF] to-[#FF3D00] bg-clip-text text-transparent uppercase">
                    DIGICARE
                  </span>
                  <span className="text-[7px] md:text-[8px] uppercase tracking-widest text-white/50 font-bold">
                    — Affordable Digital Solutions —
                  </span>
                </div>
              </div>
              <p className="text-xs text-secondary-fixed opacity-70 leading-relaxed max-w-sm">
                Engineering high-performance organic SEO rankings, attribution mapping, and enterprise-grade conversion architectures for forward-thinking brands globally.
              </p>
              
              {/* Social Media Share / Follow Icons */}
              <div className="flex items-center gap-3 pt-2">
                <a 
                  href="https://www.instagram.com/digi_cares?igsh=MXN5YzN1b2tsOTRzZQ==" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-primary-container transition-all text-secondary-fixed text-white cursor-pointer"
                  title="Follow us on Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a 
                  href="https://www.facebook.com/share/1LjtyBfiDg/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-primary-container transition-all text-secondary-fixed text-white cursor-pointer"
                  title="Follow us on Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-primary-container transition-all text-secondary-fixed text-white cursor-pointer"
                  title="Connect with us on LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3 text-xs col-span-1 md:col-span-1">
              <p className="font-headline font-bold text-xs uppercase tracking-wider text-white">
                Company
              </p>
              <ul className="space-y-2 text-secondary-fixed opacity-70">
                <li>
                  <button 
                    onClick={() => {
                      setCurrentView('main');
                      setTimeout(() => {
                        const el = document.getElementById('about');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 80);
                    }} 
                    className="hover:text-primary-container transition-colors text-left font-sans text-xs text-secondary-fixed opacity-70"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setCurrentView('main');
                      setTimeout(() => {
                        const el = document.getElementById('services');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 80);
                    }} 
                    className="hover:text-primary-container transition-colors text-left font-sans text-xs text-secondary-fixed opacity-70"
                  >
                    Services
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setCurrentView('main');
                      setTimeout(() => {
                        const el = document.getElementById('testimonials');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 80);
                    }} 
                    className="hover:text-primary-container transition-colors text-left font-sans text-xs text-secondary-fixed opacity-70"
                  >
                    Testimonials
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setReadingArticle(null);
                      setCurrentView('blogs');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    className="hover:text-primary-container transition-colors text-left font-sans text-xs text-secondary-fixed opacity-70"
                  >
                    Latest Insights
                  </button>
                </li>
              </ul>
            </div>

            {/* Newsletter Signup */}
            <div className="space-y-3 text-xs col-span-1 md:col-span-1">
              <p className="font-headline font-bold text-xs uppercase tracking-wider text-white">
                Newsletter
              </p>
              <p className="text-secondary-fixed opacity-70 leading-relaxed">
                Get monthly growth insights, SEO strategies & web performance tips.
              </p>
              {newsletterSuccess ? (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-green-400" />
                  <span>Subscribed!</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-2 mt-2">
                  <div className="relative">
                    <input 
                      type="email" 
                      required
                      placeholder="Your email address" 
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/35 text-xs focus:outline-none focus:ring-1 focus:ring-[#1877F2] focus:border-transparent transition-all"
                      id="newsletter-email"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={newsletterLoading}
                    className="w-full px-3 py-2 rounded-xl bg-white text-on-secondary-fixed hover:bg-gray-100 transition-all font-bold text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
                    id="newsletter-submit-btn"
                  >
                    {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Bottom Bar copyright */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-secondary-fixed opacity-60">
            <p>
              &copy; {new Date().getFullYear()} Digicare , All Rights Reserved
            </p>
            <p className="flex items-center gap-1">
              Crafted for Growth with <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            </p>
          </div>

        </div>
      </footer>

      {/* 3-Step Growth Strategy Lead Wizard Modal */}
      <InteractiveAuditModal 
        isOpen={isAuditOpen} 
        onClose={() => setIsAuditOpen(false)} 
        onSubmit={(req) => {
          handleAddAudit(req);
          // Auto-trigger Lead DB sliding panel open so the reviewer can see the audit response is recorded immediately!
          setIsAdminOpen(true);
        }}
      />

      {/* Advanced BI Attribution Analytics Dashboard Simulator Modal */}
      <AnalyticsDashboardModal 
        isOpen={isAnalyticsOpen} 
        onClose={() => setIsAnalyticsOpen(false)} 
      />

      {/* CRM Database sliding drawer */}
      <AdminPanel 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        leads={leads}
        audits={audits}
        onDeleteLead={handleDeleteLead}
        onDeleteAudit={handleDeleteAudit}
        onUpdateLeadStatus={handleUpdateLeadStatus}
        onUpdateAuditStatus={handleUpdateAuditStatus}
        user={user}
        onSignIn={signInWithGoogle}
        onSignOut={logOut}
      />

      {/* Floating Back to Top button with high-end smooth scrolling and hover interaction */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-3.5 rounded-full bg-[#1877F2] hover:bg-[#0e5fc2] text-white shadow-xl shadow-black/15 hover:shadow-black/25 active:scale-95 hover:scale-105 transition-all duration-300 z-50 flex items-center justify-center cursor-pointer group border border-white/10"
          aria-label="Back to top"
          id="back-to-top"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-200" />
        </button>
      )}

    </div>
  );
}
