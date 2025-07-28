if (!customElements.get('localization-dropdown')) {
  class LocalizationDropdown extends customElements.get(
    'dropdown-disclosure'
  ) {
    constructor() {
      super();
      this.id = this.getAttribute('id');
      this.summaryElement = this.querySelector('summary');
      this.detailsElement = this.summaryElement.parentNode;
      this.closeButtons = this.querySelectorAll('[data-close]');
      this.placement = this.getAttribute('data-placement');
      this.mobileMediaQuery = window.matchMedia(
        'screen and (max-width: 989px)'
      );
    }

    get isOpen() {
      return this.detailsElement.hasAttribute('open');
    }

    /**
     * @override
     * @param {Event} event
     * @param {HTMLElement} summaryElement
     * @param {HTMLDetailsElement} detailsElement
     * @returns
     */
    close(event, summaryElement, detailsElement) {
      if (event === undefined) return;

      detailsElement.classList.remove('is-open');
      removeTrapFocus(summaryElement);
      detailsElement.removeAttribute('open');
      if (this.placement === 'footer') {
        bodyScroll.unlock(summaryElement.nextElementSibling);
      }
    }

    /**
     * @override
     * @param {Event} event
     */
    onSummaryClick(event) {
      const shouldLockBodyScroll =
        this.placement === 'footer' && this.mobileMediaQuery.matches;

      if (this.isOpen) {
        if (shouldLockBodyScroll) {
          bodyScroll.unlock(this.summaryElement.nextElementSibling);
        }
        return removeTrapFocus(this.summaryElement);
      }

      if (shouldLockBodyScroll) {
        bodyScroll.lock(this.summaryElement.nextElementSibling);
      }
      trapFocus(this.detailsElement, this.summaryElement);
    }

    onDocumentClick(event) {
      const isOpen = this.isOpen;

      if (!isOpen || event.target.closest(`#${this.id}`)) return;

      if (isOpen) {
        this.close(event, this.summaryElement, this.detailsElement);
      }
    }

    onCloseButtonClick(event) {
      this.close(event, this.summaryElement, this.detailsElement);
    }

    connectedCallback() {
      super.connectedCallback();

      this.addEventListener('change', () =>
        this.closest('form')?.submit()
      );

      document.addEventListener(
        'click',
        this.onDocumentClick.bind(this)
      );

      this.closeButtons?.forEach(close => {
        close.addEventListener('click', event =>
          this.onCloseButtonClick(event)
        );
      });
    }

    disconnectedCallback() {
      document.removeEventListener('click', this.onDocumentClick);
    }
  }
  customElements.define(
    'localization-dropdown',
    LocalizationDropdown
  );
}
