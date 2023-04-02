import { Global, css } from '@emotion/react';

const GlobalStyles = () => {
  return (
    <Global
      styles={css`
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

        :root {
          --white: #ffffff;
          --black: #131414;

          --max-app-width: 500px;
        }

        // Theme variables
        .dark {
          --primary-text: var(--white);
          --primary-bg: var(--black);
          --primary-app-width: var(--max-app-width);

          background-color: var(--primary-bg);
          color: var(--primary-text);
        }

        // React Simple Keyboad Theme

        input {
          width: 100%;
          height: 100px;
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
        }

        .spacer-button {
          background-color: transparent !important;
          width: 100% !important;
          max-width: 20px !important;
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
          height: 50px;
          width: 100%;
          max-width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #333333;
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
      `}
    />
  );
};

export default GlobalStyles;
