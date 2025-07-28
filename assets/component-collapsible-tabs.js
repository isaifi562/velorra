class CollapsibleTabs extends HTMLElement {
  constructor() {
    super();
    this.settings = {
      classes: {
        active: 'is-active'
      },
      selectors: {
        button: '[data-nav-button]',
        tab: '[data-tab]'
      }
    };
    this.buttons = this.querySelectorAll(
      this.settings.selectors.button
    );
    this.buttons.forEach(button => {
      button.addEventListener('click', this.onButtonClick.bind(this));
    });
  }

  onButtonClick(event) {
    event.preventDefault();
    const target = event.target.getAttribute('href');
    if (!target) return;
    this.toggleTab(target);
  }

  toggleTab(target) {
    this.querySelectorAll(
      `${this.settings.selectors.tab}, ${this.settings.selectors.button}`
    ).forEach(tab =>
      tab.classList.remove(this.settings.classes.active)
    );
    this.querySelector(target).classList.add(
      this.settings.classes.active
    );
    Array.from(this.buttons)
      .find(button => button.getAttribute('href') === target)
      .classList.add(this.settings.classes.active);
  }
}

customElements.define('collapsible-tabs', CollapsibleTabs);
