class RecentlyViewed extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.productHandle = this.getAttribute('data-product-handle');
    this.sectionId = this.getAttribute('data-section-id');
    this.limit = this.getAttribute('data-limit');

    new IntersectionObserver(this.#handleIntersection.bind(this), {
      rootMargin: '0px 0px 200px 0px'
    }).observe(this);
  }

  #handleIntersection = (entries, observer) => {
    if (!entries[0].isIntersecting) return;
    observer.unobserve(this);
    this.#fetchProducts();
  };

  /**
   * Get handles and filter current product.
   *
   * @returns {String} handles
   */
  #getHandles() {
    const handlesString = localStorage.getItem('recently-viewed');
    if (!handlesString) {
      this.classList.add('hidden');
      return;
    }

    const handlesArr = handlesString.split(',');
    const handles = this.productHandle
      ? handlesArr.filter(handle => handle !== this.productHandle)
      : handlesArr;

    if (handles.length === 0) {
      this.classList.add('hidden');
      return;
    }

    return handles.join(',');
  }

  #fetchProducts() {
    const handles = this.#getHandles();

    if (!handles) return;

    fetch(
      `${window.location.pathname}?sections=${this.sectionId}&handles=${handles}&limit=${this.limit}`
    )
      .then(response => response.json())
      .then(data => {
        const parser = new DOMParser();
        const html = parser.parseFromString(
          data[this.sectionId],
          'text/html'
        );
        const recent = html.querySelector('recently-viewed');
        if (recent && recent.innerHTML.trim().length) {
          this.innerHTML = recent.innerHTML;
        }
      })
      .catch(e => {
        console.error(e);
      });
  }
}

customElements.define('recently-viewed', RecentlyViewed);
