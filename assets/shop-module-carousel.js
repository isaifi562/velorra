(() => {
  if (customElements.get('shop-module-carousel')) {
    return;
  }

  class ShopModule extends customElements.get('slider-component') {
    constructor() {
      super();
      this.options = {
        ...this.options,
        width: 210,
        spaceBetween: 16,
        breakpoints: {
          750: {
            width: 310
          },
          990: {
            width: null,
            speed: 1000
          }
        }
      };

      // Custom events
      this.options.on.slideChange = swiper => {
        const changeEvent = new Event('slideChange');
        changeEvent.activeSlide = this.querySelector(
          `.swiper-slide[data-id="${swiper.activeIndex}"]`
        );
        this.dispatchEvent(changeEvent);
        this.setPaginationState(swiper);
      };
    }

    goToSlide(slideId) {
      this.slider.slideTo(Number(slideId));
    }
  }

  customElements.define('shop-module-carousel', ShopModule);
})();
