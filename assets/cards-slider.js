(() => {
  if (customElements.get('cards-slider')) {
    return;
  }

  class CardsSlider extends customElements.get('slider-component') {
    constructor() {
      super();

      this.options = {
        ...this.options,
        ...{
          spaceBetween: this.hasAttribute('data-gap')
            ? Number(this.getAttribute('data-gap'))
            : 16,
          slidesPerView: 1,
          breakpoints: {
            750: {
              slidesPerView: 2
            },
            990: {
              speed: 1000,
              slidesPerView: Number(this.dataset.itemsPerSlide)
            }
          }
        }
      };
    }
  }

  customElements.define('cards-slider', CardsSlider);
})();
