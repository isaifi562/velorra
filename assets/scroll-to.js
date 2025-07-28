if (!customElements.get('scroll-to')) {
  class ScrollTo extends HTMLElement {
    constructor() {
      super();
    }

    setScrollPositionY() {
      this.target = document.querySelector(
        this.opener.getAttribute('href')
      );
      this.header = document.querySelector('sticky-header');
      this.offset = this.header?.clientHeight || 0;
      this.scrollPositionY =
        this.target.getBoundingClientRect().top - this.offset;
    }

    connectedCallback() {
      this.opener = this.querySelector('a');
      if (!this.opener) return;

      this.setScrollPositionY();

      this.opener.addEventListener('click', event => {
        event.preventDefault();

        window.scrollTo({
          top: this.scrollPositionY,
          behavior: 'smooth'
        });
      });
    }
  }

  customElements.define('scroll-to', ScrollTo);
}
