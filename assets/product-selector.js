if (!customElements.get('product-selector')) {
  class ProductSelector extends HTMLElement {
    constructor() {
      super();

      this.contactModal = document.querySelector(
        `#Modal-Product-Contact-${this.getAttribute(
          'data-product-id'
        )}-${this.getAttribute('data-section-id')}`
      );
      this.isQuickviewSelector = !!this.closest('product-quickview');
      this.productBar = document.querySelector('product-bar');
      this.cartDrawer = document.querySelector('cart-drawer');
      this.mainProduct = this.closest('main-product');
      this.enableScroll = this.hasAttribute('data-scroll-to-variant');
      this.variants = JSON.parse(
        this.querySelector('[type="application/json"]').textContent
      );
      this.availableVariants = this.variants.filter(
        variant => variant.available
      );
      this.addEventListener('change', this.onVariantChange);

      this.updateOptions();
    }

    connectedCallback() {
      const urlParams = new URLSearchParams(window.location.search);

      this.form = document.querySelector(this.dataset.formId);
      this.recipientForm =
        this.mainProduct?.querySelector('form-recipient');
      this.quantity = this.form.elements.quantity;

      this.installmentsForms = [
        document.querySelector(
          this.getAttribute('data-installments-form-id-title')
        ),
        document.querySelector(
          this.getAttribute('data-installments-form-id-price')
        )
      ];

      this.installmentsForm = document.querySelector(
        this.getAttribute('data-installments-form-id-title')
      );
      this.submitButton = this.form.elements.add;
      this.customFields = document.querySelectorAll(
        `[custom-field="${this.dataset.formId}"]`
      );
      this.unavailableText = ` - ${window.variantStrings.unavailable}`;

      this.form.addEventListener(
        'submit',
        this.onSubmitHandler.bind(this)
      );

      if (this.quantity) {
        this.quantity.addEventListener(
          'change',
          this.onQuantityChange.bind(this)
        );
      }

      this.setUnavailableOptions();

      if (this.isQuickviewSelector || !urlParams.has('variant'))
        return;

      this.updateOptions();
      this.updateVariant();
      this.updateMedia({});
    }

    onQuantityChange(event) {
      const productBarQuantity = this.productBar?.querySelector(
        '[name="quantity"]'
      );
      if (productBarQuantity) {
        productBarQuantity.value = event.target.value;
      }
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

          if (this.isQuickviewSelector) {
            const quickviewModal = this.closest('modal-dialog');
            quickviewModal.hide();
          }

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
          this.submitButton.classList.remove('disabled');
        });
    }

    defaultSubmitHandler() {
      this.submitButton.classList.add('disabled');

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
          this.submitButton.classList.remove('disabled');
        });
    }

    onSubmitHandler(event) {
      event.preventDefault();

      if (!this.areCustomFieldsValid()) {
        return;
      }

      if (
        window.location.pathname == routes.cart_url ||
        !this.cartDrawer
      )
        return this.cartSubmitHandler();
      if (this.cartDrawer) return this.defaultSubmitHandler();
    }

    areCustomFieldsValid() {
      this.customFields.forEach(fieldWrapper => {
        this.handleCustomFieldError(
          fieldWrapper.querySelector('.js-field-wrapper')
        );
      });

      if (!this.customFields.length) {
        return true;
      }

      return [...this.customFields].every(fieldWrapper => {
        const field = fieldWrapper.querySelector('input, textarea');

        return !field || field.validity.valid;
      });
    }

    handleCustomFieldError(fieldWrapper) {
      const input = fieldWrapper?.querySelector('input, textarea');

      if (!input) return;
      input.setAttribute('aria-invalid', !input.validity.valid);
      const field = input.closest('.js-field-wrapper');

      if (!input.validity.valid) {
        input.addEventListener(
          'change',
          this.handleCustomFieldError.bind(this, fieldWrapper),
          { once: true }
        );
      }

      if (!field) return;
      field.classList.toggle('has-error', !input.validity.valid);

      const errorMessageSpan = field.querySelector(
        '.js-error-message'
      );

      if (!errorMessageSpan) return;

      errorMessageSpan.parentElement.classList.toggle(
        'hidden',
        input.validity.valid
      );
      errorMessageSpan.parentElement.classList.toggle(
        'has-error',
        !input.validity.valid
      );

      errorMessageSpan.innerHTML =
        input.type == 'email'
          ? window.validationStrings.invalidEmail
          : input.validationMessage;
    }

    handleErrorMessage(errorMessage = false) {
      const errorWrapper = this.querySelector('[data-error-wrapper]');
      if (!errorWrapper) return;
      errorWrapper.classList.toggle('hidden', !errorMessage);

      if (typeof errorMessage === 'object') return;

      errorWrapper.textContent = errorMessage || '';
    }

    onVariantChange(event) {
      if (
        event.target.type === 'number' ||
        event.target.name === 'id'
      )
        return;
      this.updateLabel(event);
      this.updateOptions();
      this.productBarUpdateOptions();
      this.updateVariant();
      this.toggleAddButton(false, '');
      this.handleErrorMessage();
      this.setUnavailableOptions();
      if (!this.currentVariant?.available) {
        this.toggleAddButton(true, window.variantStrings.soldOut);
      }

      if (!this.currentVariant) {
        this.toggleAddButton(true, '');
        this.setUnavailable();

        return;
      }

      this.updateMedia({
        name: event.target.dataset.name,
        value: event.target.value
      });
      this.updateURL();
      this.updateVariantInput();
      this.fetchProductInfo();
      this.updateContactModal();
    }

    updateLabel(event) {
      const valueHolder = event.target
        .closest('fieldset')
        ?.querySelector('[data-option-selected-value]');
      if (!valueHolder) return;
      valueHolder.textContent = event.target.value;
    }

    updateOptions() {
      this.options = Array.from(
        this.querySelectorAll('input[type="radio"]:checked, select'),
        el => ({ name: el.dataset.name, value: el.value })
      );
    }

    productBarUpdateOptions() {
      if (!this.productBar || this.isQuickviewSelector) return;

      Array.from(this.productBar.querySelectorAll('[data-name]')).map(
        selector => {
          selector.value = this.options.find(
            option => option.name === selector.dataset.name
          ).value;
        }
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

    updateMedia(data) {
      if (!this.currentVariant) return;

      if (this.isQuickviewSelector) {
        const quickview = this.closest('product-quickview');
        const images = quickview.querySelectorAll('[data-image]');
        const targetImage = Array.from(images).find(image => {
          return (
            image.dataset.variantIds?.includes(
              String(this.currentVariant.id)
            ) || image.dataset[`image${data.name}`] === data.value
          );
        });

        if (!targetImage) return;

        images.forEach(image =>
          image.classList.toggle('hidden', targetImage !== image)
        );

        return;
      }

      const productMedia =
        this.closest('main-product')?.querySelector('product-media');
      if (!productMedia) return;
      if (productMedia.hasAttribute('data-gallery-filter')) {
        productMedia.filterMedia(data);
        return;
      }
      this.enableScroll &&
        productMedia.setActiveMedia(
          this.currentVariant.featured_media?.id || ''
        );
    }

    updateURL(sellingPlanId) {
      if (!this.currentVariant) return;
      const parent =
        this.closest('product-quickview') ||
        this.closest('main-product');
      parent
        .querySelector('[data-go-to-product]')
        ?.setAttribute(
          'href',
          `${
            this.isQuickviewSelector
              ? parent.dataset.url
              : this.dataset.url
          }/?variant=${this.currentVariant.id}`
        );
      if (this.isQuickviewSelector) return;
      if (!window.location.pathname.includes('/products')) return;
      const params = new URLSearchParams(window.location.search);
      params[params.has('variant') ? 'set' : 'append'](
        'variant',
        this.currentVariant.id
      );
      if (sellingPlanId) {
        params[params.has('selling_plan') ? 'set' : 'append'](
          'selling_plan',
          sellingPlanId
        );
      } else {
        params.delete('selling_plan');
      }
      window.history.replaceState(
        {},
        '',
        `${this.dataset.url}?${params.toString()}`
      );
    }

    updateVariantInput() {
      const inputs = [this.form.querySelector('[name="id"]')];

      this.installmentsForms.forEach(form => {
        if (!form) return;
        const input = form?.querySelector('[name="id"]');
        input && inputs.push(input);
      });

      inputs.forEach(input => {
        if (!input) return;
        input.value = this.currentVariant.id;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    setUnavailable() {
      const mainPrice = document.querySelector(
        `#Product-Price-${this.dataset.sectionId}-price`,
        `#Product-Price-${this.dataset.sectionId}-title`
      );
      const barPrice = this.productBar?.querySelector('[data-price]');

      if (!this.submitButton) return;

      [
        this.submitButton,
        this.productBar?.querySelector('[type="submit"]')
      ].forEach(submitButton => {
        if (!submitButton) return;

        submitButton.querySelector('span').textContent =
          window.variantStrings.unavailable;
      });
      [mainPrice, barPrice].forEach(priceElement => {
        if (priceElement)
          priceElement.classList.add('visibility-hidden');
      });
    }

    toggleAddButton(disable, text) {
      const productBarSubmit =
        this.productBar?.querySelector('[type="submit"]');

      if (disable) {
        this.submitButton &&
          this.submitButton.setAttribute('disabled', 'disabled');
        !this.isQuickviewSelector &&
          productBarSubmit &&
          productBarSubmit.setAttribute('disabled', 'disabled');
        if (text)
          this.submitButton &&
            (this.submitButton.querySelector('span').textContent =
              text);
        !this.isQuickviewSelector &&
          productBarSubmit &&
          (productBarSubmit.querySelector('span').textContent = text);
      } else {
        this.submitButton &&
          this.submitButton.removeAttribute('disabled');
        !this.isQuickviewSelector &&
          productBarSubmit &&
          productBarSubmit.removeAttribute('disabled');
        this.submitButton &&
          (this.submitButton.querySelector('span').textContent =
            window.variantStrings.addToCart);
        !this.isQuickviewSelector &&
          productBarSubmit &&
          (productBarSubmit.querySelector('span').textContent =
            window.variantStrings.addToCart);
      }
    }

    fetchProductInfo(ignoreSellingPlan = false) {
      const params = new URLSearchParams(window.location.search);
      params[params.has('variant') ? 'set' : 'append'](
        'variant',
        this.currentVariant.id
      );
      params.append('section_id', this.dataset.sectionId);
      if (ignoreSellingPlan) params.delete('selling_plan');
      this.setLoading(true);

      fetch(`${this.dataset.url}?${params.toString()}`)
        .then(response => response.text())
        .then(responseText => {
          const html = new DOMParser().parseFromString(
            responseText,
            'text/html'
          );

          this.updateLiveRegions(html);
        });
    }

    updateLiveRegions(html) {
      const regions = [
        `#Product-Badges-${this.dataset.sectionId}`,
        `#Product-Price-${this.dataset.sectionId}-title`,
        `#Product-Price-${this.dataset.sectionId}-price`,
        `#Product-Stock-Notification-${this.dataset.sectionId}`,
        `#Product-Pickup-availability-${this.dataset.sectionId}`,
        `#Product-Purchase-Options-${this.dataset.sectionId}`,
        `#Product-SKU-${this.dataset.sectionId}`
      ];
      if (!this.isQuickviewSelector) {
        regions.push('product-bar [data-price]');
      }
      const sourceHTML =
        html
          .querySelector('template#quickview')
          ?.content.firstElementChild.cloneNode(true) || html;

      regions.forEach(region => {
        const destination = document.querySelector(region);
        const source = sourceHTML.querySelector(region);

        if (!destination && !source) return;
        destination.classList.remove('visibility-hidden');
        destination.innerHTML = source.innerHTML;
      });
      this.setLoading();
    }

    setLoading(loading = false) {
      const parent = this.closest('main-product');
      if (!parent) return;

      parent.classList.toggle('is-loading', loading);
    }

    /**
     * Filters swatches.
     *
     * @returns {Void}
     */
    setUnavailableOptions() {
      [this, this.productBar].forEach(el => this.filterOptions(el));
    }

    /**
     * Appends string to an element's innerHTML.
     *
     * @param {HTMLElement} el
     * @param {String} string
     * @returns {Void}
     */
    appendStringToElementHTML(el, string) {
      if (el.innerHTML.includes(string)) return;
      el.innerHTML = `${el.innerHTML}${string}`;
    }

    /**
     * Removes unavailable text from a select option.
     *
     * @param {HTMLElement} el
     * @param {String} string
     * @returns {Void}
     */
    removeStringFromElementHTML(el, string) {
      el.innerHTML = el.innerHTML.replace(string, '');
    }

    /**
     * Filter unavailable options.
     *
     * @param {HTMLElement} el
     */
    filterOptions(el) {
      if (!el) return;

      for (const [key, { name }] of this.options.entries()) {
        const optionElements = el.querySelectorAll(
          `[data-name="${name}"]`
        );

        optionElements.forEach(swatch => {
          const selectOptions = swatch.querySelectorAll('option');
          if (!selectOptions.length) {
            return swatch.classList.toggle(
              'is-unavailable',
              !this.isOptionAvailable(key, swatch.value)
            );
          }

          return selectOptions.forEach(option => {
            if (this.isOptionAvailable(key, option.value)) {
              return this.removeStringFromElementHTML(
                option,
                this.unavailableText
              );
            }

            this.appendStringToElementHTML(
              option,
              this.unavailableText
            );
          });
        });
      }
    }

    /**
     * Check if at least one available variant that contains this option exists.
     *
     * @param {Number} index
     * @param {String} value
     * @returns {Boolean}
     */
    isOptionAvailable(index, value) {
      const currentHandle = `option${index + 1}`;
      const valuesToCheck = {};

      for (let i = 0; i < index; i++) {
        const optionHandle = `option${i + 1}`;
        const optionValue = this.options[i].value;
        valuesToCheck[optionHandle] = optionValue;
      }

      valuesToCheck[currentHandle] = value;

      return this.availableVariants.some(variant => {
        return Object.entries(valuesToCheck).every(
          ([handle, value]) => variant[handle] === value
        );
      });
    }

    updateContactModal() {
      if (!this.contactModal) return;
      const variantTitle = this.contactModal.querySelector(
        '[data-contact-modal-variant]'
      );
      const variantTitleInput = this.contactModal.querySelector(
        '[name="contact[Variant]"]'
      );

      variantTitle.textContent = this.currentVariant.title;
      variantTitleInput.value = this.currentVariant.title;
    }
  }
  customElements.define('product-selector', ProductSelector);
}

if (!customElements.get('custom-property-checkbox')) {
  class CustomCheckbox extends HTMLElement {
    constructor() {
      super();

      this.mainCheckbox = this.querySelector(
        'input[type="checkbox"]'
      );
      this.input = this.querySelector('input[type="hidden"]');

      this.checkedValue = this.input.getAttribute('data-checked');
      this.uncheckedValue = this.input.getAttribute('data-unchecked');
    }

    connectedCallback() {
      this.mainCheckbox?.addEventListener(
        'change',
        this.handleMainChange.bind(this)
      );
    }

    handleMainChange(e) {
      const value = e.target.checked
        ? this.checkedValue
        : this.uncheckedValue;

      this.input.value = value;
    }
  }

  customElements.define('custom-property-checkbox', CustomCheckbox);
}
