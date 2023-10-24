'use client';

import * as React from 'react';

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createComponent } from '@lit-labs/react';

import 'components/svg/MainLogo';
import 'components/svg/IconHamburger';
import 'components/svg/IconQuestion';
import 'components/svg/IconX';

import { globalCss } from 'components/GlobalStyles';

@customElement('ui-header')
export class UiHeader extends LitElement {
  static styles = [
    globalCss,
    css`
      .container {
        display: grid;
        width: 100%;
        grid-gap: 0.75rem;
        grid-template-columns: auto min-content 1fr auto;
        align-items: center;
      }

      .close-button {
        width: 18px;
        grid-column: 1 / 2;
      }

      .logo {
        grid-column: 2 / 3;
      }

      .center-label {
        grid-column: 3 / 4;
        justify-self: center;
      }

      .question {
        grid-column: 4 / 5;
        justify-self: end;
      }
    `,
  ];

  @property({ type: Boolean })
  public showCloseButton = false;

  @property({ type: String })
  public centerLabel = '';

  public handleMenuPressed(): void {
    const menuPressedEvent = new CustomEvent('menuPressed', {
      // detail: { value: 'Menu Pressed!' },
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    const applyDefault = this.dispatchEvent(menuPressedEvent);
    if (!applyDefault) {
      console.log('Default behavior was prevented.');
    }
  }

  protected override render() {
    return html`
      <nav class="container" @click=${this.handleMenuPressed}>
        <div class="close-button">
          ${this.showCloseButton
            ? html`<icon-x .width=${20} .height=${20}></icon-x>`
            : html`<icon-hamburger
                .width=${20}
                .height=${25}
              ></icon-hamburger>`}
        </div>
        <main-logo .width=${140} .height=${25} class="logo"></main-logo>
        ${this.centerLabel != null && this.centerLabel.length > 0
          ? html`<div class="center-label">${this.centerLabel}</div>`
          : null}
        <icon-question
          .width=${25}
          .height=${25}
          class="question"
        ></icon-question>
      </nav>
    `;
  }
}

export default createComponent({
  tagName: 'ui-header',
  elementClass: UiHeader,
  react: React,
  events: {
    onMenuPressed: 'menuPressed',
  },
});
