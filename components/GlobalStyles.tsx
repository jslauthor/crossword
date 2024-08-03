'use client';

import {
  DEFAULT_BORDER_COLOR_CSS_VARIABLE,
  DEFAULT_COLOR_CSS_VARIABLE,
  DEFAULT_CORRECT_COLOR_CSS_VARIABLE,
  DEFAULT_ERROR_COLOR_CSS_VARIABLE,
  DEFAULT_FONT_COLOR_CSS_VARIABLE,
  DEFAULT_FONT_DRAFT_COLOR_CSS_VARIABLE,
  DEFAULT_SELECTED_ADJACENT_COLOR_CSS_VARIABLE,
  DEFAULT_SELECTED_COLOR_CSS_VARIABLE,
  DEFAULT_TURN_ARROW_COLOR_CSS_VARIABLE,
} from 'lib/utils/color';
import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle/*css*/ `
  html,
  body,
  div,
  span,
  applet,
  object,
  iframe,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  blockquote,
  pre,
  a,
  abbr,
  acronym,
  address,
  big,
  cite,
  code,
  del,
  dfn,
  em,
  img,
  ins,
  kbd,
  q,
  s,
  samp,
  small,
  strike,
  strong,
  sub,
  sup,
  tt,
  var,
  b,
  u,
  i,
  center,
  dl,
  dt,
  dd,
  ol,
  ul,
  li,
  fieldset,
  form,
  label,
  legend,
  table,
  caption,
  tbody,
  tfoot,
  thead,
  tr,
  th,
  td,
  article,
  aside,
  canvas,
  details,
  embed,
  figure,
  figcaption,
  footer,
  header,
  hgroup,
  menu,
  nav,
  output,
  ruby,
  section,
  summary,
  time,
  mark,
  audio,
  video {
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    font: inherit;
    vertical-align: baseline;
  }
  /* HTML5 display-role reset for older browsers */
  article,
  aside,
  details,
  figcaption,
  figure,
  footer,
  header,
  hgroup,
  menu,
  nav,
  section {
    display: block;
  }
  body {
    line-height: 1;
  }
  ol,
  ul {
    list-style: none;
  }
  blockquote,
  q {
    quotes: none;
  }
  blockquote:before,
  blockquote:after,
  q:before,
  q:after {
    content: '';
    content: none;
  }
  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  html,
  body {
    font-family: 'franklin-gothic-atf', sans-serif;
    font-weight: 400;
    font-style: normal;
    user-select: none;
    -webkit-user-select: none;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  h1 {
    font-family: 'franklin-gothic-atf', sans-serif;
    font-weight: 600;
    font-style: normal;
    font-size: 1.5rem;
  }

  h2 {
    font-family: 'franklin-gothic-atf', sans-serif;
    font-weight: 400;
    font-style: normal;
    font-size: 1rem;
  }

  span,
  p,
  ul {
    font-size: 0.75rem;
    line-height: 1.25rem;
  }

  .semi { 
    font-weight: 500;
  }

  .italic {
    font-style: italic;
  }

  .capital {
    text-transform: uppercase;
  }

  :root {
    --radius: 0.3rem;

    // Colors
    --white: #ededed;
    --white-hsl: 0 0% 93%;

    --black: #131414;
    --black-hsl: 0 0% 8%;
    --black100-hsl: 0 0% 20%;

    --true-white: #FFFFFF;
    --true-white-hsl: 0 0% 100%;

    --true-black: #000000;
    --true-black-hsl: 0 0% 0%;

    --cool-grey700: #829b9e;
    --cool-grey700-hsl: 185 11% 56%;

    --grey: #333333;
    --grey-hsl: 0 0% 20%;

    --grey100: #1d1d1d;
    --grey100-hsl: 0 0% 11%;

    --grey500: #b9b9b9;
    --grey500-hsl: 0 0% 73%;

    --grey550: #727F6C;
    --grey550-hsl: 92 7% 47%;

    --grey600: #41483E;
    --grey600-hsl: 90 7% 25%;

    --grey400: #6B6B6B;
    --grey400-hsl: 0 0% 42%;

    --grey800: #2C2F2A;
    --grey800-hsl: 85 7% 18%;

    --grey900: #20231F;
    --grey900-hsl: 100 7% 13%;

    --grey1000: #191816;
    --grey1000-hsl: 40 6.40% 9.20%

    --yellow500: #F2C94C;
    --yellow500-hsl: 47 86% 63%;

    --yellow400: #F8DB4A;
    --yellow400-hsl: 51 92% 64%;

    --red500: #EB5757;
    --red500-hsl: 0 80% 63%;

    --red600: #db3232;
    --red600-hsl: 0 72% 54%;

    --red700: #fc2727;
    --red700-hsl: 0 97% 57%;

    --blue500: #0E8AFF;
    --blue500-hsl: 209 100% 53%;

    --blue-muted-400: #477AAA;
    --blue-muted-400-hsl: 209 41% 47%;

    --purple-800: #483F80;
    --purple-800-hsl: 248 34% 37%;

    --teal500: #00dcff;
    --teal500-hsl: 190 100% 50%;

    --mint-green200: #9dfac9;
    --mint-green200-hsl: 143 93% 80%;

    --mint-green400: #1ed473;
    --mint-green400-hsl: 145 83% 47%;

    --light-grey100: #D0D3D9;
    --light-grey100-hsl: 223 14% 83%;

    --light-grey500: #999EAb;
    --light-grey500-hsl: 222 8% 63%;

    --light-grey900: #595963;
    --light-grey900-hsl: 225 5% 35%; 

    --light-grey-blue300: #7faab0;
    --light-grey-blue300-hsl: 190 25% 58%;

    --light-grey-blue400: #B1D7FB;
    --light-grey-blue400-hsl: 204 86% 86%;

    --light-grey-blue700: #43617d;
    --light-grey-blue700-hsl: 207 32% 37%;

    --magenta500: #f70ca9;
    --magenta500-hsl: 322 94% 53%;
    
    --max-app-width: 500px;
  }

  .text-foreground, .text-default-foreground {
    color: inherit;
  }

  // Theme variables
  [data-theme='dark'] {
    --background: 20 14.3% 4.1%;
    --foreground: 0 0% 95%;
    --card: 24 9.8% 10%;
    --card-foreground: 0 0% 95%;
    --popover: 0 0% 9%;
    --popover-foreground: 0 0% 95%;
    --primary: var(--blue500-hsl);
    --primary-foreground: var(--true-white-hsl);
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 15%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 12 6.5% 15.1%;
    --accent-foreground: 0 0% 98%;
    --destructive: 15 100% 60%;
    --destructive-foreground: 0 85.7% 97.3%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 142.4 71.8% 29.2%;

    --medium-difficulty-text: var(--yellow500);
    --hard-difficulty-text: var(--red500);

    --keyboard-bg: transparent;
    --keyboard-button-bg: var(--grey900);
    --keyboard-button-color: hsl(var(--foreground));
    --keyboard-function-bg: var(--light-grey900);
    --keyboard-padding: 0;

    --bg-moji: conic-gradient(
      from 180deg at 50% 50%,
      rgba(235, 87, 87, 1.0) 0deg,
      rgba(242, 153, 74, 1.0) 54.00000214576721deg,
      rgba(39, 174, 96, 1.0) 118.80000472068787deg,
      rgba(47, 128, 237, 1.0) 180deg,
      rgba(86, 204, 242, 1.0) 244.80000257492065deg,
      rgba(187, 107, 217, 1.0) 306.00000858306885deg,
      rgba(235, 87, 87, 1.0) 360deg
    );
    --bg-mini: 205 100% 39%;
    --bg-cube: 113 57% 37%;
    --bg-mega: 11 76% 48%;

    --text-moji: 266 100% 73%;
    --text-mini: 209 100% 53%;
    --text-cube: 134 47% 48%;
    --text-mega: 7 100% 60%;

    --bg-success: 49, 100%, 16%;

    // Puzzle specific theme vars
    ${DEFAULT_FONT_COLOR_CSS_VARIABLE}: var(--white);
    ${DEFAULT_FONT_DRAFT_COLOR_CSS_VARIABLE}: var(--black);
    ${DEFAULT_COLOR_CSS_VARIABLE}: var(--light-grey900);
    ${DEFAULT_SELECTED_COLOR_CSS_VARIABLE}: var(--blue-muted-400);
    ${DEFAULT_SELECTED_ADJACENT_COLOR_CSS_VARIABLE}: var(--purple-800);
    ${DEFAULT_CORRECT_COLOR_CSS_VARIABLE}: var(--blue500);
    ${DEFAULT_ERROR_COLOR_CSS_VARIABLE}: var(--red700);
    ${DEFAULT_BORDER_COLOR_CSS_VARIABLE}: var(--true-black);
    ${DEFAULT_TURN_ARROW_COLOR_CSS_VARIABLE}: var(--white);

    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    scrollbar-color: hsl(--black-hsl) hsl(--black100-hsl);
    --primary-app-width: var(--max-app-width);
  }

  [data-theme='light'] {
    --background: var(--white-hsl);
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: var(--blue500-hsl);
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 15 100% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.3rem;

    --medium-difficulty-text: var(--yellow500);
    --hard-difficulty-text: var(--red500);

    --keyboard-bg: var(--light-grey100);
    --keyboard-button-bg: hsl(var(--true-white-hsl));
    --keyboard-button-color: hsl(--foreground);
    --keyboard-function-bg: var(--light-grey500);
    --keyboard-padding: 0 .25rem;

    --bg-moji: conic-gradient(
      from 180deg at 50% 50%,
      rgba(235, 87, 87, 1.0) 0deg,
      rgba(242, 153, 74, 1.0) 54.00000214576721deg,
      rgba(39, 174, 96, 1.0) 118.80000472068787deg,
      rgba(47, 128, 237, 1.0) 180deg,
      rgba(86, 204, 242, 1.0) 244.80000257492065deg,
      rgba(187, 107, 217, 1.0) 306.00000858306885deg,
      rgba(235, 87, 87, 1.0) 360deg
    );
    --bg-mini: 205 100% 89%;
    --bg-cube: 133 100% 87%;
    --bg-mega: 18 100% 87%;

    --text-moji: 266 100% 73%;
    --text-mini: 209 100% 53%;
    --text-cube: 134 47% 48%;
    --text-mega: 7 100% 60%;

    --bg-success: 49, 100%, 16%;

    // Puzzle specific theme vars
    // ONLY USE HEX COLORS HERE
    ${DEFAULT_FONT_COLOR_CSS_VARIABLE}: var(--true-black);
    ${DEFAULT_FONT_DRAFT_COLOR_CSS_VARIABLE}: var(--light-grey-blue700);    
    ${DEFAULT_COLOR_CSS_VARIABLE}: var(--true-white);
    ${DEFAULT_SELECTED_COLOR_CSS_VARIABLE}: var(--yellow400);
    ${DEFAULT_SELECTED_ADJACENT_COLOR_CSS_VARIABLE}: var(--light-grey-blue400);
    ${DEFAULT_CORRECT_COLOR_CSS_VARIABLE}: var(--blue500);
    ${DEFAULT_ERROR_COLOR_CSS_VARIABLE}: var(--red600);
    ${DEFAULT_BORDER_COLOR_CSS_VARIABLE}: var(--true-black);
    ${DEFAULT_TURN_ARROW_COLOR_CSS_VARIABLE}: var(--grey600);

    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    scrollbar-color: hsl(--grey100-hsl) hsl(--grey800-hsl);
    --primary-app-width: var(--max-app-width);
  }

  .dim {
    color: var(--grey500);
  }

  // React Simple Keyboad Theme

  input {
    width: 100%;
    // height: 100px;
    padding: 20px;
    font-size: 20px;
    border: none;
    box-sizing: border-box;
  }

  .simple-keyboard {
    max-width: var(--primary-app-width);
    margin: 0 auto;
    padding: 0;
  }

  .more-button {
    span {
      font-size: 0;
    }
  }

  .spacer-button {
    background-color: transparent !important;
    width: 100% !important;
    max-width: 20px !important;
  }

  .turn-left-button,
  .turn-right-button {
    background: transparent !important;
    border: 1px solid hsl(var(--primary)) !important;
    /* Hide the text. */
    text-indent: -9999px;
    white-space: nowrap;
    overflow: hidden;
  }

  .turn-left-button:active,
  .turn-right-button:active {
    background: #1c4995 !important;
  }

  .turn-left-button {
    content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTMiIHZpZXdCb3g9IjAgMCAxNCAxMyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYuNDgxODUgMS44NTM1M0M2LjQ4MTg1IDEuODUzNTMgNS42NTU4MiAyLjIwNDQ0IDQuNTMzOTYgMi42Mzg1OEMzLjQxMjEgMy4wNzI3MyAxLjgzOTQ0IDQuMjg0MjMgMS44Mzk0NCA0LjI4NDIzQzEuODM5NDQgNC4yODQyMyAwLjc5MDU3NyAzLjk5NDggMC4wNDkwNzIzIDIuNjkzNjVDMC4xNTc5MjkgMi4wNjEgMC43OTA1NzcgMS41OTEgMS42MDM4IDEuMjEwNjRDMi40MTcwMiAwLjgzMDI4MyAzLjYyMjEzIDAuNTE2NTIgNC4wMTAxNyAwLjQyNDMxM0M1LjMwMjM2IDAuMTE2OTUzIDYuMzQ4NjYgMC4wMTk2MjI4IDYuMzQ4NjYgMC4wMTk2MjI4TDYuNDgxODUgMS44NTM1M1oiIGZpbGw9IiNCMEIwQjAiLz4KPHBhdGggZD0iTTkuMzYxOTcgMTAuODQ3NkM3Ljc2NjI2IDEwLjg4MjIgNi4xNzk1MiAxMC42MzEyIDQuMjI3NzkgOS45NjEzOUMxLjQ5NzQxIDguOTEyNTMgMS4xNzIxMiA3LjQxMTU5IDEuMTcyMTIgNy40MTE1OUwwLjA4NjEyMDYgNC4yODQyMUMyLjU0NSA2Ljc5Njg3IDcuNzY0OTggNi41OTk2NSA5LjUyMzM0IDYuNjM0MjNMOS41NTkxOSA0LjQyODkzTDEzLjA0OSA4LjUzMzQ1TDkuMzI0ODMgMTIuNTgyOUw5LjM2MDY5IDEwLjg0NzZIOS4zNjE5N1oiIGZpbGw9IiM3MDcwNzAiLz4KPC9zdmc+Cg==');
  }

  .turn-right-button {
    content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTUiIHZpZXdCb3g9IjAgMCAxNCAxNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTcuNDM3NTIgMi4yMDQyOUM3LjQzNzUyIDIuMjA0MjkgOC4yNjM1NSAyLjYwNDU1IDkuMzg1NDEgMy4wOTk3NUMxMC41MDczIDMuNTk0OTUgMTIuMDc5OSA0Ljk3Njg1IDEyLjA3OTkgNC45NzY4NUMxMi4wNzk5IDQuOTc2ODUgMTMuMTI4OCA0LjY0NjcyIDEzLjg3MDMgMy4xNjI1NkMxMy43NjE0IDIuNDQwOTQgMTMuMTI4OCAxLjkwNDgzIDEyLjMxNTYgMS40NzA5OEMxMS41MDI0IDEuMDM3MTMgMTAuMjk3MiAwLjY3OTI0IDkuOTA5MjEgMC41NzQwNjNDOC42MTcwMiAwLjIyMzQ3NiA3LjU3MDcxIDAuMTEyNDU3IDcuNTcwNzEgMC4xMTI0NTdMNy40Mzc1MiAyLjIwNDI5WiIgZmlsbD0iI0IwQjBCMCIvPgo8cGF0aCBkPSJNNC41NTczNCAxMi40NjMzQzYuMTUzMDUgMTIuNTAyOCA3LjczOTc5IDEyLjIxNjUgOS42OTE1MiAxMS40NTI1QzEyLjQyMTkgMTAuMjU2MSAxMi43NDcyIDguNTQ0MDYgMTIuNzQ3MiA4LjU0NDA2TDEzLjgzMzIgNC45NzY4NEMxMS4zNzQzIDcuODQyODkgNi4xNTQzMyA3LjYxNzkzIDQuMzk1OTggNy42NTczN0w0LjM2MDEyIDUuMTQxOTFMMC44NzAzMDggOS44MjM3TDQuNTk0NDggMTQuNDQyN0w0LjU1ODYyIDEyLjQ2MzNINC41NTczNFoiIGZpbGw9IiM3MDcwNzAiLz4KPC9zdmc+Cg==');
  }

  /*
    Theme: keyboardTheme
  */
  .simple-keyboard.keyboardTheme {
    background-color: var(--keyboard-bg);
    border-radius: .5rem;
    padding: var(--keyboard-padding);
  }

  .simple-keyboard.keyboardTheme .hg-button {
    height: 55px;
    width: 100%;
    max-width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--keyboard-button-bg);
    color: var(--keyboard-button-color);
    border: none;
    flex-grow: unset;
    padding: 0px;
  }

  .simple-keyboard.keyboardTheme .hg-button.backspace-button {
    background-color: var(--keyboard-function-bg);
  }

  .hg-theme-default .hg-button span {
    font-family: 'franklin-gothic-atf', sans-serif;
    font-weight: 500;    
    font-style: normal;
    font-size: 1rem;
  }

  .simple-keyboard.keyboardTheme .hg-button:active {
    background: hsl(var(--secondary));
  }

  .simple-keyboard.keyboardTheme .hg-row {
    justify-content: center;
    align-items: center;
    touch-action: manipulation;
    margin: 0.25rem;
    margin-left: 0;
    margin-right: 0;
  }
`;
