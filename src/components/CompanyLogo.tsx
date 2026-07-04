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
  
  // Choose the appropriate CSS filter based on the theme
  // For light theme, we render the transparent PNG exactly as-is (no filters needed).
  // For dark theme, we convert the logo to a clean, highly visible monochrome white using brightness(0) invert(1).
  const filterStyle = theme === 'dark' 
    ? { filter: 'brightness(0) invert(1)' } 
    : { filter: 'none' };
  
  // Render the exact uploaded PNG files using standard img tags with referrerPolicy="no-referrer"
  if (variant === 'symbol') {
    return (
      <img 
        src="/logo-symbol.png" 
        alt="OmniRange Symbol" 
        className={className}
        style={filterStyle}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (variant === 'full') {
    return (
      <img 
        src="/logo-full.png" 
        alt="OmniRange Logo with Tagline" 
        className={className}
        style={filterStyle}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (variant === 'text') {
    return (
      <img 
        src="/logo-text.png" 
        alt="OmniRange Text" 
        className={className}
        style={filterStyle}
        referrerPolicy="no-referrer"
      />
    );
  }

  return null;
}
