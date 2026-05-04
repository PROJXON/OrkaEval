// Shared color utility functions used by CheckIn, Coaching, and other form components

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function hexToRgb(h) {
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  };
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

export function colorAt(stops, t) {
  const seg = (stops.length - 1) * t;
  const i = Math.min(Math.floor(seg), stops.length - 2);
  const lt = seg - i;
  const a = hexToRgb(stops[i]);
  const b = hexToRgb(stops[i + 1]);
  return rgbToHex(lerp(a.r, b.r, lt), lerp(a.g, b.g, lt), lerp(a.b, b.b, lt));
}

export function rgba(h, a) {
  const { r, g, b } = hexToRgb(h);
  return `rgba(${r},${g},${b},${a})`;
}
