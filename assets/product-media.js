/**
 * Uses Swiper package to create a carousel for product media
 * More info: https://swiperjs.com//
 */
if (!customElements.get('product-media')) {
  class ProductMedia extends HTMLElement {
    constructor() {
      super();

      this.lastActiveBreakpoint = '';
      this.swiperInitialized = false;
      this.productModalHTML = {};
      this.selectors = {
        header: 'sticky-header',
        slider: '[data-slider]',
        thumbs: '[data-thumbs]',
        mediaItem: '[data-media-item]',
        mediaColor: 'data-media-color',
        thumbnail: '[data-thumbnail]'
      };
      this.filterMediaBy = this.dataset.galleryFilter;
      this.selectedMediaIndex =
        Number(
          this.querySelector(this.selectors.slider)?.querySelector(
            '[data-selected]'
          )?.dataset.index
        ) || 0;
      this.breakpoints = {
        desktop: 990,
        desktop_large: 1440
      };
      this.settings = {
        elements: {
          slider: this.querySelector(this.selectors.slider),
          thumbs: this.querySelector(this.selectors.thumbs)
        },
        instances: {
          slider: null,
          thumbs: null
        },
        options: {
          slider: {
            slidesPerView: 'auto',
            initialSlide: this.selectedMediaIndex,
            watchOverflow: true,
            watchSlidesVisibility: true,
            watchSlidesProgress: true,
            pagination: {
              el: '.swiper-pagination',
              type: 'progressbar'
            },
            navigation: {
              prevEl: '[data-arrow-prev]',
              nextEl: '[data-arrow-next]'
            },
            autoHeight: this.hasAttribute('data-slider-autoheight'),
            breakpoints: {
              [this.breakpoints.desktop]: {
                allowTouchMove: false,
                pagination: false,
                navigation: false
              }
            }
          },
          thumbs: {
            initialSlide: this.selectedMediaIndex,
            spaceBetween: 16,
            slidesPerView: this.getThumbsPerView(),
            watchOverflow: true,
            watchSlidesProgress: true,
            setWrapperSize: true,
            navigation: {
              nextEl: '[data-thumbs-next]',
              prevEl: '[data-thumbs-prev]'
            },
            direction: 'horizontal',
            breakpoints: {
              [this.breakpoints.desktop]: {
                slidesPerView: this.hasAttribute('data-thumbs-layout')
                  ? 'auto'
                  : this.getThumbsPerView(),
                direction: this.hasAttribute('data-thumbs-layout')
                  ? 'vertical'
                  : 'horizontal'
              }
            }
          }
        }
      };
    }

    getThumbsPerView(breakpoint) {
      const useAspectRatio = this.hasAttribute(
        'data-slider-autoheight'
      );
      const useLayoutBottom = !this.hasAttribute(
        'data-thumbs-layout'
      );

      if (useLayoutBottom) return breakpoint ? 4.26 : 4.17;

      if (useAspectRatio) return 'auto';

      if (!breakpoint) return 3.49;

      return 3.3;
    }

    connectedCallback() {
      this.setThumbsHeight();
      this.init();
      this.setLastActiveBreakpoint();

      window.addEventListener(
        'resize',
        debounce(() => {
          this.setThumbsHeight();
          this.initSliders();
          this.setLastActiveBreakpoint();
        }, 300)
      );
    }

    init() {
      if (typeof PhotoSwipeLightbox !== 'undefined') {
        const photoSwipeLightboxInstance = new PhotoSwipeLightbox({
          gallery: this,
          children: 'a[data-pswp-image]',
          pswpModule: PhotoSwipe
        });

        photoSwipeLightboxInstance.init();
      }

      this.initSliders();
    }

    initSliders() {
      const screen =
        window.innerWidth <= this.breakpoints.desktop
          ? 'mobile'
          : 'desktop';
      const disabledOnDesktop = this.hasAttribute(
        'data-slider-desktop-disabled'
      );

      if (screen === 'mobile') {
        if (
          this.lastActiveBreakpoint === 'desktop' &&
          this.swiperInitialized
        ) {
          this.destroySwiper();
        }

        if (!this.swiperInitialized) {
          this.initSwiper();
        }
      } else if (screen === 'desktop') {
        if (disabledOnDesktop) {
          this.swiperInitialized && this.destroySwiper();
          return;
        }

        if (
          this.lastActiveBreakpoint === 'mobile' &&
          this.swiperInitialized
        ) {
          this.destroySwiper();
        }

        if (!this.swiperInitialized) {
          this.initSwiper();
        }
      }
    }

    initSwiper() {
      this.swiperInitialized = true;

      // Init thumbs
      if (this.settings.elements.thumbs) {
        this.settings.instances.thumbs = new Swiper(
          this.settings.elements.thumbs,
          this.settings.options.thumbs
        );
        this.settings.options.slider.thumbs = {
          swiper: this.settings.instances.thumbs
        };
      }

      // Init main slider
      this.settings.instances.slider = new Swiper(
        this.settings.elements.slider,
        this.settings.options.slider
      );

      // Sync thumbs and main slider
      if (this.settings.elements.thumbs) {
        this.settings.instances.slider.on(
          'slideChangeTransitionStart',
          () => {
            this.settings.instances.thumbs.slideTo(
              this.settings.instances.slider.activeIndex
            );
          }
        );
      }

      this.settings.instances.slider.on('slideChange', () => {
        window.pauseAllMedia();
      });
    }

    destroySwiper() {
      try {
        this.settings.instances.slider.destroy();
      } catch (error) {}

      try {
        if (this.settings.instances.thumbs) {
          this.settings.instances.thumbs.destroy();
        }
      } catch (error) {}
      this.swiperInitialized = false;
    }

    setLastActiveBreakpoint() {
      this.lastActiveBreakpoint =
        window.innerWidth <= this.breakpoints.desktop
          ? 'mobile'
          : 'desktop';
    }

    setActiveMedia(id) {
      const mediaFound = Array.from(
        this.querySelectorAll(this.selectors.mediaItem)
      ).find(media => Number(media.dataset.mediaId) === id);

      if (!mediaFound) return;
      if (
        !this.settings.instances.slider ||
        this.settings.instances.slider?.destroyed
      ) {
        const headerHeight =
          document.querySelector(this.selectors.header)
            ?.offsetHeight || 0;
        window.scroll({
          top:
            mediaFound.getBoundingClientRect().top +
            window.scrollY -
            headerHeight,
          behavior: 'smooth'
        });
        return;
      }

      this.settings.instances.slider.slideTo(
        Number(mediaFound.dataset.index)
      );
    }

    filterMedia({ name, value }) {
      if (name !== this.filterMediaBy) return;

      const filteredMedia = this.querySelectorAll(
        `${this.selectors.mediaItem}[${this.selectors.mediaColor}="${value}"], ${this.selectors.thumbnail}[${this.selectors.mediaColor}="${value}"]`
      );
      const hasFilteredMedia = filteredMedia.length !== 0;

      this.querySelectorAll(
        `${this.selectors.mediaItem}, ${this.selectors.thumbnail}`
      ).forEach(media => {
        if (!hasFilteredMedia) {
          media.classList.add('swiper-slide');
          media.classList.remove('hidden');
        } else {
          media.classList.remove('swiper-slide');
          media.classList.add('hidden');
        }
      });

      const inactiveSliderInstance =
        !this.settings.instances.slider ||
        this.settings.instances.slider?.destroyed;

      if (!hasFilteredMedia && !inactiveSliderInstance) {
        this.settings.instances.slider.update();
        this.settings.instances.thumbs?.update();
        return;
      }

      this.querySelectorAll(
        `${this.selectors.mediaItem}[${this.selectors.mediaColor}="${value}"], ${this.selectors.thumbnail}[${this.selectors.mediaColor}="${value}"]`
      ).forEach(media => {
        media.classList.add('swiper-slide');
        media.classList.remove('hidden');
      });

      if (inactiveSliderInstance) return;

      this.settings.instances.slider.update();
      this.settings.instances.thumbs?.update();
    }

    setThumbsHeight() {
      const thumbs = this.querySelector(
        this.selectors.thumbs
      )?.parentElement;
      if (!thumbs) return;
      const slider = this.querySelector(this.selectors.slider);

      thumbs.style.maxHeight =
        this.hasAttribute('data-thumbs-layout') &&
        window.innerWidth > this.breakpoints.desktop
          ? `${slider.clientHeight}px`
          : '';
    }
  }

  customElements.define('product-media', ProductMedia);
}
