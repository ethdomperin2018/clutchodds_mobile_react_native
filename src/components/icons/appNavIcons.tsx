import Svg, { Path } from "react-native-svg";
import type { ReactNode } from "react";

type NavIconProps = {
  color: string;
  size?: number;
};

/** Same path data as web `components/app/appNavIcons.tsx` (Heroicons outline). */
function NavSvg({
  color: _color,
  size = 24,
  children,
}: NavIconProps & { children: ReactNode }) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      {children}
    </Svg>
  );
}

function StrokePath({ d, color }: { d: string; color: string }) {
  return (
    <Path
      d={d}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
    />
  );
}

export function NavIconDashboard({ color, size }: NavIconProps) {
  return (
    <NavSvg color={color} size={size}>
      <StrokePath
        color={color}
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </NavSvg>
  );
}

export function NavIconValueBets({ color, size }: NavIconProps) {
  return (
    <NavSvg color={color} size={size}>
      <StrokePath
        color={color}
        d="M2.25 18L9 11.25l4.306 4.307a1.125 1.125 0 001.591 0L21.75 9M21.75 9h-3.375M21.75 9v3.375"
      />
    </NavSvg>
  );
}

export function NavIconArbitrage({ color, size }: NavIconProps) {
  return (
    <NavSvg color={color} size={size}>
      <StrokePath
        color={color}
        d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
      />
    </NavSvg>
  );
}

export function NavIconMyBets({ color, size }: NavIconProps) {
  return (
    <NavSvg color={color} size={size}>
      <StrokePath
        color={color}
        d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.008 5.25h.007v.008H3.758v-.008zm.008 5.25h.007v.008H3.766v-.008z"
      />
    </NavSvg>
  );
}

export function NavIconBookmakers({ color, size }: NavIconProps) {
  return (
    <NavSvg color={color} size={size}>
      <StrokePath
        color={color}
        d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.768-.393 2.436-1.08a3.001 3.001 0 003.75.615v11.65"
      />
    </NavSvg>
  );
}

/** Profile tab — person icon (mobile Profile, not web Settings gear). */
export function NavIconProfile({ color, size }: NavIconProps) {
  return (
    <NavSvg color={color} size={size}>
      <StrokePath
        color={color}
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </NavSvg>
  );
}

/** Web Settings gear — used in the More menu. */
export function NavIconSettings({ color, size }: NavIconProps) {
  return (
    <NavSvg color={color} size={size}>
      <StrokePath
        color={color}
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <StrokePath color={color} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </NavSvg>
  );
}

/** Model Predictions / AI insights — same paths as web `NavIconBrain`. */
export function NavIconPrediction({ color, size }: NavIconProps) {
  return (
    <NavSvg color={color} size={size}>
      <StrokePath
        color={color}
        d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"
      />
      <StrokePath
        color={color}
        d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"
      />
      <StrokePath
        color={color}
        d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"
      />
    </NavSvg>
  );
}

export function NavIconMore({ color, size }: NavIconProps) {
  return (
    <NavSvg color={color} size={size}>
      <StrokePath
        color={color}
        d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      />
    </NavSvg>
  );
}
