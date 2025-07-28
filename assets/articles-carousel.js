(() => {
  if (customElements.get('articles-carousel')) {
    return;
  }

  class ArticlesCarousel extends customElements.get(
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
          breakpoints: {
            750: {
              width: this.hasAttribute('data-fixed-width-desktop')
                ? this.dataset.fixedWidthDesktop
                : 656
            },
            990: {
              speed: 1000,
              width: this.hasAttribute('data-fixed-width-desktop')
                ? this.dataset.fixedWidthDesktop
                : 656
            }
          }
        }
      };

      if (this.dataset.autoplay === 'true') {
        this.options.autoplay = {
          delay: this.dataset.autoplaySpeed
        };
      }
    }
  }

  customElements.define('articles-carousel', ArticlesCarousel);
})();
