if (!customElements.get('product-recommendations')) {
  class ProductRecommendations extends HTMLElement {
    constructor() {
      super();

      this.ROOT_MARGIN = '0px 0px 200px 0px';
    }

    connectedCallback() {
      if (this.hasAttribute('data-force-load')) {
        this.loadRecommendations();
      } else {
        this.setupIntersectionObserver();
      }
    }

    loadRecommendations() {
      fetch(this.dataset.url)
        .then(response => response.text())
        .then(text => {
          const html = document.createElement('div');
          html.innerHTML = text;
          const recommendations = html.querySelector(
            `[data-container="${this.dataset.container}"]`
          );

          if (
            recommendations &&
            recommendations.innerHTML.trim().length
          ) {
            this.innerHTML = recommendations.innerHTML;
          }
        })
        .catch(e => {
          console.error(e);
        });
    }

    setupIntersectionObserver() {
      new IntersectionObserver(
        (entries, observer) => {
          if (!entries[0].isIntersecting) return;
          observer.unobserve(this);

          this.loadRecommendations();
        },
        {
          rootMargin: this.ROOT_MARGIN
        }
      ).observe(this);
    }
  }

  customElements.define(
    'product-recommendations',
    ProductRecommendations
  );
}
