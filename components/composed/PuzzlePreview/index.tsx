'use client';

import * as React from 'react';
import { globalCss } from 'components/GlobalStyles';
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createComponent } from '@lit-labs/react';
import 'components/svg/PreviewCube';
import 'components/svg/IconStar';
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

      @media (max-width: 400px) {
        .container {
          min-width: 9.8rem;
        }

        .title-container .text-sm,
        .info-container .text-sm {
          font-size: 0.75rem;
        }
      }

      .cube-container {
        margin: 0.25rem 0;
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

      .ai-container {
        background-color: var(--ai-bg);
        border-radius: 0.25rem;
        padding: 0.05rem 0.25rem;
        margin-top: 0.25rem;
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
        <header class="title-container">
          <icon-star
            .difficulty=${this.difficulty}
            .color=${this.previewState === ProgressEnum.Solved
              ? 0xd1a227
              : DEFAULT_SELECTED_ADJACENT_COLOR}
          ></icon-star>
          <span class="text-sm"
            >${this.previewState === ProgressEnum.Solved
              ? '🎉'
              : ''}&nbsp;${this.title}</span
          >
        </header>
        <section class="cube-container">
          <ui-preview-cube .progress=${this.previewState}></ui-preview-cube>
        </section>
        <footer class="info-container">
          <span class="text-sm semi">${this.date}</span>
          <span class="text-sm capital">${this.author}</span>
          ${this.isAiAssisted === true
            ? html`<div class="ai-container dim text-sm italic">
                <span class="semi text-sm italic">ai</span>&nbsp;assisted
              </div>`
            : null}
        </footer>
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
