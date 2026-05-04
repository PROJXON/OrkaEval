// Shared constants used across CheckIn, Coaching, and other form components

export const EMOJIS = [
  '😊', '😄', '😁', '🥰', '😌', '😔', '😤', '😰', '😴', '😪',
  '🤔', '🤩', '😅', '😬', '🥳', '🎉', '😮‍💨', '💪', '🧠', '🙏',
  '🔥', '😠', '😢', '😭', '🤗', '⚡', '🌊', '🚀', '🧩', '🌱'
];

export const STRESS_STOPS = [
  '#22c55e', '#4ade80', '#a3e635', '#facc15', '#fb923c',
  '#f97316', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d'
];

export const BW_STOPS = [
  '#7f1d1d', '#b91c1c', '#dc2626', '#ef4444', '#f97316',
  '#fb923c', '#facc15', '#84cc16', '#22c55e', '#16a34a'
];

export const STRESS_LABELS = [
  '', 'Zen', 'Chill', 'Low', 'Mild', 'Moderate',
  'Noticeable', 'High', 'Very high', 'Critical', 'MAX'
];

export const BW_LABELS = [
  '', 'Maxed', 'Near max', 'Very low', 'Limited', 'Balanced',
  'Some room', 'Good', 'Plenty', 'High', 'Wide open'
];

export const RATING_DATA = [
  null,
  { emoji: '😬', label: 'Needs serious improvement', color: '#ef4444' },
  { emoji: '😕', label: 'Below expectations', color: '#f97316' },
  { emoji: '😐', label: 'Okay — could be better', color: '#f59e0b' },
  { emoji: '🙂', label: 'Decent session', color: '#eab308' },
  { emoji: '😊', label: 'Solid check-in', color: '#84cc16' },
  { emoji: '😄', label: 'Good session', color: '#22c55e' },
  { emoji: '😁', label: 'Really good', color: '#10b981' },
  { emoji: '🤩', label: 'Great session!', color: '#06b6d4' },
  { emoji: '🔥', label: 'Excellent!', color: '#6366f1' },
  { emoji: '💎', label: 'OUTSTANDING', color: '#a855f7' },
];

export const DEVELOPMENT_TOPICS = [
  'Communication', 'Leadership', 'Technical Skills',
  'Time Management', 'Project Management', 'Public Speaking',
  'Data Analysis', 'Design Thinking', 'Strategic Planning',
];
