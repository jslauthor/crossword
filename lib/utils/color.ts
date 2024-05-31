import memoizeOne from 'memoize-one';
import tinycolor from 'tinycolor2';

export const DEFAULT_COLOR = 0x708d91;
export const DEFAULT_SELECTED_COLOR = 0xd31996;
export const DEFAULT_SELECTED_ADJACENT_COLOR = 0x1cad60;
export const DEFAULT_CORRECT_COLOR = 0x00dcff;
export const DEFAULT_ERROR_COLOR = 0xce1af3;
export const DEFAULT_BORDER_COLOR = 0x000000;

export const getColorHex = memoizeOne(
  (color: number) => `#${color.toString(16).padStart(6, '0')}`,
);

export const correctColor = tinycolor(
  getColorHex(DEFAULT_CORRECT_COLOR),
).toRgb();
export const errorColor = tinycolor(getColorHex(DEFAULT_ERROR_COLOR)).toRgb();
export const borderColor = tinycolor(getColorHex(DEFAULT_BORDER_COLOR)).toRgb();
