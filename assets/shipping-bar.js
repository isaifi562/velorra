class ShippingBar extends HTMLElement {
  constructor() {
    super();
    this.currentCurrency = Shopify.currency.active;
    this.conversionRate = Shopify.currency.rate;
    this.threshold = this.dataset.threshold;
    this.convertedThreshold = 0;
    this.totalPrice = this.dataset.totalPrice;
    this.moneyFormat = this.dataset.moneyFormat;
    this.empty = this.dataset.empty === 'true';
    this.showCurrencyCode = this.dataset.showCurrencyCode === 'true';
  }

  connectedCallback() {
    this.calculateConvertedPrices();
    if (this.empty) {
      this.emptyText = this.querySelector('[data-empty-text]');
      this.showEmptyText();
      return;
    }

    this.successText = this.querySelector('[data-success-text]');
    this.progressText = this.querySelector('[data-progress-text]');
    this.progressBar = this.querySelector('[data-progress-bar]');

    const thresholdIsPassed =
      Number(this.totalPrice) > Number(this.threshold);
    if (!thresholdIsPassed && Number(this.threshold) > 0) {
      this.showProgress();
      return;
    }

    this.progressBar.style.width = '100%';
    this.progressBar.parentElement.classList.remove('hidden');
    this.successText.classList.remove('hidden');
  }

  showEmptyText() {
    this.emptyText.innerHTML = this.emptyText.innerHTML.replace(
      '[amount]',
      this.getFormattedPrice(this.threshold)
    );
    this.emptyText.classList.remove('hidden');
  }

  calculateConvertedPrices() {
    this.threshold = (
      this.threshold * (this.conversionRate || 1)
    ).toFixed(0);
  }

  showProgress() {
    // Calculate progress percent
    const progressPercent = (this.totalPrice * 100) / this.threshold;
    this.progressBar.style.width = `${progressPercent}%`;

    // Replace price
    const progressText = this.progressText.innerHTML.replace(
      '[amount]',
      this.getFormattedPrice(this.threshold - this.totalPrice)
    );
    this.progressText.innerHTML = progressText;

    this.progressBar.parentElement.classList.remove('hidden');
    this.progressText.classList.remove('hidden');
  }

  getFormattedPrice(price) {
    const formattedPrice = Shopify.formatMoney(
      price,
      this.moneyFormat
    );
    return this.showCurrencyCode
      ? `${formattedPrice} ${this.currentCurrency}`
      : formattedPrice;
  }
}

customElements.define('shipping-bar', ShippingBar);
