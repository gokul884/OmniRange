/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { TESTIMONIALS_DATA } from '../types';

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % TESTIMONIALS_DATA.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + TESTIMONIALS_DATA.length) % TESTIMONIALS_DATA.length);
  };

  // Compute active slice depending on window viewport
  // For a seamless desktop feel, we can show 2 items starting from 'index'
  // and wrap around cleanly.
  const activeTestimonials = (() => {
    const first = TESTIMONIALS_DATA[index];
    const second = TESTIMONIALS_DATA[(index + 1) % TESTIMONIALS_DATA.length];
    return [first, second];
  })();

  return (
    <section id="testimonials" className="py-24 bg-surface-container-low overflow-hidden">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          
          {/* Left info & controls */}
          <div className="lg:w-1/3 space-y-6 shrink-0 text-center lg:text-left">
            <h2 className="font-headline font-extrabold text-headline-lg text-on-surface">
              Real Results from Real Partners
            </h2>
            <p className="font-sans text-body-md text-on-surface-variant max-w-sm mx-auto lg:mx-0">
              We measure our success by the growth of our clients. Here is what they have to say about our data-driven growth architectures.
            </p>
            
            {/* Nav Arrows */}
            <div className="hidden lg:flex gap-4 justify-center lg:justify-start pt-2">
              <button
                onClick={handlePrev}
                className="w-12 h-12 rounded-full border border-outline flex items-center justify-center bg-white hover:bg-primary-container hover:border-primary-container hover:text-white transition-all shadow-sm active:scale-90"
                aria-label="Previous Testimonial"
                id="testimonial-prev"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="w-12 h-12 rounded-full border border-outline flex items-center justify-center bg-white hover:bg-primary-container hover:border-primary-container hover:text-white transition-all shadow-sm active:scale-90"
                aria-label="Next Testimonial"
                id="testimonial-next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Pagination Indicators */}
            <div className="flex gap-2 justify-center lg:justify-start pt-1">
              {TESTIMONIALS_DATA.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === index ? 'w-6 bg-primary-container' : 'w-2 bg-outline-variant/60'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

          </div>

          {/* Right Cards List (Sliding/Fade simulation or Loading Skeleton) */}
          <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {isLoading ? (
              [1, 2].map((n, idx) => (
                <div 
                  key={`skeleton-testimonial-${n}`}
                  className={`bg-white p-8 rounded-3xl border border-surface-variant flex flex-col justify-between relative animate-pulse ${
                    idx === 1 ? 'hidden md:flex translate-y-4' : 'flex'
                  }`}
                >
                  <div>
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-neutral-200 rounded-full" />
                      ))}
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="h-3 w-full bg-neutral-200 rounded" />
                      <div className="h-3 w-5/6 bg-neutral-200 rounded" />
                      <div className="h-3 w-4/5 bg-neutral-200 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-t border-surface-variant/40 pt-4 mt-2">
                    <div className="w-12 h-12 rounded-full bg-neutral-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-20 bg-neutral-200 rounded" />
                      <div className="h-2 w-32 bg-neutral-200 rounded" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              activeTestimonials.map((test, idx) => (
                <div 
                  key={`${test.id}-${idx}`}
                  className={`bg-white p-8 rounded-3xl shadow-soft border border-surface-variant flex flex-col justify-between relative transition-all duration-300 transform ${
                    // Subtle visual staggered animations
                    idx === 1 ? 'hidden md:flex translate-y-4' : 'flex'
                  }`}
                >
                  {/* Decorative Quote Icon inside card */}
                  <Quote className="absolute right-6 top-6 w-10 h-10 text-primary-fixed-dim/20" />

                  <div>
                    {/* Rating Stars */}
                    <div className="flex text-primary-container mb-4">
                      {[...Array(test.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary-container text-primary-container" />
                      ))}
                    </div>

                    <p className="font-sans italic text-xs leading-relaxed text-on-surface mb-6 relative z-10">
                      "{test.quote}"
                    </p>
                  </div>

                  {/* Profile header */}
                  <div className="flex items-center gap-4 border-t border-surface-variant/40 pt-4 mt-2">
                    <img 
                      className="w-12 h-12 rounded-full object-cover shadow-sm border border-surface-variant" 
                      alt={test.name}
                      src={test.avatar}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="font-headline font-bold text-xs text-on-surface">
                        {test.name}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        {test.role}, <strong className="text-primary">{test.company}</strong>
                      </p>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

          {/* Mobile Nav Arrows (shown only below lg viewport) */}
          <div className="flex lg:hidden gap-4 justify-center w-full pt-4">
            <button
              onClick={handlePrev}
              className="w-12 h-12 rounded-full border border-outline flex items-center justify-center bg-white hover:bg-primary hover:border-primary hover:text-white transition-all shadow-sm active:scale-90 text-on-surface"
              aria-label="Previous Testimonial"
              id="testimonial-prev-mobile"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="w-12 h-12 rounded-full border border-outline flex items-center justify-center bg-white hover:bg-primary hover:border-primary hover:text-white transition-all shadow-sm active:scale-90 text-on-surface"
              aria-label="Next Testimonial"
              id="testimonial-next-mobile"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
