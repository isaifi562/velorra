/**
 * Note: For this to work tracking must be set to collected after consent
 * in Online Store -> Preferences -> Customer Privacy.
 *
 * This uses Shopify consent-tracking-api: https://shopify.dev/api/consent-tracking
 */

class CookieBanner extends HTMLElement {
  constructor() {
    super();
    this.activeClass = 'is-visible';
    this.actionsSelector = '[data-action]';

    // selectors
    this.actions = this.querySelectorAll(this.actionsSelector);

    this.actions?.forEach(action => {
      action.addEventListener('click', this.performAction.bind(this));
    });
  }

  connectedCallback() {
    if (
      Shopify.designMode &&
      this.hasAttribute('data-open-in-design-mode')
    ) {
      return;
    }

    this.loadShopifyScript();
  }

  loadShopifyScript() {
    if (typeof window.Shopify === undefined) return;

    window.Shopify.loadFeatures(
      [
        {
          name: 'consent-tracking-api',
          version: '0.1'
        }
      ],
      error => {
        if (error) throw error;
        this.initBanner();
      }
    );
  }

  initBanner() {
    if (
      Shopify.designMode &&
      !this.hasAttribute('data-open-in-design-mode')
    )
      return;
    this.classList.toggle(
      this.activeClass,
      window.Shopify.customerPrivacy.shouldShowGDPRBanner()
    );
  }

  performAction(event) {
    event.preventDefault();
    const action =
      event.target.getAttribute('data-action') !== null
        ? event.target.getAttribute('data-action')
        : event.target.parentElement.getAttribute('data-action');
    if (!action) return;
    if (action === 'minimize-cookies')
      return this.classList.remove(this.activeClass);

    window.Shopify.customerPrivacy.setTrackingConsent(
      action === 'accept-cookies',
      () => {
        this.classList.remove(this.activeClass);
      }
    );
  }
}

customElements.define('cookie-banner', CookieBanner);
