class AnnouncementBar extends HTMLElement {
  constructor() {
    super();

    this.sessionStorageKey = 'announcementBarClosed';
    this.closeButton = this.querySelector('[data-close-button]');
    this.closeButton &&
      this.closeButton.addEventListener(
        'click',
        this.onClose.bind(this)
      );
  }

  connectedCallback() {
    if (sessionStorage.getItem(this.sessionStorageKey)) return;
    this.classList.remove('hidden');
    this.initSlider();
  }

  initSlider() {
    if (!this.querySelector('.swiper')) return;

    this.options = {
      slidesPerPage: 1,
      rewind: true,
      draggable: true
    };

    if (this.dataset.sliderType !== 'controls') {
      this.options.autoplay = {
        delay: 3000
      };
    } else {
      this.options.navigation = {
        prevEl: '[data-arrow-prev]',
        nextEl: '[data-arrow-next]'
      };
    }

    this.slider = new Swiper(
      this.querySelector('.swiper'),
      this.options
    );
  }

  onClose() {
    this.classList.add('hidden');
    sessionStorage.setItem(this.sessionStorageKey, true);
  }
}

customElements.define('announcement-bar', AnnouncementBar);
