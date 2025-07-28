(() => {
  if (customElements.get('slider-component')) {
    return;
  }

  class SliderComponent extends HTMLElement {
    constructor() {
      super();
      this.slider = this.querySelector('[data-slider]');
      this.actionClasses = {
        mouseenterLeft: 'has-mouseenter-left',
        mouseenterRight: 'has-mouseenter-right',
        pagination: {
          active: 'is-active',
          next: 'is-next',
          prev: 'is-prev'
        }
      };
      this.selectors = {
        pagination: '[data-pagination]',
        arrowPrev: '[data-arrow-prev]',
        arrowNext: '[data-arrow-next]'
      };
      this.options = {
        navigation: {
          prevEl: `${this.selectors.arrowPrev}`,
          nextEl: `${this.selectors.arrowNext}`
        },
        pagination: {
          el: `${this.selectors.pagination}`,
          type: 'bullets',
          clickable: true
        },
        on: {
          init: () => {
            this.setPaginationState();
          },
          slideChange: swiper => {
            this.setPaginationState(swiper);
          }
        }
      };
      this.initialLoad = true;
      if (Shopify.designMode) {
        window.addEventListener('shopify:section:unload', e => {
          if (e.target.contains(this)) {
            this.toggleHandlers('remove');
            this.slider.destroy(true);
          }
        });
      }
    }

    connectedCallback() {
      const handleIntersection = (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(this);
        this.initSlider();
        this.toggleHandlers();
      };

      new IntersectionObserver(handleIntersection.bind(this), {
        rootMargin: '0px 0px 200px 0px'
      }).observe(this);
    }

    disconnectedCallback() {
      if (!Shopify.designMode) {
        this.toggleHandlers('remove');
        this.slider.destroy(true);
      }
    }

    initSlider() {
      if (!this.slider) return;
      this.slider = new Swiper(this.slider, this.options);
    }

    toggleHandlers(action) {
      if (this.slider.$el !== undefined) {
        const sliderElement = this.slider?.$el[0];

        ['mousemove', 'mouseenter'].forEach(mouseEvent => {
          [
            sliderElement,
            sliderElement?.querySelector(this.selectors.arrowPrev),
            sliderElement?.querySelector(this.selectors.arrowNext)
          ].forEach(hoverElement => {
            hoverElement &&
              hoverElement[
                action !== 'remove'
                  ? 'addEventListener'
                  : 'removeEventListener'
              ](
                mouseEvent,
                debounce(event => this.onMouseEnter(event), 50).bind(
                  this
                ),
                false
              );
          });
        });

        sliderElement &&
          sliderElement[
            action !== 'remove'
              ? 'addEventListener'
              : 'removeEventListener'
          ](
            'mouseleave',
            debounce(event => this.onMouseLeave(event), 50).bind(
              this
            ),
            false
          );
        this.addEventListener(
          'shopify:block:select',
          this.onShopifyBlockSelect.bind(this)
        );
      }
    }

    setPaginationState(swiper) {
      const swiperInstance = swiper || this.slider.swiper;
      if (this.initialLoad) {
        const firstElement = this.querySelector(
          `${this.selectors.pagination} > :first-child`
        );
        firstElement.classList.add(
          this.actionClasses.pagination.active
        );
        firstElement.nextSibling?.classList.add(
          this.actionClasses.pagination.next
        );
        this.initialLoad = false;
        return;
      }
      Object.values(this.actionClasses.pagination)
        .map(paginationClass =>
          this.querySelector(
            `${this.selectors.pagination} > .${paginationClass}`
          )
        )
        .forEach((paginationItem, index) => {
          paginationItem?.classList.remove(
            Object.values(this.actionClasses.pagination)[index]
          );
        });
      // Add classes
      const paginationItems = swiperInstance?.pagination?.bullets;
      if (!paginationItems) return;
      paginationItems.forEach((paginationItem, index) => {
        if (
          !paginationItem.classList.contains(
            'swiper-pagination-bullet-active'
          )
        )
          return;
        paginationItem.classList.add(
          this.actionClasses.pagination.active
        );
        paginationItems[index - 1]?.classList.add(
          this.actionClasses.pagination.prev
        );
        paginationItems[index + 1]?.classList.add(
          this.actionClasses.pagination.next
        );
      });
    }

    onMouseEnter(event) {
      if (this.slider.destroyed) return;
      const sliderElement = this.slider.$el[0];
      const [sliderWidth, sliderLeft] = [
        sliderElement.getBoundingClientRect().width,
        sliderElement.getBoundingClientRect().left
      ];
      const dividedsliderWidth = sliderWidth / 2;
      const relativeMousePosition = event.clientX - sliderLeft;
      const isMouseInLeft =
        relativeMousePosition < dividedsliderWidth;
      sliderElement.classList.toggle(
        this.actionClasses.mouseenterLeft,
        isMouseInLeft
      );
      sliderElement.classList.toggle(
        this.actionClasses.mouseenterRight,
        !isMouseInLeft
      );
    }

    onMouseLeave() {
      if (this.slider.destroyed) return;
      const sliderElement = this.slider.$el[0];
      sliderElement.classList.remove(
        this.actionClasses.mouseenterLeft
      );
      sliderElement.classList.remove(
        this.actionClasses.mouseenterRight
      );
    }

    onShopifyBlockSelect(event) {
      const slideId = event.target.dataset.id;
      this.slider.slideTo(Number(slideId));
    }
  }

  customElements.define('slider-component', SliderComponent);
})();
