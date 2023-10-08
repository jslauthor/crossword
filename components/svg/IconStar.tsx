'use client';

import React from 'react';

import { createComponent } from '@lit-labs/react';
import { LitElement, html, TemplateResult, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import memoizeOne from 'memoize-one';

const getColorHex = memoizeOne(
  (color: number) => `#${color.toString(16).padStart(6, '0')}`
);

export enum DifficultyEnum {
  Easy,
  Medium,
  Hard,
}

const NAME = 'icon-star';

@customElement(NAME)
export class Star extends LitElement {
  @property({ type: Number })
  public width = 13;

  @property({ type: Number })
  public height = 12;

  @property({ type: Number })
  public color = 0x1fbe68;

  @property({ type: String })
  public difficulty: DifficultyEnum = DifficultyEnum.Easy;

  @state()
  protected path: string =
    'M12.3449 4.02025L8.79225 3.52273L7.20531 0.418008C6.91796 -0.136183 6.0951 -0.14248 5.80775 0.418008L4.22082 3.52273L0.668161 4.02025C0.0281608 4.10841 -0.226533 4.86413 0.23714 5.29866L2.80367 7.71065L2.19632 11.124C2.0853 11.7411 2.75796 12.2009 3.32612 11.9112L6.5 10.299L9.67388 11.9112C10.2355 12.1946 10.9082 11.7348 10.8037 11.124L10.1963 7.71065L12.7629 5.29866C13.2265 4.86413 12.9718 4.10841 12.3318 4.02025H12.3449ZM9.44531 7.5721L10.1376 11.4703L6.50653 9.63142L2.87551 11.4703L3.56775 7.5721L0.635508 4.81374L4.69755 4.24696L6.51306 0.695103L8.32857 4.24696L12.3906 4.81374L9.45184 7.5721H9.44531ZM5.39633 9.85184L3.28041 10.8721L3.89428 7.40836L1.28204 4.95229L4.89347 4.44848L5.39633 3.46605';

  protected override willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('color') || changedProperties.has('difficulty')) {
      switch (this.difficulty) {
        case DifficultyEnum.Medium:
          this.path =
            'M12.3449 4.02024L8.79225 3.52273L7.20531 0.418008C6.91796 -0.136183 6.0951 -0.14248 5.80776 0.418008L4.22082 3.52273L0.668161 4.02024C0.0281607 4.10841 -0.226533 4.86413 0.237141 5.29866L2.80367 7.71065L2.19633 11.124C2.0853 11.7411 2.75796 12.2008 3.32612 11.9112L6.5 10.299L9.67388 11.9112C10.2355 12.1946 10.9082 11.7348 10.8037 11.124L10.1963 7.71065L12.7629 5.29866C13.2265 4.86413 12.9718 4.10841 12.3318 4.02024H12.3449ZM9.44531 7.5721L10.1376 11.4703L6.50653 9.63142L2.87551 11.4703L3.56775 7.5721L0.628978 4.81374L4.69102 4.24696L6.50653 0.695103L8.32204 4.24696L12.3841 4.81374L9.44531 7.5721ZM7.72776 9.85184L6.50653 9.23467L3.28041 10.8721L3.89429 7.40836L1.28204 4.95229L4.89347 4.44848L6.50653 1.29338L7.72776 3.51014';
          break;
        case DifficultyEnum.Hard:
          this.path =
            'M12.3449 4.02025L8.79225 3.52273L7.20531 0.418008C6.91796 -0.136183 6.0951 -0.14248 5.80776 0.418008L4.22082 3.52273L0.668161 4.02025C0.0281607 4.10841 -0.226533 4.86413 0.23714 5.29866L2.80367 7.71065L2.19632 11.124C2.0853 11.7411 2.75796 12.2009 3.32612 11.9112L6.5 10.299L9.67388 11.9112C10.2355 12.1946 10.9082 11.7348 10.8037 11.124L10.1963 7.71065L12.7629 5.29866C13.2265 4.86413 12.9718 4.10841 12.3318 4.02025H12.3449ZM9.44531 7.5721L10.1376 11.4703L6.50653 9.63142L2.87551 11.4703L3.56776 7.5721L0.628979 4.81374L4.69102 4.24696L6.50653 0.695103L8.32204 4.24696L12.3841 4.81374L9.44531 7.5721ZM9.11878 7.40836L9.73265 10.8721L6.50653 9.23467L3.28041 10.8721L3.89429 7.40836L1.28204 4.95229L4.89347 4.44848L6.50653 1.29338L8.11959 4.44848L11.731 4.95229L9.11878 7.40836Z';
          break;
        default:
          this.path =
            'M12.3449 4.02025L8.79225 3.52273L7.20531 0.418008C6.91796 -0.136183 6.0951 -0.14248 5.80775 0.418008L4.22082 3.52273L0.668161 4.02025C0.0281608 4.10841 -0.226533 4.86413 0.23714 5.29866L2.80367 7.71065L2.19632 11.124C2.0853 11.7411 2.75796 12.2009 3.32612 11.9112L6.5 10.299L9.67388 11.9112C10.2355 12.1946 10.9082 11.7348 10.8037 11.124L10.1963 7.71065L12.7629 5.29866C13.2265 4.86413 12.9718 4.10841 12.3318 4.02025H12.3449ZM9.44531 7.5721L10.1376 11.4703L6.50653 9.63142L2.87551 11.4703L3.56775 7.5721L0.635508 4.81374L4.69755 4.24696L6.51306 0.695103L8.32857 4.24696L12.3906 4.81374L9.45184 7.5721H9.44531ZM5.39633 9.85184L3.28041 10.8721L3.89428 7.40836L1.28204 4.95229L4.89347 4.44848L5.39633 3.46605';
          break;
      }
    }
  }

  protected override render() {
    return html`
      <svg
        width="${this.width}"
        height="${this.height}"
        viewBox="0 0 13 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="${this.path}" style="fill: ${getColorHex(this.color)}" />
      </svg>
    `;
  }
}

export default createComponent({
  tagName: NAME,
  elementClass: Star,
  react: React,
});
