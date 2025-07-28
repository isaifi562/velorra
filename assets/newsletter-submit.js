if (typeof toastTriggered === 'undefined') {
  var toastTriggered = false;
} else if (!toastTriggered) {
  document
    .querySelector('toast-popup')
    ?.trigger(window.newsletterMessage);
  toastTriggered = true;
}
