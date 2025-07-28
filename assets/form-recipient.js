if (!customElements.get('form-recipient')) {
  customElements.define(
    'form-recipient',
    class FormRecipient extends HTMLElement {
      constructor() {
        super();

        this.selectors = {
          checkbox: '[data-recipient-checkbox]',
          email: '[data-recipient-email]',
          name: '[data-recipient-name]',
          message: '[data-recipient-message]',
          date: '[data-recipient-date]'
        };

        this.addEventListener('change', this.onChange.bind(this));
      }

      connectedCallback() {
        this.elements = {
          checkbox: this.querySelector(this.selectors.checkbox),
          email: this.querySelector(this.selectors.email),
          name: this.querySelector(this.selectors.name),
          message: this.querySelector(this.selectors.message),
          date: this.querySelector(this.selectors.date)
        };

        this.elements.checkbox.disabled = false;

        this.hiddenControlField = this.querySelector(
          `#Recipient-control-${this.dataset.sectionId}`
        );
        this.hiddenControlField.disabled = true;

        this.offsetProperty = this.querySelector(
          `#Recipient-timezone-offset-${this.dataset.sectionId}`
        );

        if (this.offsetProperty)
          this.offsetProperty.value = new Date().getTimezoneOffset();

        this.onChange();
      }

      onChange() {
        if (this.elements.checkbox.checked) {
          this.enableInputFields();
        } else {
          this.resetRecipientForm();
        }
      }

      inputFields() {
        return [
          this.elements.email,
          this.elements.name,
          this.elements.message,
          this.elements.date
        ];
      }

      disableableFields() {
        return [...this.inputFields(), this.offsetProperty];
      }

      clearInputFields() {
        this.inputFields().forEach(field => (field.value = ''));
      }

      enableInputFields() {
        this.disableableFields().forEach(field => {
          field.disabled = false;
        });
      }

      disableInputFields() {
        this.disableableFields().forEach(
          field => (field.disabled = true)
        );
      }

      displayErrorMessage(body) {
        this.clearErrorMessage();

        if (typeof body === 'object') {
          return Object.entries(body).forEach(([key, value]) => {
            const errorMessageId = `RecipientForm-${key}-error-${this.dataset.sectionId}`;
            const errorMessageElement = this.querySelector(
              `#${errorMessageId}`
            );
            const message = `${value.join(', ')}`;
            const errorTextElement =
              errorMessageElement?.querySelector('.js-error-message');

            if (!errorTextElement) return;

            errorTextElement.innerText = `${message}.`;
            errorMessageElement.classList.remove('hidden');

            const inputElement = this[`${key}Input`];
            if (!inputElement) return;

            inputElement.setAttribute('aria-invalid', true);
            inputElement.setAttribute(
              'aria-describedby',
              errorMessageId
            );
          });
        }
      }

      clearErrorMessage() {
        this.querySelectorAll('.js-form-message').forEach(field => {
          field.classList.add('hidden');
          const textField = field.querySelector('.js-error-message');
          if (textField) textField.innerText = '';
        });

        [
          this.elements.email,
          this.elements.message,
          this.elements.name,
          this.elements.date
        ].forEach(inputElement => {
          inputElement.setAttribute('aria-invalid', false);
          inputElement.removeAttribute('aria-describedby');
        });
      }

      resetRecipientForm() {
        if (this.elements.checkbox.checked) {
          this.elements.checkbox.checked = false;
          this.clearInputFields();
          this.disableInputFields();
          this.clearErrorMessage();
        }
      }
    }
  );
}
