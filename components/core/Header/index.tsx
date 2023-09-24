import * as React from 'react';

import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createComponent } from '@lit-labs/react';

import 'components/svg/MainLogo';

@customElement('ui-header')
export class UiHeader extends LitElement {
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
        Hello!
        <main-logo></main-logo>
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
