class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', event => {
      event.preventDefault();
      const cartItems =
        this.closest('cart-drawer-items') ||
        this.closest('cart-items');
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();

    this.form = this.querySelector('form');
    this.debouncedOnChange = debounce(event => {
      this.onChange(event);
    }, 300);
    this.addEventListener(
      'change',
      this.debouncedOnChange.bind(this)
    );

    this.setHandlers();
  }

  setHandlers() {
    const cartNote = this.querySelector('textarea[name="note"]');
    const giftWrapCheckbox = this.querySelector(
      'input[name="wrap_product"]'
    );
    const termsControl = this.querySelector('[name="terms"]');
    const submit = this.querySelector('[name="checkout"]');

    if (giftWrapCheckbox) {
      giftWrapCheckbox.addEventListener(
        'change',
        this.onGiftWrapInputChange.bind(this)
      );
    }

    if (cartNote) {
      cartNote.addEventListener(
        'keyup',
        debounce(event => {
          this.onCartNoteChange(event);
        }, 300).bind(this)
      );
    }

    if (termsControl) {
      termsControl.addEventListener('change', event => {
        submit.classList.toggle('not-allowed', !event.target.checked);
      });
    }
  }

  onCartNoteChange(event) {
    const body = JSON.stringify({
      note: event.target.value
    });

    fetch(routes.cart_update_url, {
      ...fetchConfig(),
      ...{ body }
    });
  }

  onGiftWrapInputChange(event) {
    const input = event.target;
    const submitButton = this.querySelector('[name="checkout"]');
    input.setAttribute('disabled', true);
    submitButton.setAttribute('disabled', true);

    this.handleGiftWrapInputChange(
      input.value,
      input.dataset.lineItemId
    )
      .then(state => {
        this.updateCart(JSON.parse(state));
      })
      .catch(() => {
        alert('An error occured. Please try again later');
      })
      .finally(() => {
        input.removeAttribute('disabled');
        submitButton.removeAttribute('disabled');
      });
  }

  handleGiftWrapInputChange(id, existingId) {
    const lineItemExists = id === existingId;

    return new Promise((resolve, reject) => {
      fetch(routes.cart_url, {
        ...fetchConfig('json', 'GET')
      })
        .then(response => response.json())
        .then(() => {
          const body = {
            updates: { [id]: lineItemExists ? 0 : 1 },
            sections: this.getSectionsToRender().map(
              section => section.section
            ),
            sections_url: window.location.pathname
          };

          fetch(`${routes.cart_update_url}`, {
            ...fetchConfig(),
            ...{ body: JSON.stringify(body) }
          })
            .then(response => response.text())
            .then(text => resolve(text))
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
  }

  onChange(event) {
    if (['checkbox', 'textarea'].includes(event.target.type)) return;

    this.updateQuantity(
      event.target.dataset.index,
      event.target.value,
      document.activeElement.getAttribute('name')
    );
  }

  getSectionsToRender() {
    return [
      {
        id: `#${
          document.getElementById('main-cart-items').dataset.id
        }`,
        section:
          document.getElementById('main-cart-items').dataset.id,
        selector: `#${
          document.getElementById('main-cart-items').dataset.id
        }`
      },
      {
        id: '#cart-counter',
        section: 'cart-counter',
        selector: '#shopify-section-cart-counter'
      }
    ];
  }

  async updateQuantity(line, quantity, name) {
    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map(
        section => section.section
      ),
      sections_url: window.location.pathname
    });

    const response = await fetch(`${routes.cart_change_url}`, {
      ...fetchConfig(),
      ...{ body }
    });

    if (!response.ok) {
      const json = await response.json();
      return this.updateLiveRegions(line, json.errors);
    }

    const state = await response.text();
    const parsedState = JSON.parse(state);

    this.updateCart(parsedState);
    const lineItem = document.getElementById(`CartItem-${line}`);
    if (lineItem && lineItem.querySelector(`[name="${name}"]`))
      lineItem.querySelector(`[name="${name}"]`).focus();
    this.performRecommendations();
  }

  performRecommendations() {}

  updateCart(parsedState) {
    this.getSectionsToRender().forEach(section => {
      const elementToReplace = document.querySelector(section.id);
      const cartPartsSelectors = [
        '[data-cart-title]',
        '[data-cart-shipping-bar]',
        '[data-cart-summary]'
      ];

      elementToReplace.innerHTML = this.getSectionInnerHTML(
        parsedState.sections[section.section],
        section.selector
      );
      this.updateCartParts(
        this.getCartElements(
          parsedState,
          section,
          cartPartsSelectors
        ),
        cartPartsSelectors
      );
    });
    this.setHandlers();
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  updateLiveRegions(line, message) {
    document
      .querySelectorAll(`[data-line-item-error][data-line="${line}"]`)
      .forEach(error => {
        error.innerHTML = message;
      });
  }

  getCartElements(parsedState, section, selectors) {
    return selectors.map(selector => {
      return new DOMParser()
        .parseFromString(
          parsedState.sections[section.section],
          'text/html'
        )
        .querySelector(selector);
    });
  }

  updateCartParts(elements, selectors) {
    elements.forEach((element, index) => {
      if (!element) return;

      const elementToReplace = document.querySelector(
        selectors[index]
      );
      elementToReplace.innerHTML = element.innerHTML;
    });
  }
}

customElements.define('cart-items', CartItems);
