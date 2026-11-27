const SIZE = 24;

const shapes = [
  <polygon points="16,3 30,29 2,29" />, // ▲
  <polygon points="16,2 30,16 16,30 2,16" />, // ◆
  <circle cx="16" cy="16" r="13" />, // ●
  <rect x="3" y="3" width="26" height="26" />, // ■
];

export function ShapeIcon({ index }: { index: number }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 32 32" fill="white">
      {shapes[index]}
    </svg>
  );
}
