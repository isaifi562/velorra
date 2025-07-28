if (!customElements.get('image-gallery')) {
  class ImageGallery extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.#init();
    }

    #init() {
      try {
        const photoSwipeLightboxInstance = new PhotoSwipeLightbox({
          gallery: this,
          children: 'a[data-pswp-image]',
          pswpModule: PhotoSwipe
        });

        photoSwipeLightboxInstance.init();
      } catch (error) {
        console.error(error);
      }
    }
  }
  customElements.define('image-gallery', ImageGallery);
}
