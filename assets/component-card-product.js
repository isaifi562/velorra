if (!customElements.get('card-product')) {
  class CardProduct extends HTMLElement {
    constructor() {
      super();

      this.moneyFormat = this.dataset.moneyFormat;
      this.quickviewModalsHTML = {};
      this.variants = JSON.parse(
        this.querySelector('[type="application/json"][data-variants]')
          .textContent
      );
      this.variantsImages = JSON.parse(
        this.querySelector(
          '[type="application/json"][data-variants-images]'
        ).textContent
      );
      this.variantsInventory = JSON.parse(
        this.querySelector(
          '[type="application/json"][data-variants-quantity]'
        ).textContent
      );

      this.quickBuy = this.querySelector('[data-quickbuy-wrapper]');
      this.quickBuyOptions = this.quickBuy?.querySelectorAll(
        'button[data-option]'
      );
      this.quickBuyButton = this.quickBuy?.querySelector(
        'form [type="submit"]'
      );
      this.lowQuantityLimit = this.hasAttribute(
        'data-low-quantity-limit'
      )
        ? Number(this.getAttribute('data-low-quantity-limit'))
        : null;
      this.quickBuySlider;

      this.swatches = this.querySelectorAll('[data-swatch]');
      this.swatchesPosition = this.getAttribute(
        'data-swatch-option-index'
      );

      this.swatches.forEach(swatch => {
        swatch.addEventListener(
          'change',
          this.onSwatchChange.bind(this)
        );
      });
      this.activeVariant = this.variants?.find(
        variant => variant.id === Number(this.dataset.activeVariantId)
      );
      this.filterColors();
    }

    selectors = {
      saleBadge: '.js-sale-badge'
    };
    saleBadge = {};

    connectedCallback() {
      this.saleBadge.el = this.querySelector(
        this.selectors.saleBadge
      );
      this.saleBadge.type = this.saleBadge.el?.getAttribute(
        'data-sale-badge-type'
      );
      this.saleBadge.text = this.saleBadge.el?.getAttribute(
        'data-sale-badge-text'
      );

      if (this.quickBuy) {
        this.cartDrawer = document.querySelector('cart-drawer');

        this.initQuickBuy();
      }
    }

    handleAddToCart(e) {
      e.preventDefault();
      this.quickBuy.classList.add('is-loading');
      const active_swatch = [...this.swatches].filter(
        swatch => swatch.checked
      )[0];
      const swatchOptionName = `option${this.dataset.swatchOptionIndex}`;
      const QuickBuyOptionName = `option${e.target.dataset.option}`;

      const activeVariant =
        this.variants.length == 1
          ? this.variants[0]
          : this.variants.find(variant => {
              if (active_swatch) {
                return (
                  variant[swatchOptionName] === active_swatch.value &&
                  variant[QuickBuyOptionName] ===
                    e.target.dataset.value
                );
              }

              return (
                variant[QuickBuyOptionName] === e.target.dataset.value
              );
            });

      this.form = this.quickBuy.querySelector('.js-quickbuy-form');

      if (!this.form || !activeVariant) {
        return;
      }

      this.form.querySelector('[name="id"]').value = activeVariant.id;
      this.onSubmitHandler();
    }

    cartSubmitHandler() {
      this.submitButton.classList.add('disabled');
      const sectionsToRender = [
        {
          id: '#cart-counter',
          section: 'cart-counter',
          selector: '#shopify-section-cart-counter'
        },
        {
          id: '#main-cart',
          section: 'main-cart',
          selector: '#main-cart'
        }
      ];

      addToCart(
        this.form,
        sectionsToRender.map(section => section.section)
      )
        .then(response => {
          if (response.status) {
            this.handleErrorMessage(response.description);
            return;
          }

          this.handleErrorMessage();

          if (window.location.pathname !== routes.cart_url) {
            window.location.href = routes.cart_url;
            return;
          }

          if (!response?.sections['main-cart']) {
            location.reload();
          }
          sectionsToRender.map(section => {
            const sectionToGet = section.section;
            if (!response?.sections[sectionToGet]) return;

            const source = new DOMParser().parseFromString(
              response.sections[sectionToGet],
              'text/html'
            );

            if (!source) return;

            const target = source.querySelector(section.selector);
            const destination = document.querySelector(section.id);

            if (!target || !destination) return;

            destination.innerHTML = target.innerHTML;
          });

          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        })
        .catch(error => {
          console.error(error);
        })
        .finally(() => {
          this.quickBuy.classList.remove('is-loading');
        });
    }

    defaultSubmitHandler() {
      addToCart(
        this.form,
        this.cartDrawer
          .getSectionsToRender()
          .map(section => section.section)
      )
        .then(response => {
          if (response.status) {
            this.recipientForm?.displayErrorMessage(response.errors);
            this.handleErrorMessage(response.description);
            return;
          }

          this.handleErrorMessage();

          if (this.isQuickviewSelector) {
            const quickviewModal = this.closest('modal-dialog');
            quickviewModal.hide();
          }
          this.cartDrawer.renderContents(response);
        })
        .catch(error => {
          console.error(error);
        })
        .finally(() => {
          this.quickBuy.classList.remove('is-loading');
        });
    }

    onSubmitHandler() {
      if (
        window.location.pathname === routes.cart_url ||
        !this.cartDrawer
      )
        return this.cartSubmitHandler();
      if (this.cartDrawer) return this.defaultSubmitHandler();
    }

    handleErrorMessage(errorMessage = false) {
      const errorWrapper = this.querySelector('[data-error-wrapper]');
      if (!errorWrapper) return;
      errorWrapper.classList.toggle('hidden', !errorMessage);

      if (typeof errorMessage === 'object') return;

      errorWrapper.textContent = errorMessage || '';
    }

    initQuickBuy() {
      this.quickBuyOptions.forEach(option => {
        option.addEventListener(
          'click',
          this.handleAddToCart.bind(this)
        );
      });
      if (this.quickBuyButton) {
        this.quickBuyButton.addEventListener(
          'click',
          this.handleAddToCart.bind(this)
        );
      }
      this.updateQuickBuyAvailability(this.swatches[0]);
    }

    updateQuickBuyAvailability(targetSwatch) {
      if (!this.quickBuy || !targetSwatch) {
        return;
      }

      const swatchVariants = this.variants.filter(variant => {
        return (
          variant[`option${this.dataset.swatchOptionIndex}`] ===
          targetSwatch?.value
        );
      });

      if (swatchVariants.length === 1 && this.quickBuyButton) {
        const isFirstSwatchAvailable = swatchVariants[0].available;
        this.quickBuyButton.toggleAttribute(
          'disabled',
          !isFirstSwatchAvailable
        );
        this.quickBuyButton.querySelector('span').innerText =
          this.quickBuyButton.getAttribute(
            isFirstSwatchAvailable
              ? 'data-atc-string'
              : 'data-sold-out-string'
          );
      }

      this.quickBuyOptions.forEach(option => {
        const variant =
          swatchVariants.length === 1 &&
          this.quickBuyOptions.length === 1
            ? swatchVariants[0]
            : swatchVariants.find(
                variant =>
                  variant[
                    `option${option.getAttribute('data-option')}`
                  ] === option.getAttribute('data-value')
              );

        const inventory = variant
          ? this.variantsInventory[variant.id]
          : undefined;

        this.validateInventory(variant, option, inventory);

        option.toggleAttribute(
          'disabled',
          !variant || !variant.available
        );
      });
    }

    validateInventory(variant, option, inventory) {
      if (!option) {
        return;
      }

      if (
        !inventory ||
        inventory.management !== 'shopify' ||
        inventory.policy !== 'deny' ||
        !this.lowQuantityLimit ||
        inventory.quantity > this.lowQuantityLimit ||
        inventory.quantity <= 0
      ) {
        option.removeAttribute('data-last-units');
      } else if (variant && variant.available) {
        option.setAttribute('data-last-units', true);
      }
    }

    onSwatchChange(event) {
      const activeVariant = this.variants.find(
        variant =>
          variant[`option${this.dataset.swatchOptionIndex}`] ===
          event.target.value
      );
      this.activeVariant = activeVariant;
      this.updateAssets(activeVariant);
      this.updateQuickBuyAvailability(event.target);
    }

    updateAssets(activeVariant) {
      this.updateMedia(activeVariant);
      this.updateLinks(activeVariant);
      this.updateSaleBadge(activeVariant);
    }

    updateMedia(activeVariant) {
      const media = this.querySelector('[data-media]');
      const primaryImage = this.querySelector('[data-image-primary]');
      const variantImage = this.variantsImages.find(
        variant => variant.id === activeVariant.id
      );

      if (!primaryImage || !variantImage) return;

      media.classList.add('is-loading');
      debounce(() => {
        primaryImage.src = variantImage.image.src;
        primaryImage.srcset = variantImage.image.srcset;
        primaryImage.onload = () => {
          media.classList.add('is-changed');
          media.classList.remove('is-loading');
        };
      }, 300)();
    }

    updateLinks(activeVariant) {
      const links = this.querySelectorAll('[data-url]');

      links.forEach(link => {
        link.setAttribute(
          link.hasAttribute('href') ? 'href' : 'data-url',
          `${this.dataset.productUrl}?variant=${activeVariant.id}`
        );
      });
    }

    filterColors() {
      this.swatches.forEach(swatch => {
        const hasAvailableVariants = this.variants.some(
          variant =>
            variant[`option${this.swatchesPosition}`] ===
              swatch.value && variant.available
        );

        swatch.classList.toggle(
          'is-unavailable',
          !hasAvailableVariants
        );
      });
    }

    updateSaleBadge(activeVariant) {
      if (!this.saleBadge.el || this.saleBadgeType === 'disabled')
        return;

      const { compare_at_price, price } = activeVariant;

      if (!compare_at_price) {
        return this.saleBadge.el.classList.add('hidden');
      }

      if (this.saleBadge.type === 'percent') {
        this.saleBadge.el.innerHTML =
          this.saleBadge.text +
          ` -${Math.ceil(
            ((compare_at_price - price) / compare_at_price) * 100
          )}%`;
      } else if (this.saleBadge.type === 'flat') {
        const formattedPrice = Shopify.formatMoney(
          compare_at_price - price,
          this.moneyFormat
        );
        this.saleBadge.el.innerHTML =
          this.saleBadge.text + ` -${formattedPrice}`;
      }
      this.saleBadge.el.classList.remove('hidden');
    }
  }

  customElements.define('card-product', CardProduct);
}

if (!customElements.get('quickview-opener')) {
  class QuickviewOpener extends ModalOpener {
    constructor() {
      super();
    }

    onButtonClick(button) {
      const productCard = this.closest('card-product');
      const existingModal =
        productCard.quickviewModalsHTML[productCard.activeVariant.id];

      button.classList.add('is-loading');

      if (existingModal) {
        document.body.appendChild(existingModal);
        setTimeout(() => {
          super.onButtonClick(button);
          button.classList.remove('is-loading');
        }, 300);
        return;
      }

      const productUrl = button.getAttribute('data-url');
      const fetchUrl = `${productUrl}${
        productUrl.includes('?') ? '&' : '?'
      }section_id=quickview`;

      fetch(fetchUrl)
        .then(response => response.text())
        .then(text => {
          const modal = new DOMParser()
            .parseFromString(text, 'text/html')
            .querySelector('template')
            .content.firstElementChild.cloneNode(true);
          productCard.quickviewModalsHTML[
            productCard.activeVariant.id
          ] = modal;

          // Avoid mozilla not initializing scripts
          modal.querySelectorAll('script').forEach(sciprtTag => {
            const scriptElement = document.createElement('script');
            scriptElement.src = sciprtTag.src;
            document.body.appendChild(scriptElement);
          });

          document.body.appendChild(modal);
          setTimeout(() => {
            super.onButtonClick(button);
            button.classList.remove('is-loading');
            Shopify?.PaymentButton?.init();
          }, 300);
        })
        .catch(error => console.log(error));
    }
  }

  customElements.define('quickview-opener', QuickviewOpener);
}
