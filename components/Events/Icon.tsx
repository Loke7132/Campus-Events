interface IconProps {
  children: React.ReactNode;
  className?: string;
}

export const Icon = ({ children, className = "" }: IconProps) => (
  <svg 
    className={`w-3 min-[360px]:w-3.5 sm:w-4.5 h-3 min-[360px]:h-3.5 sm:h-4.5 filter drop-shadow-sm ${className}`}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);
