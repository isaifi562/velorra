(() => {
  if (customElements.get('hero-slider')) {
    return;
  }

  class HeroSlider extends customElements.get('slider-component') {
    constructor() {
      super();
    }

    connectedCallback() {
      this.options = {
        ...this.options,
        ...{
          breakpoints: {
            990: {
              speed: 1000
            }
          }
        }
      };

      if (this.dataset.autoplay === 'true') {
        this.options.autoplay = true;
        this.options.interval = this.dataset.autoplaySpeed;
      }

      this.initSlider();
      this.toggleHandlers();
    }
  }

  customElements.define('hero-slider', HeroSlider);
})();
