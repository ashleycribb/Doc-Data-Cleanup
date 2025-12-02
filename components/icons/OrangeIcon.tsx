
import React from 'react';

export const OrangeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12L12 3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12L19.79 7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12L19.79 16.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12L12 21" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12L4.21 16.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12L4.21 7.5" />
  </svg>
);
