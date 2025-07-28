if (!customElements.get('marquee-carousel')) {
  class MarqueeCarousel extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      setTimeout(() => {
        this.MARQUEE_TARGET_SPEED = 300;
        this.setMarqueeSpeed();

        if (!Shopify.designMode) return;

        // Options for the observer (which mutations to observe)
        const config = {
          attributes: true,
          childList: true,
          subtree: true
        };

        // Callback function to execute when mutations are observed
        const callback = (mutationList, observer) => {
          for (const mutation of mutationList) {
            if (mutation.type === 'childList') {
              this.setMarqueeSpeed();
              break;
            }
          }
        };

        this.observer = new MutationObserver(callback);
        this.observer.observe(this, config);
      }, 0);
    }

    disconnectedCallback() {
      this.observer?.disconnect();
    }

    /**
     * Dynamically set marquee animation time
     * to match target speed regardless of content width.
     */
    setMarqueeSpeed = () => {
      const width = this.querySelector(
        '.js-marquee-inner'
      )?.scrollWidth;

      width &&
        this.style.setProperty(
          '--scroll-speed',
          `${(width / this.MARQUEE_TARGET_SPEED) * 2}s`
        );
    };
  }
  customElements.define('marquee-carousel', MarqueeCarousel);
}
