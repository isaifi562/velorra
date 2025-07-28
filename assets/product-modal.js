if (!customElements.get('product-modal')) {
  class ProductModal extends ModalDialog {
    constructor() {
      super();
    }

    /**
     * @override
     */
    hide() {
      super.hide();
      document.activeElement.blur();
    }
  }
  customElements.define('product-modal', ProductModal);
}

if (!customElements.get('product-modal-opener')) {
  class ProductModalOpener extends ModalOpener {
    constructor() {
      super();

      this.type = this.getAttribute('data-type');
    }

    onButtonClick(button) {
      const productMedia =
        this.closest('main-product').querySelector('product-media');
      const mediaId = button.dataset.mediaId;
      const context_key = mediaId;
      const existingModal =
        productMedia.productModalHTML[context_key];

      if (existingModal) {
        document.body.appendChild(existingModal);
        super.onButtonClick(button);
        if (this.type === 'model') {
          window.ShopifyXR.setupXRElements();
        }
        return;
      }

      fetch(this.dataset.url)
        .then(response => response.text())
        .then(text => {
          const modal = new DOMParser()
            .parseFromString(text, 'text/html')
            .querySelector('product-modal');
          document.body.appendChild(modal);
          productMedia.productModalHTML[context_key] = modal;
          super.onButtonClick(button);
          if (this.type === 'model') {
            window.ShopifyXR.setupXRElements();
          }
          document
            .querySelector(this.getAttribute('data-modal'))
            .querySelector(
              'deferred-media:not([loaded="true"]) button, product-model:not([loaded="true"]) button'
            )
            ?.click();
        })
        .catch(error => console.log(error));
    }
  }

  customElements.define('product-modal-opener', ProductModalOpener);
}
