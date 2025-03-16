import type { NavArrowProps } from "./types";

export function NavArrow({ direction, onClick, hide }: NavArrowProps) {
  if (hide) return null;
  return (
    <button 
      onClick={onClick}
      className={`sticky ${direction}-0 z-10 flex-none p-1 transition-all text-white`}
      aria-label={`Scroll ${direction}`}
    >
      <svg 
        className="w-5 h-5" 
        fill="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {direction === 'left' ? (
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        ) : (
          <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
        )}
      </svg>
    </button>
  );
}

NavArrow.displayName = 'NavArrow';
