/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqData: FAQItem[] = [
    {
      question: "What specific digital marketing services does OmniRange specialize in?",
      answer: "We specialize in full-spectrum performance marketing and search engine optimization. This includes data-driven organic SEO strategies, custom landing page conversion rate optimization (CRO), high-performance paid search (SEM), unified attribution modeling, and enterprise growth analytics."
    },
    {
      question: "How does the 3-Step Strategic Growth Audit work?",
      answer: "When you request an audit via our wizard, our core architects analyze your online footprint. We review your current organic search visibility, identify technical optimization bottlenecks, evaluate competitor landscapes, and cross-reference your direct ad spend budget. This results in a customized, high-density digital blueprint delivered to your email."
    },
    {
      question: "What is your typical client onboarding and sprint timeline?",
      answer: "Our typical onboarding process is completed within 7 to 10 business days. Following database setup and initial tracking configuration, we deploy marketing sprints in monthly cycles. While technical SEM campaigns generate attribution data within weeks, strategic organic SEO growth generally compounding and scaling over 3 to 6 months."
    },
    {
      question: "How do you ensure security and secure data syncing?",
      answer: "Data security is a core pillar of our system. All lead forms and customer requests are synchronized securely with Google Cloud Firestore under strict security rules. Authorized admin personnel must authenticate through Google OAuth to access CRM records, ensuring absolute database isolation and client privacy."
    },
    {
      question: "Can we track attribution and analytics performance in real time?",
      answer: "Absolutely. OmniRange builds unified marketing dashboards mapping full-funnel click-to-close attribution. Our clients gain secure portal access to real-time campaign performance, keyword rankings, conversion triggers, and direct return-on-ad-spend (ROAS) statistics."
    }
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-surface-container-low border-t border-surface-variant/30 relative z-10">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-display font-extrabold text-headline-lg text-on-surface leading-tight tracking-tight">
            Client Growth Answers
          </h2>
          <p className="font-sans text-body-md text-on-surface-variant max-w-xl mx-auto">
            Clear responses regarding our conversion frameworks, onboarding sprint pipelines, and database security.
          </p>
        </div>

        {/* Accordion List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqData.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index}
                id={`faq-item-${index}`}
                className={`bg-white rounded-2xl border transition-all duration-300 ${
                  isOpen 
                    ? 'border-primary shadow-md' 
                    : 'border-surface-variant shadow-soft hover:border-primary-fixed-dim'
                }`}
              >
                {/* Trigger Button */}
                <button
                  onClick={() => handleToggle(index)}
                  className="w-full text-left px-6 py-5 flex justify-between items-center gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className={`font-headline font-bold text-xs sm:text-sm md:text-base tracking-tight transition-colors duration-200 ${
                    isOpen ? 'text-primary' : 'text-on-surface hover:text-primary-container'
                  }`}>
                    {item.question}
                  </span>
                  <div className={`p-1.5 rounded-full transition-all duration-300 ${
                    isOpen ? 'bg-primary/10 text-primary rotate-180' : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  </div>
                </button>

                {/* Animated content body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-xs sm:text-sm font-sans text-on-surface-variant leading-relaxed border-t border-surface-variant/40 pt-4">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
