import * as React from 'react';
import { globalCss } from 'components/GlobalStyles';
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createComponent } from '@lit-labs/react';
import {
  DEFAULT_COLOR,
  DEFAULT_SELECTED_ADJACENT_COLOR,
  DEFAULT_SELECTED_COLOR,
} from 'components/pages/PuzzlePage';

enum DifficultyEnum {
  Easy,
  Medium,
  Hard,
}

enum PreviewState {
  NotStarted,
  InProgress,
  Solved,
}

@customElement('ui-puzzle-preview')
export class UiPuzzlePreview extends LitElement {
  static styles = [
    globalCss,
    css`
      .container {
        display: flex;
        flex-direction: column;
        padding: 0.5rem;
        background-color: var(--color-background);
        border-radius: 0.125rem;
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
  public previewState: PreviewState = PreviewState.NotStarted;

  @property({ type: Array })
  public colors: [number, number, number] = [
    DEFAULT_COLOR,
    DEFAULT_SELECTED_COLOR,
    DEFAULT_SELECTED_ADJACENT_COLOR,
  ];

  protected override render() {
    return html`
      <div class="container">
        <div>
          star
          <span>${this.title}</span>
        </div>
        <div>cube</div>
        <div>
          <span>${this.date}</span>
          <span>${this.author}</span>
          <div><span class="bold">ai</span>&nbsp;assisted</div>
        </div>
      </div>
    `;
  }
}
