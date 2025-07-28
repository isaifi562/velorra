(() => {
  if (customElements.get('testimonials-slider')) {
    return;
  }

  class TestimonialsSlider extends customElements.get(
    'slider-component'
  ) {
    constructor() {
      super();
      this.options = {
        ...this.options,
        ...{
          breakpoints: {
            750: {
              spaceBetween: 16,
              slidesPerView:
                Number(this.dataset.itemsPerSlide) <= 2
                  ? Number(this.dataset.itemsPerSlide)
                  : 2
            },
            990: {
              speed: 1000,
              spaceBetween: 16,
              slidesPerView: Number(this.dataset.itemsPerSlide)
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

  customElements.define('testimonials-slider', TestimonialsSlider);
})();
