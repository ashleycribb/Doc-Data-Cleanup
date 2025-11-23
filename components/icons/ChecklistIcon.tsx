import React from 'react';

export const ChecklistIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.527l4.21-7.29a.375.375 0 01.557.527l-1.608 2.788z" 
        opacity="0.4"
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M12 21a9 9 0 007.5-12.5"
        opacity="0.2"
    />
  </svg>
);
