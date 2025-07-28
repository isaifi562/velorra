(() => {
  if (customElements.get('products-carousel')) {
    return;
  }

  class ProductsCarousel extends customElements.get(
    'slider-component'
  ) {
    constructor() {
      super();
      this.options = {
        ...this.options,
        ...{
          spaceBetween: 16,
          width: this.hasAttribute('data-fixed-width')
            ? this.dataset.fixedWidth
            : 310,
          threshold: 10,
          breakpoints: {
            750: {},
            990: {
              speed: 1000,
              width: this.hasAttribute('data-fixed-width-desktop')
                ? this.dataset.fixedWidthDesktop
                : 432
            }
          }
        }
      };

      if (this.hasAttribute('data-slides-per-view')) {
        this.options.breakpoints[750].width = null;
        this.options.breakpoints[750].slidesPerView =
          this.getAttribute('data-slides-per-view');
        this.options.breakpoints[990].width = null;
        this.options.breakpoints[990].slidesPerView =
          this.getAttribute('data-slides-per-view');
        this.options.width = null;
        this.slidesPerView = this.getAttribute(
          'data-slides-per-view'
        );
      }

      if (this.hasAttribute('data-slides-per-view-desktop')) {
        this.options.breakpoints[990].width = null;
        this.options.breakpoints[990].slidesPerView =
          this.getAttribute('data-slides-per-view-desktop');
      }

      if (this.dataset.autoplay === 'true') {
        this.options.autoplay = {
          delay: this.dataset.autoplaySpeed
        };
      }

      if (this.hasAttribute('data-direction')) {
        window
          .matchMedia('(max-width: 990px)')
          .addEventListener(
            'change',
            this.handleDirection.bind(this)
          );
      }
    }

    handleDirection(e) {
      if (!this.slider) {
        return;
      }

      this.slider.rtl = !e.matches;
      this.slider.rtlTranslate = !e.matches;
    }
  }

  customElements.define('products-carousel', ProductsCarousel);
})();
