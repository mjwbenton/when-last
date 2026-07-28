import type { SVGProps } from 'react';

export type IconName = 'plus' | 'check' | 'upload' | 'download' | 'alert' | 'copy' | 'trash';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'name' | 'stroke' | 'strokeWidth'> & {
  name: IconName;
  size?: number;
  stroke?: number;
};

export function Icon({ name, size = 20, stroke = 1.75, ...rest }: IconProps) {
  const common = {
    ...rest,
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 5 5 9-11" />
        </svg>
      );
    case 'upload':
      return (
        <svg {...common}>
          <path d="M12 17V5M7 10l5-5 5 5M4 19h16" />
        </svg>
      );
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 5v12M7 12l5 5 5-5M4 19h16" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 3 2 20h20L12 3Z" />
          <path d="M12 10v4M12 17.5v.01" />
        </svg>
      );
    case 'copy':
      return (
        <svg {...common}>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...common}>
          <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7h14ZM10 11v6M14 11v6" />
        </svg>
      );
  }
}
