(() => {
  if (customElements.get('slider-masonry')) {
    return;
  }

  class ProductsCarousel extends customElements.get(
    'slider-component'
  ) {
    constructor() {
      super();
      this.desktopMatchQuery = window.matchMedia(
        '(min-width: 990px)'
      );
      this.sliderElement = this.slider;
      this.options = {
        ...this.options,
        spaceBetween: 16,
        width: this.getAttribute('data-fixed-width')
      };
      this.setHandlers();
    }

    disconnectedCallback() {
      if (!Shopify.designMode) {
        this.destroy();
      }
    }

    initSlider() {
      if (!this.sliderElement) return;
      if (this.desktopMatchQuery.matches) {
        if (this.slider.destroyed) return;
        return this.destroy();
      }
      if (!!this.querySelector('.swiper-initialized')) return;
      this.slider = new Swiper(this.sliderElement, this.options);
      this.setPaginationState(this.slider);
    }

    destroy() {
      typeof this.slider.destroy === 'function' &&
        this.slider.destroy(true, true);
      this.toggleHandlers('remove');
    }

    setHandlers() {
      window.addEventListener(
        'resize',
        debounce(() => {
          this.initSlider();
        }, 500)
      );
    }
  }

  customElements.define('slider-masonry', ProductsCarousel);
})();
