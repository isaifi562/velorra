if (!customElements.get('countdown-timer')) {
  class CountdownTimer extends HTMLElement {
    constructor() {
      super();

      this.elements = {
        subheading: this.querySelector('[data-subheading]'),
        expireText: this.querySelector('[data-expire-text]'),
        expireDate: this.querySelector('[data-expire-date]'),
        offerLink: this.querySelector('[data-offer-link]'),
        expiredLink: this.querySelector('[data-expired-link]'),
        counter: {
          days: this.querySelector('[data-counter-days]'),
          hours: this.querySelector('[data-counter-hours]'),
          minutes: this.querySelector('[data-counter-minutes]'),
          seconds: this.querySelector('[data-counter-seconds]')
        }
      };
    }

    connectedCallback() {
      this.init();
    }

    init() {
      if (!this.elements.expireDate) return;

      const endDate = Number(
        this.elements.expireDate.getAttribute('datetime')
      );
      let nowDate = Number(this.dataset.currentTime);
      const interval = setInterval(() => {
        const diff = endDate - nowDate;

        if (diff <= 0) {
          clearInterval(interval);
          this.setCounter({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
          });
          this.setExpired();
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (diff % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        this.setCounter({ days, hours, minutes, seconds });
        nowDate = nowDate + 1000;
      }, 1000);
    }

    setCounter({ days, hours, minutes, seconds }) {
      this.elements.counter.days.textContent =
        days < 10 ? `0${days}` : days;
      this.elements.counter.hours.textContent =
        hours < 10 ? `0${hours}` : hours;
      this.elements.counter.minutes.textContent =
        minutes < 10 ? `0${minutes}` : minutes;
      this.elements.counter.seconds.textContent =
        seconds < 10 ? `0${seconds}` : seconds;
    }

    setExpired() {
      this.hasAttribute('data-pdp') && this.classList.add('hidden');
      this.elements.subheading?.classList.add('hidden');
      this.elements.offerLink?.classList.add('hidden');
      this.elements.expireText?.classList.remove('hidden');
      this.elements.expiredLink?.classList.remove('hidden');
    }
  }

  customElements.define('countdown-timer', CountdownTimer);
}
