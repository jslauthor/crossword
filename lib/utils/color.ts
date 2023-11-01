import memoizeOne from 'memoize-one';

export const getColorHex = memoizeOne(
  (color: number) => `#${color.toString(16).padStart(6, '0')}`
);
