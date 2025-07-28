(() => {
  if (customElements.get('image-gallery-slider')) {
    return;
  }

  class ImageGallerySlider extends customElements.get(
    'slider-component'
  ) {
    constructor() {
      super();

      this.selectors.thumbs = '.js-image-gallery-thumbs .swiper';
      this.selectors.gallery = '.js-image-gallery';

      this.thumbsOptions = {
        slidesPerView: 3,
        spaceBetween: Number(this.getAttribute('data-slider-gap')),
        watchSlidesProgress: true,
        breakpoints: {
          750: {
            slidesPerView: 4
          },
          990: {
            slidesPerView: 5
          },
          1200: {
            slidesPerView: 8
          }
        }
      };
    }

    connectedCallback() {
      this.options = {
        ...this.options,
        ...{
          spaceBetween: Number(this.getAttribute('data-slider-gap')),
          slidesPerView: Number(
            this.getAttribute('data-slides-per-view')
          ),
          breakpoints: {
            750: {
              speed: 1000,
              slidesPerView: Number(
                this.getAttribute('data-slides-per-view-desktop')
              )
            }
          }
        }
      };

      this.#initThumbs();
      this.initSlider();
      this.toggleHandlers();
    }

    #initThumbs() {
      const thumbsEl = this.closest(
        this.selectors.gallery
      )?.querySelector(this.selectors.thumbs);

      if (!thumbsEl) return;

      const thumbs = new Swiper(
        this.closest(this.selectors.gallery).querySelector(
          this.selectors.thumbs
        ),
        this.thumbsOptions
      );

      this.options.thumbs = {
        swiper: thumbs
      };
    }
  }

  customElements.define('image-gallery-slider', ImageGallerySlider);
})();
