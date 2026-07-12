(() => {
  'use strict';

  const state = {
    initialized: false,
    handlers: [],
    activeModal: null,
    lastFocusedElement: null
  };

  const qsAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const on = (element, eventName, handler, options) => {
    if (!element) return;
    element.addEventListener(eventName, handler, options);
    state.handlers.push({ element, eventName, handler, options });
  };

  const injectStyles = () => {
    if (document.getElementById('app-ui-style')) return;

    const style = document.createElement('style');
    style.id = 'app-ui-style';
    style.textContent = `
      .is-hidden {
        display: none !important;
      }

      [data-modal] {
        display: none;
      }

      [data-modal].is-open {
        display: block;
      }

      body.modal-open,
      body.menu-open {
        overflow: hidden;
      }

      [data-tab-panel] {
        display: none;
      }

      [data-tab-panel].is-active {
        display: block;
      }

      .is-invalid {
        border-color: #d93025 !important;
      }

      .form-message {
        margin-top: 12px;
      }

      .form-message.is-error {
        color: #d93025;
      }

      .form-message.is-success {
        color: #188038;
      }

      .ui-toast-root {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 9999;
        display: grid;
        gap: 10px;
        max-width: min(360px, calc(100vw - 40px));
      }

      .ui-toast {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
        border-radius: 12px;
        color: #ffffff;
        background: #222222;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
      }

      .ui-toast--success {
        background: #188038;
      }

      .ui-toast--error {
        background: #d93025;
      }

      .ui-toast--warning {
        background: #f29900;
      }

      .ui-toast__close {
        border: 0;
        padding: 0;
        color: inherit;
        background: transparent;
        font: inherit;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  };

  const setExpanded = (element, value) => {
    if (!element) return;
    element.setAttribute('aria-expanded', String(value));
  };

  const setHidden = (element, value) => {
    if (!element) return;
    element.hidden = value;
    element.setAttribute('aria-hidden', String(value));
  };

  const initMenu = () => {
    const toggle = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-menu]');

    if (!toggle || !menu) return;

    const setOpen = (isOpen) => {
      toggle.classList.toggle('is-active', isOpen);
      menu.classList.toggle('is-open', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
      setExpanded(toggle, isOpen);
      setHidden(menu, !isOpen);
    };

    setOpen(menu.classList.contains('is-open'));

    on(toggle, 'click', () => {
      setOpen(!menu.classList.contains('is-open'));
    });

    qsAll('a', menu).forEach((link) => {
      on(link, 'click', () => setOpen(false));
    });
  };

  const initClassToggles = () => {
    qsAll('[data-toggle-class]').forEach((button) => {
      on(button, 'click', () => {
        const className = button.dataset.toggleClass || 'is-active';
        const targetSelector = button.dataset.target;
        const target = targetSelector ? document.querySelector(targetSelector) : button;

        if (!target) return;

        const isActive = target.classList.toggle(className);
        button.classList.toggle('is-active', isActive);
        setExpanded(button, isActive);
      });
    });
  };

  const initAccordions = () => {
    qsAll('[data-accordion]').forEach((accordion) => {
      const closeOthers = accordion.hasAttribute('data-accordion-single');
      const triggers = qsAll('[data-accordion-trigger]', accordion);

      triggers.forEach((trigger) => {
        const panelName = trigger.dataset.accordionTrigger;
        const panel = panelName
          ? accordion.querySelector(`[data-accordion-panel='${panelName}']`) || document.getElementById(panelName)
          : trigger.nextElementSibling;

        if (!panel) return;

        const startOpen = trigger.classList.contains('is-active') || panel.classList.contains('is-active');
        trigger.classList.toggle('is-active', startOpen);
        panel.classList.toggle('is-active', startOpen);
        setExpanded(trigger, startOpen);
        setHidden(panel, !startOpen);

        on(trigger, 'click', () => {
          const shouldOpen = !trigger.classList.contains('is-active');

          if (closeOthers) {
            triggers.forEach((otherTrigger) => {
              const otherName = otherTrigger.dataset.accordionTrigger;
              const otherPanel = otherName
                ? accordion.querySelector(`[data-accordion-panel='${otherName}']`) || document.getElementById(otherName)
                : otherTrigger.nextElementSibling;

              otherTrigger.classList.remove('is-active');
              setExpanded(otherTrigger, false);
              if (otherPanel) {
                otherPanel.classList.remove('is-active');
                setHidden(otherPanel, true);
              }
            });
          }

          trigger.classList.toggle('is-active', shouldOpen);
          panel.classList.toggle('is-active', shouldOpen);
          setExpanded(trigger, shouldOpen);
          setHidden(panel, !shouldOpen);
        });
      });
    });
  };

  const initTabs = () => {
    qsAll('[data-tabs]').forEach((tabs) => {
      const triggers = qsAll('[data-tab]', tabs);
      const panels = qsAll('[data-tab-panel]', tabs);

      if (!triggers.length || !panels.length) return;

      const activate = (name) => {
        triggers.forEach((trigger) => {
          const isActive = trigger.dataset.tab === name;
          trigger.classList.toggle('is-active', isActive);
          trigger.setAttribute('aria-selected', String(isActive));
          trigger.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        panels.forEach((panel) => {
          const isActive = panel.dataset.tabPanel === name;
          panel.classList.toggle('is-active', isActive);
          setHidden(panel, !isActive);
        });
      };

      const current = triggers.find((trigger) => trigger.classList.contains('is-active')) || triggers[0];
      activate(current.dataset.tab);

      triggers.forEach((trigger) => {
        on(trigger, 'click', () => activate(trigger.dataset.tab));
      });
    });
  };

  const getModal = (id) => {
    return qsAll('[data-modal]').find((modal) => modal.dataset.modal === id);
  };

  const getFocusableElements = (root) => {
    return qsAll('a[href], button, input, select, textarea, [tabindex]', root)
      .filter((element) => !element.disabled && element.tabIndex !== -1 && element.offsetParent !== null);
  };

  const openModal = (modal) => {
    if (!modal) return;

    state.lastFocusedElement = document.activeElement;
    state.activeModal = modal;

    modal.classList.add('is-open');
    setHidden(modal, false);
    document.body.classList.add('modal-open');

    const focusable = getFocusableElements(modal);
    if (focusable.length) {
      focusable[0].focus();
    } else {
      modal.setAttribute('tabindex', '-1');
      modal.focus();
    }
  };

  const closeModal = (modal = state.activeModal) => {
    if (!modal) return;

    modal.classList.remove('is-open');
    setHidden(modal, true);
    document.body.classList.remove('modal-open');

    if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === 'function') {
      state.lastFocusedElement.focus();
    }

    state.activeModal = null;
    state.lastFocusedElement = null;
  };

  const initModals = () => {
    qsAll('[data-modal]').forEach((modal) => {
      setHidden(modal, !modal.classList.contains('is-open'));
    });

    qsAll('[data-modal-open]').forEach((button) => {
      on(button, 'click', () => {
        openModal(getModal(button.dataset.modalOpen));
      });
    });

    qsAll('[data-modal-close]').forEach((button) => {
      on(button, 'click', () => closeModal(button.closest('[data-modal]')));
    });

    on(document, 'click', (event) => {
      const modal = event.target.closest('[data-modal]');
      if (!modal || event.target !== modal) return;
      closeModal(modal);
    });

    on(document, 'keydown', (event) => {
      if (!state.activeModal) return;

      if (event.key === 'Escape') {
        closeModal();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(state.activeModal);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  };

  const isEmailValid = (value) => {
    const trimmed = String(value || '').trim();
    return trimmed.includes('@') && trimmed.includes('.') && trimmed.length >= 5;
  };

  const validateForm = (form) => {
    const fields = qsAll('input, textarea, select', form);
    const errors = [];

    fields.forEach((field) => {
      const value = String(field.value || '').trim();
      let valid = true;

      if (field.hasAttribute('required') && !value) {
        valid = false;
        errors.push('Заполните обязательные поля.');
      }

      if (field.type === 'email' && value && !isEmailValid(value)) {
        valid = false;
        errors.push('Введите корректный email.');
      }

      field.classList.toggle('is-invalid', !valid);
      field.setAttribute('aria-invalid', String(!valid));
    });

    return {
      valid: errors.length === 0,
      message: errors[0] || 'Форма заполнена корректно.'
    };
  };

  const showFormMessage = (form, message, type) => {
    let box = form.querySelector('[data-form-message]');

    if (!box) {
      box = document.createElement('div');
      box.className = 'form-message';
      box.dataset.formMessage = '';
      form.appendChild(box);
    }

    box.textContent = message;
    box.classList.toggle('is-error', type === 'error');
    box.classList.toggle('is-success', type === 'success');
  };

  const initForms = () => {
    qsAll('form[data-form]').forEach((form) => {
      on(form, 'submit', (event) => {
        const result = validateForm(form);

        if (!result.valid) {
          event.preventDefault();
          showFormMessage(form, result.message, 'error');
          return;
        }

        if (form.hasAttribute('data-prevent-submit')) {
          event.preventDefault();
          showFormMessage(form, result.message, 'success');
          showToast('Форма готова к отправке.', { type: 'success' });
        }
      });
    });
  };

  const createToastRoot = () => {
    let root = document.querySelector('[data-toast-root]');

    if (!root) {
      root = document.createElement('div');
      root.className = 'ui-toast-root';
      root.dataset.toastRoot = '';
      document.body.appendChild(root);
    }

    return root;
  };

  const showToast = (message, options = {}) => {
    const root = createToastRoot();
    const type = options.type || 'info';
    const duration = Number(options.duration) || 3500;
    const toast = document.createElement('div');
    const closeButton = document.createElement('button');

    toast.className = `ui-toast ui-toast--${type}`;
    toast.setAttribute('role', 'status');
    toast.textContent = message;

    closeButton.type = 'button';
    closeButton.className = 'ui-toast__close';
    closeButton.setAttribute('aria-label', 'Закрыть уведомление');
    closeButton.textContent = '×';

    toast.appendChild(closeButton);
    root.appendChild(toast);

    const remove = () => toast.remove();

    on(closeButton, 'click', remove);
    window.setTimeout(remove, duration);

    return toast;
  };

  const initTheme = () => {
    const buttons = qsAll('[data-theme-toggle]');
    if (!buttons.length) return;

    const storageKey = 'app-theme';

    const applyTheme = (theme) => {
      document.documentElement.dataset.theme = theme;
      buttons.forEach((button) => {
        button.classList.toggle('is-active', theme === 'dark');
        setExpanded(button, theme === 'dark');
      });
    };

    let savedTheme = 'light';

    try {
      savedTheme = localStorage.getItem(storageKey) || 'light';
    } catch (error) {
      savedTheme = 'light';
    }

    applyTheme(savedTheme);

    buttons.forEach((button) => {
      on(button, 'click', () => {
        const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);

        try {
          localStorage.setItem(storageKey, nextTheme);
        } catch (error) {
          return;
        }
      });
    });
  };

  const init = () => {
    if (state.initialized) return;
    state.initialized = true;

    injectStyles();
    initMenu();
    initClassToggles();
    initAccordions();
    initTabs();
    initModals();
    initForms();
    initTheme();

    document.documentElement.classList.add('ui-ready');
  };

  const destroy = () => {
    state.handlers.forEach(({ element, eventName, handler, options }) => {
      element.removeEventListener(eventName, handler, options);
    });

    state.handlers = [];
    state.activeModal = null;
    state.lastFocusedElement = null;
    state.initialized = false;
  };

  window.AppUI = {
    init,
    destroy,
    openModalById: (id) => openModal(getModal(id)),
    closeModal,
    showToast
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
