(() => {
  if (customElements.get('shop-module')) {
    return;
  }

  class ShopModule extends HTMLElement {
    constructor() {
      super();
      this.selectors = {
        slider: '[data-slider]',
        hotspot: '[data-hotspot]'
      };
      this.actionClasses = {
        hotspot: {
          active: 'is-active'
        }
      };

      if (Shopify.designMode) {
        window.addEventListener('shopify:section:unload', e => {
          if (e.target.contains(this)) {
            this.toggleHandlers('remove');
          }
        });
      }
    }

    connectedCallback() {
      this.toggleHandlers();
    }

    disconnectedCallback() {
      if (!Shopify.designMode) {
        this.toggleHandlers('remove');
      }
    }

    toggleHandlers(action) {
      this.querySelectorAll(this.selectors.hotspot).forEach(
        hotspot => {
          hotspot[
            action !== 'remove'
              ? 'addEventListener'
              : 'removeEventListener'
          ]('click', event =>
            this.syncActiveState(event.target.dataset.id)
          );
        }
      );

      const slider = this.querySelector(this.selectors.slider);
      if (!slider) return;
      slider[
        action !== 'remove'
          ? 'addEventListener'
          : 'removeEventListener'
      ]('slideChange', event =>
        this.syncActiveState(event.activeSlide.dataset.id)
      );

      this[
        action !== 'remove'
          ? 'addEventListener'
          : 'removeEventListener'
      ]('shopify:block:select', this.onShopifyBlockSelect.bind(this));
    }

    syncActiveState(hotspotId) {
      const hotspot = this.querySelector(
        `${this.selectors.hotspot}[data-id="${hotspotId}"]`
      );

      if (!hotspot) return;

      if (
        hotspot.classList.contains(this.actionClasses.hotspot.active)
      )
        return;

      this.querySelector(
        `${this.selectors.hotspot}.${this.actionClasses.hotspot.active}`
      ).classList.remove(this.actionClasses.hotspot.active);

      hotspot.classList.add(this.actionClasses.hotspot.active);

      this.querySelector(this.selectors.slider).goToSlide(
        hotspot.dataset.id
      );
    }

    onShopifyBlockSelect(event) {
      this.syncActiveState(event.target.dataset.id);
    }
  }

  customElements.define('shop-module', ShopModule);
})();
