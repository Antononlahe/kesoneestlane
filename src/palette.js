export const palette = {
  night: 0x07090e,
  baltic: 0x0b2744,
  ice: 0x7eb6d9,
  bone: 0xe8e4d9,
  rye: 0xc4a35a,
  pine: 0x3d6b5a,
};

export const SIZE = 8;

export function toWorld(t) {
  return (t - 0.5) * SIZE;
}

export function lerpHex(a, b, t) {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
