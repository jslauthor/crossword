'use client';

import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import SimpleKeyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import { PuzzleLayout } from 'lib/stores/puzzle-editor';

export type KeyboardLayoutType = Record<PuzzleLayout, string[]>;
export type CssMapType = Record<string, [string, string]>;
export type KeyboardProps = {
  onKeyPress?: (button: string) => void;
  layout: keyof KeyboardLayoutType;
  svgContentMap: Record<string, string>;
};

const KeyboardContainer = styled.div<{ $svgCssMap?: CssMapType }>`
  width: 100%;
  height: max-content;
  position: relative;

  ${({ $svgCssMap }) => {
    if ($svgCssMap) {
      return Object.entries($svgCssMap).map(([key, [, data]]) => {
        return `

          .${key} {
            span {
              font-size: 0;
            }
            &::before {
              content: url('${data}');
              display: block;
              aspect-ratio: 1;
              width: 92%;
            }
          }

        `;
      });
    }
  }}
`;

const Keyboard: React.FC<KeyboardProps> = ({
  onKeyPress,
  svgContentMap,
  layout,
}) => {
  const [svgCssMap, setSvgCssMap] = useState<CssMapType>({});

  const keyLayout: KeyboardLayoutType = useMemo(() => {
    const emojiKeys = Object.keys(svgContentMap).sort();
    return {
      default: [
        'Q W E R T Y U I O P',
        '{sp} A S D F G H J K L {sp}',
        'MORE Z X C V B N M {bksp}',
      ],
      emoji: [
        `${emojiKeys.slice(0, 9).join(' ')}`,
        `${emojiKeys.slice(9, 18).join(' ')}`,
        `${emojiKeys.slice(18, 26).join(' ')} {bksp}`,
      ],
    };
  }, [svgContentMap]);

  // Keyboard mappings
  const displayKeyMap = useMemo(() => {
    return {
      '{bksp}': '⌫',
      '{sp}': ' ',
      '{tl}': '<<<',
      '{tr}': '>>>',
      MORE: ' ',
    };
  }, []);

  const buttonTheme = useMemo(() => {
    const cssMap = Object.keys(svgContentMap).reduce((acc, key, index) => {
      const svgBase64 = svgContentMap[key];
      if (svgBase64 == null) {
        return acc;
      } else {
        acc[`svg-${index}`] = [key, svgBase64];
      }
      return acc;
    }, {} as CssMapType);
    setSvgCssMap(cssMap);
    return [
      {
        class: 'more-button',
        buttons: 'MORE',
      },
      {
        class: 'spacer-button',
        buttons: '{sp}',
      },
      {
        class: 'turn-left-button',
        buttons: '{tl}',
      },
      {
        class: 'turn-right-button',
        buttons: '{tr}',
      },
      {
        class: 'backspace-button',
        buttons: '{bksp}',
      },
      ...Object.entries(cssMap).map(([key, value]) => ({
        class: key,
        buttons: value[0],
      })),
    ];
  }, [svgContentMap]);

  return (
    <KeyboardContainer $svgCssMap={svgCssMap}>
      <SimpleKeyboard
        theme="hg-theme-default keyboardTheme"
        layoutName={layout}
        onKeyPress={onKeyPress}
        mergeDisplay
        display={displayKeyMap}
        buttonTheme={buttonTheme}
        layout={keyLayout}
      />
    </KeyboardContainer>
  );
};

export default Keyboard;
