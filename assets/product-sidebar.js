if (!customElements.get('product-sidebar')) {
  class ProductSidebar extends HTMLElement {
    mediaQuery = window.matchMedia('screen and (min-width: 990px)');
    selectors = {
      id: '',
      section: '.js-main-product',
      innerWrapper: '.js-product-content'
    };
    headerHeight = 73;
    mainProductTopPadding = 16;

    constructor() {
      super();
    }

    handleResize() {
      if (this.mediaQuery.matches) {
        this.init();
      } else {
        this.destroy();
      }
    }

    init() {
      this.sidebar = new StickySidebar(this.selectors.id, {
        containerSelector: this.selectors.section,
        innerWrapperSelector: this.selectors.innerWrapper,
        topSpacing: this.headerHeight + this.mainProductTopPadding,
        bottomSpacing: 0
      });
      this.classList.remove('is-disabled');
    }

    destroy() {
      this.sidebar.destroy();
      this.classList.add('is-disabled');
    }

    connectedCallback() {
      if (this.hasAttribute('data-disable-sticky')) return;

      this.selectors.id = `#${this.getAttribute('id')}`;

      if (this.mediaQuery.matches) this.init();

      this.mediaQuery.addEventListener(
        'change',
        this.handleResize.bind(this)
      );
    }
  }
  customElements.define('product-sidebar', ProductSidebar);
}
