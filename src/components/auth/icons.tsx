type IconProps = { className?: string };

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function GridIcon({ className }: IconProps) { return <svg {...svgProps} className={className}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>; }
export function DocumentIcon({ className }: IconProps) { return <svg {...svgProps} className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></svg>; }
export function UsersIcon({ className }: IconProps) { return <svg {...svgProps} className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
export function ChartIcon({ className }: IconProps) { return <svg {...svgProps} className={className}><path d="M4 19V5M4 19h17" /><path d="m7 15 3-4 3 2 5-7" /><path d="M18 6h2v2" /></svg>; }
export function TerminalIcon({ className }: IconProps) { return <svg {...svgProps} className={className}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M13 15h4" /></svg>; }
export function MenuIcon({ className }: IconProps) { return <svg {...svgProps} className={className}><path d="M4 6h16M4 12h16M4 18h16" /></svg>; }
export function CloseIcon({ className }: IconProps) { return <svg {...svgProps} className={className}><path d="m6 6 12 12M18 6 6 18" /></svg>; }
export function LogoutIcon({ className }: IconProps) { return <svg {...svgProps} className={className}><path d="M10 17l5-5-5-5M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-5" /></svg>; }
export function ShieldIcon({ className }: IconProps) { return <svg {...svgProps} className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>; }
export function ActivityIcon({ className }: IconProps) { return <svg {...svgProps} className={className}><path d="M3 12h4l2-6 4 12 2-6h6" /></svg>; }
export function PlusIcon({ className }: IconProps) { return <svg {...svgProps} className={className}><path d="M12 5v14M5 12h14" /></svg>; }
