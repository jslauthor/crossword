import memoizeOne from 'memoize-one';
import { Vector4 } from 'three';
import tinycolor from 'tinycolor2';

export const DEFAULT_FONT_COLOR_CSS_VARIABLE = '--default-font-color';
export const DEFAULT_FONT_DRAFT_COLOR_CSS_VARIABLE =
  '--default-font-draft-color';
export const DEFAULT_COLOR_CSS_VARIABLE = '--default-color';
export const DEFAULT_SELECTED_COLOR_CSS_VARIABLE = '--selected-color';
export const DEFAULT_SELECTED_ADJACENT_COLOR_CSS_VARIABLE =
  '--selected-adjacent-color';
export const DEFAULT_CORRECT_COLOR_CSS_VARIABLE = '--correct-color';
export const DEFAULT_ERROR_COLOR_CSS_VARIABLE = '--error-color';
export const DEFAULT_BORDER_COLOR_CSS_VARIABLE = '--border-color';

export const DEFAULT_FONT_COLOR = 0xffffff;
export const DEFAULT_FONT_DRAFT_COLOR = 0x222222;
export const DEFAULT_COLOR = 0x708d91;
export const DEFAULT_SELECTED_COLOR = 0xd31996;
export const DEFAULT_SELECTED_ADJACENT_COLOR = 0x1cad60;
export const DEFAULT_CORRECT_COLOR = 0x00dcff;
export const DEFAULT_ERROR_COLOR = 0xce1af3;
export const DEFAULT_BORDER_COLOR = 0x000000;

export const getColorHex = memoizeOne(
  (color: number) => `#${color.toString(16).padStart(6, '0')}`,
);

export const hexToVector = (color: number) => {
  const rgb = tinycolor(getColorHex(color)).toRgb();
  return new Vector4(rgb.r / 255, rgb.g / 255, rgb.b / 255, 1.0);
};

export const correctColor = tinycolor(
  getColorHex(DEFAULT_CORRECT_COLOR),
).toRgb();
export const errorColor = tinycolor(getColorHex(DEFAULT_ERROR_COLOR)).toRgb();
export const borderColor = tinycolor(getColorHex(DEFAULT_BORDER_COLOR)).toRgb();

export const getStyleForCSSVariable = (variable: string) => {
  const rootStyles = getComputedStyle(document.documentElement);
  const color = rootStyles.getPropertyValue(variable).trim();
  return parseInt(color.substring(1), 16);
};
