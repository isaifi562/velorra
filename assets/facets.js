class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);
    this.debouncedOnSubmit = debounce(event => {
      this.onSubmitHandler(event);
    }, 500);

    this.querySelector('form').addEventListener(
      'input',
      this.debouncedOnSubmit.bind(this)
    );

    FacetFiltersForm.AttachShowMoreEvents();
  }

  static AttachShowMoreEvents() {
    document
      .querySelectorAll('[facets-show-more-trigger]')
      .forEach(trigger => {
        trigger.addEventListener(
          'click',
          FacetFiltersForm.handleShowMore
        );
      });
  }

  static setListeners() {
    const onHistoryChange = event => {
      const searchParams = event.state
        ? event.state.searchParams
        : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    };
    window.addEventListener('popstate', onHistoryChange);
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();

    sections.forEach(section => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = element => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl)
        ? FacetFiltersForm.renderSectionFromCache(
            filterDataUrl,
            event
          )
        : FacetFiltersForm.renderSectionFromFetch(url, event);

      if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
    });
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then(response => response.text())
      .then(responseText => {
        const html = responseText;
        FacetFiltersForm.filterData = [
          ...FacetFiltersForm.filterData,
          { html, url }
        ];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
  }

  static renderProductGridContainer(html) {
    document.getElementById('ProductGridContainer').innerHTML =
      new DOMParser()
        .parseFromString(html, 'text/html')
        .getElementById('ProductGridContainer').innerHTML;
  }

  static renderProductCount(html) {
    const count = new DOMParser()
      .parseFromString(html, 'text/html')
      .getElementById('ProductCount');
    const container = document.getElementById('ProductCount');

    if (container) {
      container.innerHTML = count ? count.innerHTML : '';
    }
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(
      html,
      'text/html'
    );

    const facetDetailsElements = parsedHTML.querySelectorAll(
      '#FacetFiltersForm .js-filter'
    );
    const matchesIndex = element => {
      const jsFilter = event
        ? event.target.closest('.js-filter')
        : undefined;
      return jsFilter
        ? element.dataset.index === jsFilter.dataset.index
        : false;
    };
    const facetsToRender = Array.from(facetDetailsElements).filter(
      element => !matchesIndex(element)
    );
    const countsToRender = Array.from(facetDetailsElements).find(
      matchesIndex
    );

    facetsToRender.forEach(element => {
      const elementToUpdate = document.querySelector(
        `.js-filter[data-index="${element.dataset.index}"]`
      );
      elementToUpdate.innerHTML = element.innerHTML;
      if (elementToUpdate.tagName === 'DROPDOWN-INPUT')
        elementToUpdate.init();
    });

    FacetFiltersForm.renderActiveFacets(parsedHTML);

    if (countsToRender)
      FacetFiltersForm.renderCounts(
        countsToRender,
        event.target.closest('.js-filter')
      );

    FacetFiltersForm.AttachShowMoreEvents();
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelector = '.js-facets-active';
    const activeFacetsElement = html.querySelector(
      activeFacetElementSelector
    );

    if (!activeFacetsElement) return;
    document.querySelector(activeFacetElementSelector).outerHTML =
      activeFacetsElement.outerHTML;
  }

  static renderCounts(source, target) {
    const selector = '.js-facets-selected';
    const targetElement = target.querySelector(selector);
    const sourceElement = source.querySelector(selector);

    if (sourceElement && targetElement) {
      target.querySelector(selector).outerHTML =
        source.querySelector(selector).outerHTML;
    }
  }

  static updateURLHash(searchParams) {
    history.pushState(
      { searchParams },
      '',
      `${window.location.pathname}${
        searchParams && '?'.concat(searchParams)
      }`
    );
  }

  static getSections() {
    return [
      {
        section: document.querySelector('facet-filters-form').dataset
          .sectionId
      }
    ];
  }

  static handleShowMore(e) {
    e.preventDefault();

    e.target
      .closest('.facet--hide-extra')
      ?.classList.remove('facet--hide-extra');
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const context = event.target.id.includes('desktop')
      ? 'mobile'
      : 'desktop';
    const formData = new FormData();
    const formDataElements = Array.from(
      event.target.closest('form').elements
    ).filter(
      element =>
        !element.id.includes(context) || element.name === 'sort_by'
    );
    for (const element of formDataElements) {
      if (!element.name) continue;
      if (element.type === 'checkbox') {
        if (element.checked) {
          formData.append(element.name, element.value);
        }
      } else {
        formData.append(element.name, element.value);
      }
    }
    const searchParams = new URLSearchParams(formData).toString();
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    const url =
      event.currentTarget.href.indexOf('?') == -1
        ? ''
        : event.currentTarget.href.slice(
            event.currentTarget.href.indexOf('?') + 1
          );
    FacetFiltersForm.renderPage(url);
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial =
  window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.inputs = this.querySelectorAll('input');
    this.inputs.forEach(element =>
      element.addEventListener(
        'change',
        this.onRangeChange.bind(this)
      )
    );

    this.activeColor = this.getAttribute('data-range-active-color');
    this.inactiveColor = this.getAttribute(
      'data-range-inactive-color'
    );

    this.minValue = this.inputs[0].min;
    this.maxValue = this.inputs[1].max;

    this.setMinAndMaxValues();
  }

  connectedCallback() {
    this.fromSlider = this.querySelector('[js-price-range-from]');
    this.toSlider = this.querySelector('[js-price-range-to]');
    this.fromInput = this.querySelector(
      '[name="filter.v.price.gte"]'
    );
    this.toInput = this.querySelector('[name="filter.v.price.lte"]');
    this.fillSlider(this.fromSlider, this.toSlider, this.toSlider);
    this.setToggleAccessible(this.toSlider);

    this.fromSlider.oninput = () => this.controlFromSlider();
    this.toSlider.oninput = () => this.controlToSlider();
    this.fromInput.oninput = () =>
      this.controlFromInput(this.toSlider);
    this.toInput.oninput = () => this.controlToInput(this.toSlider);
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }

  setMinAndMaxValues() {
    const minInput = this.inputs[0];
    const maxInput = this.inputs[1];
    if (maxInput.value) minInput.setAttribute('max', maxInput.value);
    if (minInput.value) maxInput.setAttribute('min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('min', 0);
    if (maxInput.value === '')
      minInput.setAttribute('max', maxInput.getAttribute('max'));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('min'));
    const max = Number(input.getAttribute('max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }

  controlFromInput(controlSlider) {
    const [from, to] = this.getParsed(this.fromInput, this.toInput);
    this.fillSlider(this.fromInput, this.toInput, controlSlider);
    if (from > to) {
      this.fromSlider.value = to;
      this.fromInput.value = to;
    } else {
      this.fromSlider.value = from;
    }
  }

  controlToInput(controlSlider) {
    const [from, to] = this.getParsed(this.fromInput, this.toInput);
    this.fillSlider(this.fromInput, this.toInput, controlSlider);
    this.setToggleAccessible(this.toInput);
    if (from <= to) {
      this.toSlider.value = to;
      this.toInput.value = to;
    } else {
      this.toInput.value = from;
    }
  }

  controlFromSlider() {
    const [from, to] = this.getParsed(this.fromSlider, this.toSlider);
    this.fillSlider(this.fromSlider, this.toSlider, this.toSlider);
    if (from > to) {
      this.fromSlider.value = to;
      this.fromInput.value = to;
    } else {
      this.fromInput.value = from;
    }
  }

  controlToSlider() {
    const [from, to] = this.getParsed(this.fromSlider, this.toSlider);
    this.fillSlider(this.fromSlider, this.toSlider, this.toSlider);
    this.setToggleAccessible(this.toSlider);
    if (from <= to) {
      this.toSlider.value = to;
      this.toInput.value = to;
    } else {
      this.toInput.value = from;
      this.toSlider.value = from;
    }
  }

  getParsed(currentFrom, currentTo) {
    const from = parseFloat(currentFrom.value, 10);
    const to = parseFloat(currentTo.value, 10);
    return [from, to];
  }

  fillSlider(from, to, controlSlider) {
    const rangeDistance = this.maxValue - this.minValue;
    const fromPosition = from.value - this.minValue;
    const toPosition = to.value - this.minValue;
    controlSlider.style.background = `linear-gradient(
        to right,
        ${this.inactiveColor} 0%,
        ${this.inactiveColor} ${
      (fromPosition / rangeDistance) * 100
    }%,
        ${this.activeColor} ${(fromPosition / rangeDistance) * 100}%,
        ${this.activeColor} ${(toPosition / rangeDistance) * 100}%,
        ${this.inactiveColor} ${(toPosition / rangeDistance) * 100}%,
        ${this.inactiveColor} 100%)`;
  }

  setToggleAccessible(currentTarget) {
    if (Number(currentTarget.value) <= 0) {
      this.toSlider.style.zIndex = 2;
    } else {
      this.toSlider.style.zIndex = 0;
    }
  }
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    this.querySelector('a').addEventListener('click', event => {
      event.preventDefault();
      const form =
        this.closest('facet-filters-form') ||
        document.querySelector('facet-filters-form');
      form.onActiveFilterClick(event);
    });
  }
}

customElements.define('facet-remove', FacetRemove);

class FacetFilters extends customElements.get('dropdown-disclosure') {
  constructor() {
    super();

    this.container = this.querySelector('summary').nextElementSibling;
  }

  open(summaryElement, detailsElement) {
    if (
      window.innerWidth >= Number(this.container.dataset.breakpoint)
    ) {
      const facetsWrapper = this.closest('[data-facets-container]');
      const headerOffset =
        document.querySelector('sticky-header[data-sticky]')
          ?.clientHeight || 0;
      const wrapperTopOffset = facetsWrapper.offsetTop;
      const scrollTargetPosition = wrapperTopOffset - headerOffset;
      window.scrollTo({
        top: scrollTargetPosition,
        behavior: 'smooth'
      });
      this.style.setProperty(
        '--facets-dropdown-max-height',
        `calc(100vmin - ${
          facetsWrapper.getBoundingClientRect().height * 0.1
        }rem - var(--header-offset, 0))`
      );
      super.open(summaryElement, detailsElement);
      return;
    }

    bodyScroll.lock(
      this.container.querySelector('[data-facets-body]')
    );
    super.open(summaryElement, detailsElement);
  }

  close(event, summaryElement, detailsElement) {
    if (
      window.innerWidth >= Number(this.container.dataset.breakpoint)
    ) {
      super.close(event, summaryElement, detailsElement);
      return;
    }

    bodyScroll.unlock(
      this.container.querySelector('[data-facets-body]')
    );
    super.close(event, summaryElement, detailsElement);
  }
}

customElements.define('facet-filters', FacetFilters);
