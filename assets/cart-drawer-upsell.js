(() => {
  if (customElements.get('cart-drawer-upsell')) {
    return;
  }

  class CartDrawerUpsell extends HTMLElement {
    constructor() {
      super();
      this.selectors = {
        variantSelect: '[data-select]',
        variantsData: '[type="application/json"]',
        variantInput: '[name="id"]',
        priceElement: '[data-price]'
      };

      this.cartDrawer = null;
      this.form = null;
      this.submitButton = null;
      this.variants = null;
      this.variantSelects = null;
      this.currentVariant = null;
      this.options = null;
    }

    connectedCallback() {
      this.cartDrawer = this.closest('cart-drawer');
      this.form = this.querySelector('form');
      this.submitButton = this.form.elements.add;
      this.variants = JSON.parse(
        this.querySelector(this.selectors.variantsData)?.innerText
      );
      this.updateOptions();
      this.updateVariant();
      this.setHandlers();
      this.updateVariantInputId();
    }

    updateVariantInputId() {
      this.form.querySelector(this.selectors.variantInput).value =
        this.currentVariant.id;
    }

    updateOptions() {
      this.options = Array.from(
        this.querySelectorAll(this.selectors.variantSelect),
        select => ({
          name: select.dataset.name,
          value: select.value
        })
      );
    }

    updateVariant() {
      this.currentVariant = this.options.length
        ? this.variants.find(variant => {
            return !variant.options
              .map(
                (option, index) =>
                  this.options[index].value === option
              )
              .includes(false);
          })
        : this.variants[0];
    }

    setHandlers() {
      this.form.addEventListener('submit', event => {
        this.cartDrawer.onCartAdd(event);
      });

      this.querySelectorAll(this.selectors.variantSelect).forEach(
        select => {
          select.addEventListener(
            'change',
            this.onVariantChange.bind(this)
          );
        }
      );
    }

    onVariantChange(event) {
      this.updateOptions();
      this.updateVariant();
      this.toggleAddButton(false, '');

      if (!this.currentVariant) {
        this.toggleAddButton(true, '');
        this.setUnavailable();

        return;
      }

      if (!this.currentVariant.available)
        this.toggleAddButton(true, window.variantStrings.soldOut);

      this.updateVariantInputId();
      this.updateProductInfo();
    }

    setUnavailable() {
      if (!this.submitButton) return;
      this.submitButton.querySelector('span').textContent =
        window.variantStrings.unavailable;
    }

    toggleAddButton(disable, text) {
      if (disable) {
        this.submitButton &&
          this.submitButton.setAttribute('disabled', 'disabled');
        if (text)
          this.submitButton &&
            (this.submitButton.querySelector('span').textContent =
              text);
      } else {
        this.submitButton &&
          this.submitButton.removeAttribute('disabled');
        this.submitButton &&
          (this.submitButton.querySelector('span').textContent =
            window.variantStrings.addToCartShort);
      }
    }

    updateProductInfo() {
      fetch(`${this.dataset.url}&variant=${this.currentVariant.id}`)
        .then(response => response.text())
        .then(responseText => {
          const html = new DOMParser().parseFromString(
            responseText,
            'text/html'
          );
          const source = html.querySelector(
            this.selectors.priceElement
          );
          const destination = this.querySelector(
            this.selectors.priceElement
          );
          if (!source && !destination) return;
          destination.innerHTML = source.innerHTML;
        });
    }
  }

  customElements.define('cart-drawer-upsell', CartDrawerUpsell);
})();
