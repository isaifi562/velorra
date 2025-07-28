(() => {
  if (customElements.get('predictive-search')) {
    return;
  }
  class PredictiveSearch extends HTMLElement {
    constructor() {
      super();

      this.cachedResults = {};
      this.input = this.querySelector('input[role="combobox"]');
      this.predictiveSearchResults = this.querySelector(
        'predictive-search-results'
      );
      this.searchSection = this.hasAttribute('data-section')
        ? this.dataset.section
        : 'predictive-search';
      this.defaultSearchParams = `${encodeURIComponent(
        'resources[type]'
      )}=product,article,page,collection,query&${encodeURIComponent(
        'resources[limit]'
      )}=5&${encodeURIComponent('resources[limit_scope]')}=each`;
      this.queryParams = `${
        this.hasAttribute('data-query-params')
          ? this.dataset.queryParams
          : this.defaultSearchParams
      }&section_id=${this.searchSection}`;
      this.setupEventListeners();
      this.result = '[data-result]';
      this.focussedResult = undefined;
    }

    setupEventListeners() {
      const form = this.querySelector('form');
      form.addEventListener('submit', this.onFormSubmit.bind(this));

      this.input.addEventListener(
        'input',
        debounce(event => {
          this.onChange(event);
        }, 300).bind(this)
      );
      this.input.addEventListener('focus', this.onFocus.bind(this));
      if (this.hasAttribute('data-allow-arrows')) {
        this.addEventListener('keydown', this.onKeyPress.bind(this));
      }
      this.addEventListener('focusout', this.onFocusOut.bind(this));
    }

    onKeyPress(event) {
      if (!this.hasAttribute('open')) return;
      const resultsArray = Array.from(
        this.querySelectorAll(this.result)
      );
      if (!resultsArray.length) return;

      switch (event.keyCode) {
        case 38:
          event.preventDefault();
          // Up Arrow
          this.focusResult(false, event, resultsArray);
          break;
        case 40:
          // Down arrow
          this.focusResult(true, event, resultsArray);
          break;
        default:
          break;
      }
    }

    focusResult(nextResult, event, resultsArray) {
      if (resultsArray.length === 1) return;
      const currentIndex = resultsArray.indexOf(this.focussedResult);
      let targetIndex = nextResult
        ? currentIndex + 1
        : currentIndex - 1;
      if (!resultsArray[targetIndex]) {
        targetIndex = nextResult ? 0 : resultsArray.length - 1;
      }
      event.preventDefault();
      this.focussedResult?.classList?.remove('is-highlighted');
      this.focussedResult = resultsArray[targetIndex];
      this.focussedResult.classList.add('is-highlighted');
      this.input.value = this.focussedResult.innerText;
    }

    getQuery() {
      return this.input.value.trim();
    }

    hasQuery() {
      return !!this.getQuery().length;
    }

    onChange() {
      const searchTerm = this.getQuery();

      if (!this.hasQuery()) {
        this.close(true);
        return;
      }

      this.getSearchResults(searchTerm);
    }

    onFormSubmit(event) {
      if (
        !this.hasQuery() ||
        this.querySelector('[aria-selected="true"] a')
      )
        event.preventDefault();
    }

    onFocus() {
      const searchTerm = this.getQuery();

      if (!this.hasQuery()) return;

      if (this.getAttribute('results') === 'true') {
        this.open();
      } else {
        this.getSearchResults(searchTerm);
      }
    }

    onFocusOut() {
      setTimeout(() => {
        if (!this.contains(document.activeElement)) this.close();
      });
    }

    getSearchResults(searchTerm) {
      const queryKey = searchTerm.replace(' ', '-').toLowerCase();

      if (this.cachedResults[queryKey]) {
        this.renderSearchResults(this.cachedResults[queryKey]);
        return;
      }

      fetch(
        `${routes.predictive_search_url}?q=${encodeURIComponent(
          searchTerm
        )}&${this.queryParams}`
      )
        .then(response => {
          if (!response.ok) {
            const error = new Error(response.status);
            this.close();
            throw error;
          }

          return response.text();
        })
        .then(text => {
          const resultsMarkup = new DOMParser()
            .parseFromString(text, 'text/html')
            .querySelector(
              `#shopify-section-${this.searchSection}`
            ).innerHTML;
          this.cachedResults[queryKey] = resultsMarkup;
          this.renderSearchResults(resultsMarkup);
        })
        .catch(error => {
          this.close();
          throw error;
        });
    }

    populateSearchResults(html = '') {
      this.predictiveSearchResults.innerHTML = html;
    }

    renderSearchResults(resultsMarkup) {
      this.populateSearchResults(resultsMarkup);
      this.open();
    }

    open() {
      this.focussedResult = undefined;
      this.setAttribute('open', true);
      this.input.setAttribute('aria-expanded', true);
      this.closeButton = this.querySelector('[data-close]');
      if (this.closeButton) {
        this.closeButton.addEventListener(
          'click',
          this.close.bind(this, false),
          { once: true }
        );
      }
    }

    close(clearSearchTerm = false) {
      if (this.closeButton) {
        this.closeButton.removeEventListener(
          'click',
          this.close.bind(this, false)
        );
        this.closeButton = null;
      }
      if (clearSearchTerm) {
        this.input.value = '';
        this.removeAttribute('open');
        this.predictiveSearchResults.addEventListener(
          'transitionend',
          () => {
            this.populateSearchResults();
          },
          { once: true }
        );
      }
      this.focussedResult = undefined;

      const selected = this.querySelector('[aria-selected="true"]');

      if (selected) selected.setAttribute('aria-selected', false);

      this.input.setAttribute('aria-activedescendant', '');
      this.removeAttribute('open');
      this.input.setAttribute('aria-expanded', false);
    }
  }

  customElements.define('predictive-search', PredictiveSearch);
})();
