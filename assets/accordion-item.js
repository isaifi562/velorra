if (!customElements.get('accordion-item')) {
  class AccordionItem extends customElements.get(
    'dropdown-disclosure'
  ) {
    constructor() {
      super();
    }

    connectedCallback() {
      setTimeout(() => {
        if (!this.hasAttribute('data-expanded')) {
          this.querySelector('details').open = false;
        }
        this.init();
      });
    }
  }

  customElements.define('accordion-item', AccordionItem);
}
