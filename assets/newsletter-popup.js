class NewsletterPopup extends ModalDialog {
  constructor() {
    super();
    this.delay = this.dataset.delay * 1000;
    this.closed = getCookie('newsletter-closed');
    this.subscribed = getCookie('newsletter-subscribed');

    this.form = this.querySelector('.js-form');

    if (!!this.form) {
      this.form.addEventListener(
        'submit',
        this.onSubscribe.bind(this)
      );
    }

    if (Shopify.designMode) {
      window.addEventListener('shopify:section:load', e => {
        if (e.target.contains(this)) {
          if (this.dataset.openInDesignMode === 'true') {
            this.show();
            return;
          }

          this.hide();
        }
      });
    }
  }

  connectedCallback() {
    if (!Shopify.designMode) {
      setTimeout(() => {
        if (this.closed !== null || this.subscribed !== null) return;

        this.show();
      }, this.delay);
    }
  }

  hide() {
    super.hide();
    setCookie('newsletter-closed', 'true', false, true);
  }

  onSubscribe() {
    setCookie('newsletter-subscribed', 'true', false, true);
    this.hide();
  }
}

customElements.define('newsletter-popup', NewsletterPopup);
