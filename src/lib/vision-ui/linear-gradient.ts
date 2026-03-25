/**
 * Vision UI–style linear gradient helper (adapted from Creative Tim Vision UI Dashboard).
 */
export function linearGradient(
  color: string,
  colorState: string,
  angleDeg?: string | number,
): string {
  const angle = angleDeg === undefined ? 310 : angleDeg;
  return `linear-gradient(${angle}deg, ${color}, ${colorState})`;
}
