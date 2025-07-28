class PurchaseOptions extends HTMLElement {
  constructor() {
    super();

    this.productSelector = this.closest('main-product').querySelector(
      'product-selector'
    );
  }

  connectedCallback() {
    this.setHandlers();
  }

  setHandlers() {
    this.addEventListener('change', this.onChange.bind(this));
  }

  onChange(event) {
    if (event.target.name === 'selling_plan_group') {
      if (event.target.value === 'one-time') {
        Array.from(
          this.querySelectorAll('[name="selling_plan"]')
        ).find(option => option.checked).checked = false;
        this.updateProductSelector();

        return;
      }

      const firstSellingPlan = event.target
        .closest('[data-selling-plan-group]')
        .querySelector('[name="selling_plan"]');
      firstSellingPlan.checked = true;
      this.updateProductSelector(firstSellingPlan.value);

      return;
    }

    event.target
      .closest('[data-selling-plan-group]')
      .querySelector('[name="selling_plan_group"]').checked = true;
    this.updateProductSelector(event.target.value);
  }

  updateProductSelector(sellingPlanId) {
    if (!this.productSelector.currentVariant) {
      this.productSelector.updateVariant();
    }

    this.productSelector.updateURL(sellingPlanId);
    this.productSelector.fetchProductInfo(false);
  }
}

customElements.define('purchase-options', PurchaseOptions);
