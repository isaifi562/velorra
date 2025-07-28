class PickupAvailability extends ModalOpener {
  constructor() {
    super();
  }

  onButtonClick(button) {
    fetch(this.dataset.url)
      .then(response => response.text())
      .then(text => {
        const modal = new DOMParser()
          .parseFromString(text, 'text/html')
          .querySelector('modal-dialog');
        document.body.appendChild(modal);
        setTimeout(() => {
          super.onButtonClick(button);
        }, 300);
      })
      .catch(error => console.log(error));
  }
}

customElements.define('pickup-availability', PickupAvailability);
