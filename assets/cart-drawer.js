const sectionsToRender = [
  {
    id: '#cart-counter',
    section: 'cart-counter',
    selector: '#shopify-section-cart-counter'
  },
  {
    id: '#CartDrawer-Body',
    section: 'cart-drawer',
    selector: '#shopify-section-cart-drawer #CartDrawer-Body'
  }
];

class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.recommendationsPerformed = false;

    this.addEventListener(
      'keyup',
      event => event.code.toUpperCase() === 'ESCAPE' && this.close()
    );
    this.querySelector('#CartDrawer-Overlay').addEventListener(
      'click',
      this.close.bind(this)
    );
    this.setCartLink();
  }

  connectedCallback() {
    this.toggleCheckoutButton();
  }

  performRecommendations() {
    const recommendationsHolder = this.querySelector(
      '[data-cart-drawer-upsells]'
    );
    if (!recommendationsHolder || this.recommendationsPerformed)
      return;
    this.recommendationsPerformed = true;

    fetch(recommendationsHolder.dataset.url)
      .then(response => response.text())
      .then(text => {
        const recommendations = new DOMParser()
          .parseFromString(text, 'text/html')
          .querySelector('[data-cart-drawer-upsells]').outerHTML;
        recommendationsHolder.outerHTML = recommendations;
      });
  }

  setCartLink() {
    const cartLink = document.querySelector('[data-cart-link]');
    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', event => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener('keydown', event => {
      if (event.code.toUpperCase() !== 'SPACE') return;
      event.preventDefault();
      this.open(cartLink);
    });
  }

  onCartAdd(event) {
    event.preventDefault();

    addToCart(
      event.target,
      this.getSectionsToRender().map(section => section.section)
    )
      .then(response => {
        if (response.status) throw new Error(response.message);

        this.renderContents(response);
      })
      .catch(error => {
        console.error(error);
      });
  }

  open(opener) {
    if (opener) this.setActiveElement(opener);
    this.classList.add('is-visible');
    this.addEventListener(
      'transitionend',
      () => {
        this.focusOnCartDrawer();
      },
      { once: true }
    );
    bodyScroll.lock(this.querySelector('#CartDrawer-Body'));
    this.performRecommendations();
  }

  close() {
    this.classList.remove('is-visible');
    removeTrapFocus(this.activeElement);
    bodyScroll.unlock(this.querySelector('#CartDrawer-Body'));
  }

  setActiveElement(element) {
    this.activeElement = element;
  }

  focusOnCartDrawer() {
    const containerToTrapFocusOn = this.querySelector('#CartDrawer');
    const focusElement = this.querySelector('[data-drawer-close]');
    trapFocus(containerToTrapFocusOn, focusElement);
  }

  renderContents(response) {
    this.getSectionsToRender().forEach(section => {
      const sectionElement = document.querySelector(section.id);
      const cartPartsSelectors = [
        '[data-cart-title]',
        '[data-cart-shipping-bar]',
        '[data-cart-summary]'
      ];

      sectionElement.innerHTML = this.getSectionInnerHTML(
        response.sections[section.section],
        section.selector
      );
      this.updateCartParts(
        this.getCartElements(response, section, cartPartsSelectors),
        cartPartsSelectors
      );
    });
    this.recommendationsPerformed = false;
    this.open();
  }

  getSectionsToRender() {
    return sectionsToRender;
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  getCartElements(response, section, selectors) {
    return selectors.map(selector => {
      return new DOMParser()
        .parseFromString(
          response.sections[section.section],
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

  toggleCheckoutButton() {
    this.addEventListener('change', event => {
      if (event.target.getAttribute('name') !== 'terms') return;

      this.querySelector('[name="checkout"]')?.classList.toggle(
        'not-allowed',
        !event.target.checked
      );
    });
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  constructor() {
    super();
    this.cartDrawer = document.querySelector('cart-drawer');
  }

  performRecommendations() {
    this.cartDrawer.recommendationsPerformed = false;
    this.cartDrawer.performRecommendations();
  }

  getSectionsToRender() {
    return sectionsToRender;
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);
