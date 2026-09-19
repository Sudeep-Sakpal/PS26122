import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.4" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.4" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="1.4" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.4" />
    </svg>
  );
}

export function IntakeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 14.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5" />
      <path d="M12 3v11.5" />
      <path d="M7.5 10 12 14.5 16.5 10" />
    </svg>
  );
}

export function ActivitiesIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 6.5h2M5 12h2M5 17.5h2" />
      <path d="M10.5 6.5h8.5M10.5 12h8.5M10.5 17.5h8.5" />
      <path d="m4 6.5.6.6L6 5.7" />
    </svg>
  );
}

export function RisksIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5 21 19.5H3Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.6" r="0.15" fill="currentColor" stroke="none" />
      <path d="M12 16.6h.01" strokeWidth={2.4} />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 9a6 6 0 1 1 12 0c0 3.2 1 4.6 1.8 5.6a1 1 0 0 1-.8 1.6H5a1 1 0 0 1-.8-1.6C5 13.6 6 12.2 6 9Z" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.35-4.35" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8.2" r="3.2" />
      <path d="M5 19.5c1.2-3.3 3.9-5 7-5s5.8 1.7 7 5" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.2h.01" strokeWidth={2.4} />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" />
      <path d="M18 3.5v3.5h-3.5M6 20.5V17h3.5" />
    </svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 12.5h4.2l1.5 2.4h5.6l1.5-2.4h4.2" />
      <path d="M5.5 6 3.5 12.5v5A2 2 0 0 0 5.5 19.5h13a2 2 0 0 0 2-2v-5L18.5 6a1.5 1.5 0 0 0-1.4-1H6.9a1.5 1.5 0 0 0-1.4 1Z" />
    </svg>
  );
}
