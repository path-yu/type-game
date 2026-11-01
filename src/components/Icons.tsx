interface P {
  className?: string;
}

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 20 20',
};

export function IconCity({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 16.5V9l4-3.5 4 3.5" />
      <path d="M10.5 16.5V6l3.5-3 3.5 3v10.5" />
      <path d="M1.5 16.5h17" />
      <path d="M4.8 12.2h.01M7 12.2h.01M13 9.4h.01M15.2 9.4h.01" />
    </svg>
  );
}

export function IconMoon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M16.5 12.4A6.9 6.9 0 0 1 7.6 3.5a6.9 6.9 0 1 0 8.9 8.9Z" />
    </svg>
  );
}

export function IconBook({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M3 4.2h5.2a1.8 1.8 0 0 1 1.8 1.8v10a1.4 1.4 0 0 0-1.4-1.4H3Z" />
      <path d="M17 4.2h-5.2A1.8 1.8 0 0 0 10 6v10a1.4 1.4 0 0 1 1.4-1.4H17Z" />
    </svg>
  );
}

export function IconShelf({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 4.5h15M2.5 10h15M2.5 15.5h15" />
      <circle cx="5.5" cy="4.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="15.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSun({ className }: P) {  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="10" r="3.6" />
      <path d="M10 2.4v1.7M10 15.9v1.7M2.4 10h1.7M15.9 10h1.7M4.6 4.6l1.2 1.2M14.2 14.2l1.2 1.2M15.4 4.6l-1.2 1.2M5.8 14.2l-1.2 1.2" />
    </svg>
  );
}

export function IconMonitor({ className }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="2.6" y="4" width="14.8" height="9.6" rx="1.6" />
      <path d="M7 16.6h6M10 13.6v3" />
    </svg>
  );
}

export function IconPlay({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M6.5 4.6 15 10l-8.5 5.4Z" />
    </svg>
  );
}

export function IconStar({ className, filled = true }: P & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} width="100%" height="100%"
      fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3"
      strokeLinejoin="round">
      <path d="M12 2.4 Q13.4 10.6 21.6 12 Q13.4 13.4 12 21.6 Q10.6 13.4 2.4 12 Q10.6 10.6 12 2.4 Z" />
    </svg>
  );
}

export function IconGear({ className }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.6v1.6M10 15.8v1.6M17.4 10h-1.6M4.2 10H2.6M15.2 4.8l-1.1 1.1M5.9 14.1l-1.1 1.1M15.2 15.2l-1.1-1.1M5.9 5.9 6.9 6.9" />
    </svg>
  );
}

export function IconPulse({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M2.6 10h2.6l1.6-4.2 2.4 8.4 2-6 1.5 3.4h3.7" />
    </svg>
  );
}

export function IconBlank({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M2.6 5.4h14.8M2.6 10h4.2M11.4 10h5.6M2.6 14.6h14.8" />
      <path d="M8.2 8.2v3.6" strokeDasharray="1.6 1.4" />
    </svg>
  );
}
