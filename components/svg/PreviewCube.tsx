import React from 'react';

import { createComponent } from '@lit-labs/react';
import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import memoizeOne from 'memoize-one';

const getColorHex = memoizeOne(
  (color: number) => `#${color.toString(16).padStart(6, '0')}`
);

const twentyFivePercentIndices = [5, 8, 11, 15, 12, 13, 14, 18];
const seventyFivePercentIndices = [
  ...twentyFivePercentIndices,
  3,
  6,
  0,
  9,
  10,
  7,
  17,
  20,
  21,
  22,
  23,
];

export enum ProgressEnum {
  ZeroPercent,
  TwentyFivePercent,
  SeventyFivePercent,
  Solved,
}

@customElement('ui-preview-cube')
export class PreviewCube extends LitElement {
  @property({ type: Number })
  public width = 65;

  @property({ type: Number })
  public height = 54;

  @property({ type: Array })
  public colors: [number, number, number] = [0x829b9e, 0x1fbe68, 0xd1a227];

  @property({ type: String })
  public progress: ProgressEnum = ProgressEnum.ZeroPercent;

  @state()
  private colorsHexValues: string[] = this.colors.map(getColorHex);

  // Update the colorHexValues when the color numbers change
  protected override willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('colors') || changedProperties.has('progress')) {
      switch (this.progress) {
        case ProgressEnum.ZeroPercent:
          this.colorsHexValues = Array.from({ length: 24 }, (_, i) =>
            getColorHex(this.colors[0])
          );
          break;
        case ProgressEnum.TwentyFivePercent:
          this.colorsHexValues = Array.from({ length: 24 }, (_, i) => {
            const index = twentyFivePercentIndices.includes(i) ? 1 : 0;
            return getColorHex(this.colors[index]);
          });
          break;
        case ProgressEnum.SeventyFivePercent:
          this.colorsHexValues = Array.from({ length: 24 }, (_, i) => {
            const index = seventyFivePercentIndices.includes(i) ? 1 : 0;
            return getColorHex(this.colors[index]);
          });
          break;
        case ProgressEnum.Solved:
          this.colorsHexValues = Array.from({ length: 24 }, () =>
            getColorHex(this.colors[2])
          );
          break;
        default:
          this.colorsHexValues = Array.from({ length: 24 }, () =>
            getColorHex(this.colors[0])
          );
      }
    }
  }

  protected override render() {
    return html`
      <svg
        width="${this.width}"
        height="${this.height}"
        viewBox="0 0 ${this.width} ${this.height}"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 6.92067L32.005 0V53.8439L0 46.9232V6.92067Z"
          fill="#100F0F"
        />
        <path
          d="M0.656982 36.7177L6.54029 37.3351V47.1604L0.656982 45.9551V36.7177Z"
          style="fill: ${this.colorsHexValues[0]}"
        />
        <path
          d="M0.656982 27.1047L6.54029 27.1196V36.9399L0.656982 36.3471V27.1047Z"
          style="fill: ${this.colorsHexValues[1]}"
        />
        <path
          d="M0.656982 17.4968L6.54029 16.904V26.7243L0.656982 26.7391V17.4968Z"
          style="fill: ${this.colorsHexValues[2]}"
        />
        <path
          d="M6.79224 37.3597L13.5005 38.0661V48.578L6.79224 47.2097V37.3597Z"
          style="fill: ${this.colorsHexValues[3]}"
        />
        <path
          d="M6.79224 27.1195L13.5005 27.1343V37.6462L6.79224 36.9695V27.1195Z"
          style="fill: ${this.colorsHexValues[4]}"
        />
        <path
          d="M6.79224 6.63407L13.5005 5.26575V15.7777L6.79224 16.484V6.63407Z"
          style="fill: ${this.colorsHexValues[5]}"
        />
        <path
          d="M13.787 38.0958L21.5128 38.9109V50.2181L13.787 48.6374V38.0958Z"
          style="fill: ${this.colorsHexValues[6]}"
        />
        <path
          d="M13.787 16.168L21.5128 15.3875V26.6947L13.787 26.7095V16.168Z"
          style="fill: ${this.colorsHexValues[7]}"
        />
        <path
          d="M13.787 5.20659L21.5128 3.62585V14.9331L13.787 15.7481V5.20659Z"
          style="fill: ${this.colorsHexValues[8]}"
        />
        <path
          d="M21.8438 27.1492L30.8342 27.1689V39.3999L21.8438 38.491V27.1492Z"
          style="fill: ${this.colorsHexValues[9]}"
        />
        <path
          d="M21.8438 15.353L30.8342 14.444V26.675L21.8438 26.6947V15.353Z"
          style="fill: ${this.colorsHexValues[10]}"
        />
        <path
          d="M21.8438 3.55667L30.8342 1.724V13.955L21.8438 14.8985V3.55667Z"
          style="fill: ${this.colorsHexValues[11]}"
        />
        <path
          d="M64.1039 46.9232L32.0989 53.8439V0L64.1039 6.92067V46.9232Z"
          fill="#100F0F"
        />
        <path
          d="M63.4469 45.9551L57.5636 47.1604V37.3351L63.4469 36.7177V45.9551Z"
          style="fill: ${this.colorsHexValues[12]}"
        />
        <path
          d="M63.4469 36.3471L57.5636 36.9399V27.1196L63.4469 27.1047V36.3471Z"
          style="fill: ${this.colorsHexValues[13]}"
        />
        <path
          d="M63.4469 26.7391L57.5636 26.7243V16.904L63.4469 17.4968V26.7391Z"
          style="fill: ${this.colorsHexValues[14]}"
        />
        <path
          d="M57.3166 47.2097L50.6083 48.578V38.0661L57.3166 37.3597V47.2097Z"
          style="fill: ${this.colorsHexValues[15]}"
        />
        <path
          d="M57.3166 36.9695L50.6083 37.6462V27.1343L57.3166 27.1195V36.9695Z"
          style="fill: ${this.colorsHexValues[16]}"
        />
        <path
          d="M57.3166 16.484L50.6083 15.7777V5.26575L57.3166 6.63407V16.484Z"
          style="fill: ${this.colorsHexValues[17]}"
        />
        <path
          d="M50.3169 48.6374L42.596 50.2181V38.9109L50.3169 38.0958V48.6374Z"
          style="fill: ${this.colorsHexValues[18]}"
        />
        <path
          d="M50.3169 26.7095L42.596 26.6947V15.3875L50.3169 16.168V26.7095Z"
          style="fill: ${this.colorsHexValues[19]}"
        />
        <path
          d="M50.3169 15.7481L42.596 14.9331V3.62585L50.3169 5.20659V15.7481Z"
          style="fill: ${this.colorsHexValues[20]}"
        />
        <path
          d="M42.26 38.491L33.2745 39.3999V27.1689L42.26 27.1492V38.491Z"
          style="fill: ${this.colorsHexValues[21]}"
        />
        <path
          d="M42.26 26.6947L33.2745 26.675V14.444L42.26 15.353V26.6947Z"
          style="fill: ${this.colorsHexValues[22]}"
        />
        <path
          d="M42.26 14.8985L33.2745 13.955V1.724L42.26 3.55667V14.8985Z"
          style="fill: ${this.colorsHexValues[23]}"
        />
        <path
          d="M64.1039 46.9232L32.0989 53.8439V0L64.1039 6.92067V46.9232Z"
          fill="#100F0F"
          fill-opacity="0.5"
        />
      </svg>
    `;
  }
}

export default createComponent({
  tagName: 'ui-preview-cube',
  elementClass: PreviewCube,
  react: React,
});
