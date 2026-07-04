import React from 'react';

interface CompanyLogoProps {
  className?: string;
  variant?: 'symbol' | 'full' | 'text';
  theme?: 'light' | 'dark';
}

export default function CompanyLogo({ 
  className = 'h-8 w-auto shrink-0',
  variant = 'symbol',
  theme = 'light'
}: CompanyLogoProps) {
  
  // Choose the appropriate blend mode to make solid black or white backgrounds transparent
  // We use high contrast and saturation filters for dark theme to prevent the logo from looking washed out or "too light" when inverted over the dark blue footer background.
  const blendClass = theme === 'dark' 
    ? 'mix-blend-screen invert contrast-[1.85] brightness-[1.15] saturate-[1.5]' 
    : 'mix-blend-multiply';
  
  // Render the exact uploaded PNG files using standard img tags with referrerPolicy="no-referrer"
  if (variant === 'symbol') {
    return (
      <img 
        src="/logo-symbol.png" 
        alt="OmniRange Symbol" 
        className={`${className} ${blendClass}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (variant === 'full') {
    return (
      <img 
        src="/logo-full.webp" 
        alt="OmniRange Logo with Tagline" 
        className={`${className} ${blendClass}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (variant === 'text') {
    return (
      <img 
        src="/logo-text.png" 
        alt="OmniRange Text" 
        className={`${className} ${blendClass}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return null;
}
