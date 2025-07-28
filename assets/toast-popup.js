if (!customElements.get('toast-popup')) {
  class ToastPopup extends HTMLElement {
    constructor() {
      super();
    }

    show() {
      this.setAttribute('data-visible', 'true');
    }

    hide() {
      this.removeAttribute('data-visible');
    }

    flash() {
      this.show();
      this.interval = setInterval(() => {
        this.hide();
        clearInterval(this.interval);
      }, 3000);
    }

    setText(text) {
      this.innerHTML = text;
    }

    trigger(text) {
      setTimeout(() => {
        this.setText(text);
        this.flash();
      }, 3000);
    }
  }
  customElements.define('toast-popup', ToastPopup);
}
