import * as React from 'react';
import { globalCss } from 'components/GlobalStyles';
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createComponent } from '@lit-labs/react';
import 'components/svg/PreviewCube';
import {
  DEFAULT_COLOR,
  DEFAULT_SELECTED_ADJACENT_COLOR,
  DEFAULT_SELECTED_COLOR,
} from 'components/pages/PuzzlePage';

export enum DifficultyEnum {
  Easy,
  Medium,
  Hard,
}

export enum ProgressEnum {
  ZeroPercent,
  TwentyFivePercent,
  SeventyFivePercent,
  Solved,
}

const NAME = 'ui-puzzle-preview';

@customElement(NAME)
export class UiPuzzlePreview extends LitElement {
  // Use container queries
  static styles = [
    globalCss,
    css`
      .container {
        min-width: 8.125rem;
        display: flex;
        justify-content: space-between;
        flex-direction: column;
        align-items: center;
        padding: 0.5rem;
        background-color: var(--terciary-bg);
        border-radius: 0.25rem;
        aspect-ratio: 1;
      }

      .title-container {
        display: flex;
        justify-content: space-between;
        width: 100%;
        text-align: right;
        font-style: italic;
      }

      .info-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
      }
    `,
  ];

  @property({ type: String })
  public title = '';

  @property({ type: String })
  public author = '';

  @property({ type: String })
  public date = '';

  @property({ type: String })
  public isAiAssisted = true;

  @property({ type: String })
  public difficulty: DifficultyEnum = DifficultyEnum.Easy;

  @property({ type: String })
  public previewState: ProgressEnum = ProgressEnum.ZeroPercent;

  @property({ type: Array })
  public colors: [number, number, number] = [
    DEFAULT_COLOR,
    DEFAULT_SELECTED_COLOR,
    DEFAULT_SELECTED_ADJACENT_COLOR,
  ];

  protected override render() {
    return html`
      <div class="container">
        <div class="title-container">
          star
          <span>${this.title}</span>
        </div>
        <ui-preview-cube
          .progress=${this.previewState}
          .difficulty=${this.difficulty}
        ></ui-preview-cube>
        <div class="info-container">
          <span>${this.date}</span>
          <span>${this.author}</span>
          ${this.isAiAssisted &&
          html`<div><span class="bold text-2xl">ai</span>&nbsp;assisted</div>`}
        </div>
      </div>
    `;
  }
}

export default createComponent({
  tagName: NAME,
  elementClass: UiPuzzlePreview,
  react: React,
  events: {
    onClick: 'click',
  },
});
