['load', 'scroll', 'resize'].forEach(eventName => {
  window.addEventListener(eventName, e => {
    document.documentElement.style.setProperty(
      '--viewport-height',
      `${window.innerHeight}px`
    );
  });
});

const bodyScroll = {
  lock(container) {
    bodyScrollLock.disableBodyScroll(container);
  },
  unlock(container) {
    bodyScrollLock.enableBodyScroll(container);
  },
  clear() {
    bodyScrollLock.clearAllBodyScrollLocks();
  }
};

const onKeyUpEscape = event => {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus();
};

const getFocusableElements = container => {
  return Array.from(
    container.querySelectorAll(
      'summary, a[href], button:enabled, [tabindex]:not([tabindex^=' -
        ']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe'
    )
  );
};

document
  .querySelectorAll('[id^="Details-"] summary')
  .forEach(summary => {
    summary.setAttribute('role', 'button');
    summary.setAttribute(
      'aria-expanded',
      summary.parentNode.hasAttribute('open')
    );

    if (summary.nextElementSibling.getAttribute('id')) {
      summary.setAttribute(
        'aria-controls',
        summary.nextElementSibling.id
      );
    }

    summary.addEventListener('click', event => {
      event.currentTarget.setAttribute(
        'aria-expanded',
        !event.currentTarget.closest('details').hasAttribute('open')
      );
    });

    if (summary.closest('header-drawer')) return;
    summary.parentElement.addEventListener('keyup', onKeyUpEscape);
  });

const trapFocusHandlers = {};

const removeTrapFocus = (elementToFocus = null) => {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener(
    'focusout',
    trapFocusHandlers.focusout
  );
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
};

const trapFocus = (container, elementToFocus = container) => {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = event => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener(
      'keydown',
      trapFocusHandlers.keydown
    );
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();
};

const serializeForm = form => {
  const obj = {};
  const formData = new FormData(form);
  for (const key of formData.keys()) {
    obj[key] = formData.get(key);
  }
  return JSON.stringify(obj);
};

const deepClone = obj => {
  return JSON.parse(JSON.stringify(obj));
};

const handleize = str => str.replace(/[ /_]/g, '-').toLowerCase();

const decode = str => decodeURIComponent(str).replace(/\+/g, ' ');

const getOffsetTop = element => {
  let offsetTop = 0;

  do {
    if (!isNaN(element.offsetTop)) {
      offsetTop += element.offsetTop;
    }
  } while ((element = element.offsetParent));

  return offsetTop;
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');
    this.previousLockedContainer = null;
    this.currentLockedContainer = null;

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach(summary =>
      summary.addEventListener(
        'click',
        this.onSummaryClick.bind(this)
      )
    );
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle &&
      this.closeMenuDrawer(
        event,
        this.mainDetailsToggle.querySelector('summary')
      );
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute('open');
    this.animationDuration = 400;

    if (summaryElement.hasAttribute('data-localization-summary')) {
      return bodyScroll.lock(
        summaryElement.nextElementSibling.querySelector(
          '[data-localization-scroll-container]'
        )
      );
    }

    function addTrapFocus() {
      trapFocus(summaryElement.nextElementSibling);
      summaryElement.nextElementSibling.removeEventListener(
        'transitionend',
        addTrapFocus
      );
    }

    if (isOpen) event.preventDefault();

    if (detailsElement === this.mainDetailsToggle) {
      isOpen
        ? this.closeMenuDrawer(event, summaryElement)
        : this.openMenuDrawer(summaryElement);
    } else {
      setTimeout(() => {
        // Scroll submenus to top to prevent getting stuck
        const parentScrollContainer = detailsElement.closest(
          '[data-scroll-container]'
        );
        const currentScrollContainer = detailsElement.querySelector(
          '[data-scroll-container]'
        );
        [currentScrollContainer, parentScrollContainer].forEach(
          container =>
            container.scroll({
              top: 0
            })
        );

        parentScrollContainer.classList.toggle(
          'has-open-submenu',
          !isOpen
        );

        // Unlock current element and lock the new one
        bodyScroll.unlock(this.currentLockedContainer);
        this.currentLockedContainer =
          summaryElement.nextElementSibling;
        bodyScroll.lock(this.currentLockedContainer);

        detailsElement.classList.toggle('menu-opening', !isOpen);
        summaryElement.setAttribute('aria-expanded', !isOpen);
        isOpen && this.closeAnimation(detailsElement);
      }, 50);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });

    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    const isPredictiveSearchDrawer =
      summaryElement.nextElementSibling.tagName.toLowerCase() ===
      'predictive-search';
    if (isPredictiveSearchDrawer) {
      setTimeout(() => {
        summaryElement.nextElementSibling.input.focus();
      }, 50);
    }
    this.currentLockedContainer =
      this.scrollContainer || summaryElement.nextElementSibling;
    bodyScroll.lock(this.currentLockedContainer);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove('menu-opening');
    this.mainDetailsToggle
      .querySelectorAll('details')
      .forEach(details => {
        details.removeAttribute('open');
        details
          .querySelector('summary')
          .setAttribute('aria-expanded', false);
        details.classList.remove('menu-opening');
      });

    this.closeAnimation(this.mainDetailsToggle);
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (
        this.mainDetailsToggle.hasAttribute('open') &&
        !this.mainDetailsToggle.contains(document.activeElement)
      )
        this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = time => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < this.animationDuration) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        this.toggleScroll(detailsElement);
        if (detailsElement.closest('details[open]')) {
          trapFocus(
            detailsElement.closest('details[open]'),
            detailsElement.querySelector('summary')
          );
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }

  toggleScroll(detailsElement) {
    if (detailsElement == this.mainDetailsToggle) {
      bodyScroll.clear();
      this.previousLockedElement = null;
      this.currentLockedContainer = null;
    }
  }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
    this.scrollContainer = this.querySelector(
      '[data-scroll-container]'
    );

    this.overlay = this.querySelector('[data-drawer-overlay]');

    this.overlay?.addEventListener('click', event => {
      this.closeMenuDrawer(
        event,
        this.mainDetailsToggle.querySelector('summary')
      );
    });
  }

  openMenuDrawer(summaryElement) {
    this.header =
      this.header ||
      document.querySelector(
        '.shopify-section-header header, .shopify-section-header sticky-header'
      );
    document.documentElement.style.setProperty(
      '--header-top-position',
      `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
    );
    this.header.classList.add('menu-open');
    super.openMenuDrawer(summaryElement);
  }

  closeMenuDrawer(event, elementToFocus) {
    super.closeMenuDrawer(event, elementToFocus);
    this.header.classList.remove('menu-open');
  }
}

customElements.define('header-drawer', HeaderDrawer);

function pauseAllMedia(element = document) {
  element.querySelectorAll('.js-youtube').forEach(video => {
    video.contentWindow.postMessage(
      '{"event":"command","func":"' + 'pauseVideo' + '","args":""}',
      '*'
    );
  });
  element.querySelectorAll('.js-vimeo').forEach(video => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  element.querySelectorAll('video').forEach(video => video.pause());
  element.querySelectorAll('product-model').forEach(model => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function resumeMedia(element = document) {
  element
    .querySelectorAll('.js-youtube, .js-vimeo, video')
    .forEach(video => {
      if (!isInViewport(video)) return;
      const postMessage =
        video.classList.contains('js-youtube') &&
        video.tagName !== 'VIDEO'
          ? '{"event":"command","func":"' +
            'playVideo' +
            '","args":""}'
          : video.classList.contains('js-vimeo') &&
            video.tagName !== 'VIDEO'
          ? '{"method":"play"}'
          : null;
      if (postMessage) {
        video.contentWindow.postMessage(postMessage, '*');
      }
      video.tagName === 'VIDEO' && video.play();
    });
}

const debounce = (fn, wait) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
};

const fetchConfig = (type = 'json', method = 'POST') => {
  return {
    method,
    headers: {
      'Content-Type': `application/${type}`,
      'Accept': `application/${type}`
    }
  };
};

const addToCart = (form, sections) => {
  const config = fetchConfig('javascript');
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  delete config.headers['Content-Type'];
  const formData = new FormData(form);
  if (sections) {
    formData.append('sections', sections);
    formData.append('sections_url', window.location.pathname);
  }
  config.body = formData;

  return new Promise((resolve, reject) => {
    fetch(`${routes.cart_add_url}`, config)
      .then(response => response.json())
      .then(response => resolve(response))
      .catch(error => reject(error));
  });
};

class QuantityInput extends HTMLElement {
  constructor() {
    super();

    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });

    this.querySelectorAll('button').forEach(button =>
      button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();

    const previousValue = this.input.value;

    event.target.name === 'increment'
      ? this.input.stepUp()
      : this.input.stepDown();

    if (previousValue !== this.input.value) {
      this.input.dispatchEvent(this.changeEvent);
      return;
    } else {
      const cartItemErrorWrapper = this.closest(
        '.cart-item'
      )?.querySelector('[data-line-item-error]');

      cartItemErrorWrapper &&
        (cartItemErrorWrapper.innerHTML =
          window.cartStrings.quantityError.replace(
            '[quantity]',
            this.input.value
          ));
    }
  }
}

customElements.define('quantity-input', QuantityInput);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');

    if (!button) return;

    button.addEventListener('click', () => {
      this.onButtonClick(button);
    });
  }

  onButtonClick(button) {
    const modal = document.querySelector(
      this.getAttribute('data-modal')
    );

    if (modal) modal.show(button);
  }
}
customElements.define('modal-opener', ModalOpener);

class ModalDialog extends HTMLElement {
  constructor() {
    super();

    this.dialogHolder = this.querySelector('[role="dialog"]');
    this.querySelectorAll('[id^="ModalClose-"]').forEach(button => {
      button.addEventListener('click', this.hide.bind(this, false));
    });
    this.addEventListener('keyup', event => {
      if (event.code?.toUpperCase() === 'ESCAPE') this.hide();
    });
    this.addEventListener('click', event => {
      if (event.target === this) this.hide();
    });
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    this.setAttribute('open', '');
    this.dialogHolder.addEventListener(
      'transitionend',
      () => {
        trapFocus(this, this.dialogHolder);
      },
      { once: true }
    );
    window.pauseAllMedia();
    bodyScroll.lock(this.dialogHolder);
  }

  hide() {
    if (this.hasAttribute('data-remove')) {
      const transitionDisabled = window
        .getComputedStyle(this, null)
        .getPropertyValue('transition')
        .includes('none');
      if (transitionDisabled) {
        this.remove();
      } else {
        this.addEventListener(
          'transitionend',
          () => {
            this.remove();
          },
          { once: true }
        );
      }
    }
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
    resumeMedia();
    bodyScroll.unlock(this.dialogHolder);
  }
}
customElements.define('modal-dialog', ModalDialog);

function isIOS() {
  return (
    /iPad|iPhone|iPod|iPad Simulator|iPhone Simulator|iPod Simulator/.test(
      navigator.platform
    ) ||
    (navigator.platform === 'MacIntel' &&
      navigator.maxTouchPoints > 1)
  );
}

function playYoutubeVideo(video) {
  if (!video.src.includes('enablejsapi=1')) return;

  video.contentWindow.postMessage(
    '{"event":"command","func":"' + 'playVideo' + '","args":""}',
    '*'
  );
}

function playAllYoutubeVideos() {
  const videos = document.querySelectorAll('.js-youtube');

  videos.forEach(video => {
    playYoutubeVideo(video);
  });
}

window.addEventListener('load', () => {
  playAllYoutubeVideos();
});

window.addEventListener('load', () => {
  if (window.innerWidth < 990) {
    document
      .querySelectorAll('.js-autoplay-video')
      .forEach(autoplayVideo => {
        if (autoplayVideo.dataset.stopOnMobile === 'true') {
          window.pauseAllMedia(autoplayVideo);
        }
      });
  }
});

const isInViewport = element => {
  const windowBottom = window.pageYOffset + window.innerHeight;

  return windowBottom >= getOffsetTop(element);
};

['load', 'shopify:section:load', 'scroll'].forEach(event => {
  window.addEventListener(event, () => {
    document.querySelectorAll('[data-fade-in]').forEach(element => {
      if (!isInViewport(element)) {
        return;
      }

      element.classList.add('fade-in');
    });
  });
});
