(() => {
  if (customElements.get('deferred-media')) {
    return;
  }

  class DeferredMedia extends HTMLElement {
    constructor() {
      super();
      const poster = this.querySelector('[id^="Deferred-Poster-"]');
      if (!poster) return;
      poster.addEventListener('click', this.loadContent.bind(this));
    }

    loadContent(focus = true) {
      window.pauseAllMedia();
      if (!this.getAttribute('loaded')) {
        const content = document.createElement('div');
        content.appendChild(
          this.querySelector(
            'template'
          ).content.firstElementChild.cloneNode(true)
        );

        this.setAttribute('loaded', true);
        const contentHolder =
          this.querySelector('[data-template-output]') || this;
        const deferredElement = contentHolder.appendChild(
          content.querySelector(
            '.deferred-media-wrapper, video, model-viewer, iframe'
          )
        );

        if (isIOS()) {
          deferredElement.controls = true;
        }

        deferredElement.play && deferredElement.play();

        if (focus) deferredElement.focus();
      }
    }
  }

  customElements.define('deferred-media', DeferredMedia);
})();
