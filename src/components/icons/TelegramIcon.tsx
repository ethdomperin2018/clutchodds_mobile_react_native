import Svg, { Circle, Path } from "react-native-svg";

/** Same mark as web `components/icons/TelegramIcon.tsx`. */
export function TelegramIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <Circle cx="12" cy="12" fill="#229ED9" r="12" />
      <Path
        d="M5.491 11.74 17.061 7.28c.537-.194 1.006.131.832.943l-1.97 9.281c-.146.658-.537.818-1.084.508l-3.001-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953z"
        fill="#fff"
      />
    </Svg>
  );
}
