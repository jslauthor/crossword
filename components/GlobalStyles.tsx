'use client';

import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
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

  .text-sm {
    font-size: .625rem;
    line-height: 1.3;
  }

  :root {
    --white: #F4F8F0;
    --black: #131414;
    --grey: #333333;
    --grey100: #1d1d1d;
    --grey500: #b9b9b9;
    --grey600: #41483E;
    --grey800: #2C2F2A;
    --grey900: #20231F;

    --max-app-width: 500px;
  }

  // Theme variables
  .dark {
    --primary-text: var(--white);
    --primary-bg: var(--black);
    --primary-app-width: var(--max-app-width);
    --secondary-bg: var(--grey);
    --terciary-bg: var(--grey900);

    --ai-bg: var(--grey600);
    --menu-border: var(--grey100);
    --preview-hover-bg: var(--grey800);

    background-color: var(--primary-bg);
    color: var(--primary-text);
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
    font-size: 0.75rem;
    padding-left: 5px !important;
    padding-right: 5px !important;

    /* Hide the text. */
    text-indent: -9999px;
    white-space: nowrap;
    overflow: hidden;
  }

  .spacer-button {
    background-color: transparent !important;
    width: 100% !important;
    max-width: 20px !important;
  }

  .turn-left-button,
  .turn-right-button {
    background: transparent !important;
    border: 1px solid var(--secondary-bg) !important;
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
    background-color: transparent;
    border-radius: 0;
    border-bottom-right-radius: 5px;
    border-bottom-left-radius: 5px;
  }

  .simple-keyboard.keyboardTheme .hg-button {
    height: 55px;
    width: 100%;
    max-width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--secondary-bg);
    color: white;
    border: none;
    flex-grow: unset;
  }

  .simple-keyboard.keyboardTheme .hg-button:active {
    background: #1c4995;
    color: white;
  }

  .simple-keyboard.keyboardTheme .hg-row {
    justify-content: center;
    align-items: center;
    touch-action: manipulation;
    margin: 0.25rem;
    margin-left: 0;
    margin-right: 0;
  }

  #root .simple-keyboard.keyboardTheme + .simple-keyboard-preview {
    background: #1c4995;
  }
`;
