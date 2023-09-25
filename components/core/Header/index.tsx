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
        grid-template-columns: auto 1fr auto;
        align-items: center;
      }

      .close-button {
        width: 18px;
        grid-column: 1 / 2;
      }

      .logo {
        grid-column: 2 / 3;
      }

      .question {
        grid-column: 3 / 4;
        justify-self: end;
      }
    `,
  ];

  @property({ type: Boolean })
  public showCloseButton = false;

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
      <div class="container" @click=${this.handleMenuPressed}>
        <div class="close-button">
          ${this.showCloseButton
            ? html`<icon-x></icon-x>`
            : html`<icon-hamburger></icon-hamburger>`}
        </div>
        <main-logo class="logo"></main-logo>
        <icon-question class="question"></icon-question>
      </div>
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
