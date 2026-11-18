(() => {
  const theme = window.theme || {};
  const routes = theme.routes || {};
  const strings = theme.strings || {};
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  const parseHTML = (html) => new DOMParser().parseFromString(html, 'text/html');

  const debounce = (fn, wait = 250) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  };

  const storage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        return null;
      }
      return value;
    }
  };

  const formatMoney = (cents) => {
    const format = theme.moneyFormat || '{{amount}}';
    const value = Number(cents) || 0;
    const placeholder = /\{\{\s*(\w+)\s*\}\}/;
    const group = (amount, precision, thousands, decimal) => {
      const fixed = (amount / 100).toFixed(precision);
      const [whole, fraction] = fixed.split('.');
      const withSeparators = whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
      let result = fraction ? `${withSeparators}${decimal}${fraction}` : withSeparators;
      if (theme.moneyTrim && fraction && /^0+$/.test(fraction)) result = withSeparators;
      return result;
    };
    const match = format.match(placeholder);
    let formatted;
    switch (match ? match[1] : 'amount') {
      case 'amount_no_decimals':
        formatted = group(value, 0, ',', '.');
        break;
      case 'amount_with_comma_separator':
        formatted = group(value, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        formatted = group(value, 0, '.', ',');
        break;
      case 'amount_with_apostrophe_separator':
        formatted = group(value, 2, "'", '.');
        break;
      case 'amount_no_decimals_with_space_separator':
        formatted = group(value, 0, ' ', ',');
        break;
      case 'amount_with_space_separator':
        formatted = group(value, 2, ' ', ',');
        break;
      case 'amount_with_period_and_space_separator':
        formatted = group(value, 2, ' ', '.');
        break;
      default:
        formatted = group(value, 2, ',', '.');
    }
    const text = format.replace(placeholder, formatted);
    const tmp = document.createElement('div');
    tmp.innerHTML = text;
    return tmp.textContent || text;
  };
  theme.formatMoney = formatMoney;

  const openModal = (dialog, opener) => {
    if (!dialog || dialog.open) return;
    dialog.themeOpener = opener || document.activeElement;
    dialog.classList.remove('is-closing');
    dialog.showModal();
    root.classList.add('scroll-lock');
    dialog.dispatchEvent(new CustomEvent('modal:open', { bubbles: true }));
  };

  const closeModal = (dialog) => {
    if (!dialog || !dialog.open || dialog.classList.contains('is-closing')) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      dialog.classList.remove('is-closing');
      dialog.close();
      if (!document.querySelector('dialog.modal[open]')) root.classList.remove('scroll-lock');
      const opener = dialog.themeOpener;
      if (opener && document.contains(opener) && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
      dialog.dispatchEvent(new CustomEvent('modal:close', { bubbles: true }));
    };
    if (prefersReduced) {
      finish();
      return;
    }
    dialog.classList.add('is-closing');
    dialog.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 420);
  };
  theme.openModal = openModal;
  theme.closeModal = closeModal;

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-modal-open]');
    if (opener) {
      const dialog = document.getElementById(opener.dataset.modalOpen);
      if (dialog) {
        event.preventDefault();
        openModal(dialog, opener);
        return;
      }
    }
    const closer = event.target.closest('[data-modal-close]');
    if (closer) {
      const dialog = closer.closest('dialog');
      if (dialog) {
        event.preventDefault();
        closeModal(dialog);
        return;
      }
    }
    if (event.target instanceof HTMLDialogElement && event.target.classList.contains('modal')) {
      const rect = event.target.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) closeModal(event.target);
    }
  });

  document.addEventListener(
    'cancel',
    (event) => {
      if (event.target instanceof HTMLDialogElement && event.target.classList.contains('modal')) {
        event.preventDefault();
        closeModal(event.target);
      }
    },
    true
  );

  const updateCartCount = (count) => {
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.hidden = Number(count) === 0;
    });
    document.querySelectorAll('[data-cart-count-text]').forEach((el) => {
      el.textContent = count;
    });
  };

  const getDrawer = () => document.querySelector('cart-drawer');

  const sectionsToRender = () => {
    const drawer = getDrawer();
    return drawer ? [drawer.dataset.sectionId] : [];
  };

  const renderSections = (sections) => {
    if (!sections) return;
    const drawer = getDrawer();
    if (drawer && sections[drawer.dataset.sectionId]) drawer.renderFrom(sections[drawer.dataset.sectionId]);
  };

  const refreshCartCount = () =>
    fetch(`${routes.cart}.js`)
      .then((response) => response.json())
      .then((cart) => updateCartCount(cart.item_count))
      .catch(() => {});

  const afterCartChange = (data) => {
    renderSections(data.sections);
    if (typeof data.item_count === 'number') updateCartCount(data.item_count);
    else refreshCartCount();
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
  };

  const addToCart = async (items) => {
    const body = { items };
    const sections = sectionsToRender();
    if (sections.length) {
      body.sections = sections.join(',');
      body.sections_url = window.location.pathname;
    }
    const response = await fetch(`${routes.cartAdd}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok || data.status) throw new Error(data.description || data.message || strings.error);
    return data;
  };

  const afterAdd = (data) => {
    document.dispatchEvent(new CustomEvent('cart:added', { detail: data }));
    if (theme.cartType === 'checkout') {
      window.location.href = '/checkout';
      return;
    }
    if (theme.cartType === 'page' || !getDrawer()) {
      window.location.href = routes.cart;
      return;
    }
    afterCartChange(data);
    document.querySelectorAll('dialog.quick-view-modal[open]').forEach((dialog) => {
      dialog.themeOpener = null;
      closeModal(dialog);
    });
    getDrawer().open();
  };

  theme.addToCart = addToCart;
  theme.afterAdd = afterAdd;

  class CartDrawer extends HTMLElement {
    connectedCallback() {
      this.dialog = this.querySelector('dialog');
      this.addEventListener('click', (event) => {
        const button = event.target.closest('[data-line-change]');
        if (!button) return;
        event.preventDefault();
        this.changeLine(button.dataset.line, Number(button.dataset.quantity));
      });
      this.addEventListener('change', (event) => {
        const input = event.target.closest('[data-line-input]');
        if (input) this.changeLine(input.dataset.line, Number(input.value));
      });
    }

    open(opener) {
      openModal(this.dialog, opener);
    }

    close() {
      closeModal(this.dialog);
    }

    renderFrom(html) {
      const doc = parseHTML(html);
      const next = doc.querySelector('[data-cart-drawer-inner]');
      const current = this.querySelector('[data-cart-drawer-inner]');
      if (next && current) current.replaceWith(next);
      const countSource = doc.querySelector('[data-cart-item-count]');
      if (countSource) updateCartCount(countSource.dataset.cartItemCount);
    }

    async changeLine(line, quantity) {
      this.setAttribute('aria-busy', 'true');
      try {
        const response = await fetch(`${routes.cartChange}.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            line: Number(line),
            quantity: Math.max(0, quantity),
            sections: this.dataset.sectionId,
            sections_url: window.location.pathname
          })
        });
        afterCartChange(await response.json());
      } finally {
        this.removeAttribute('aria-busy');
      }
    }
  }
  customElements.define('cart-drawer', CartDrawer);

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-cart-open]');
    if (!trigger || theme.cartType === 'page') return;
    const drawer = getDrawer();
    if (!drawer) return;
    event.preventDefault();
    drawer.open(trigger);
  });

  class CartUpsell extends HTMLElement {
    connectedCallback() {
      const url = this.dataset.url;
      if (!url) return;
      CartUpsell.cache = CartUpsell.cache || new Map();
      if (CartUpsell.cache.has(url)) {
        this.fill(CartUpsell.cache.get(url));
        return;
      }
      fetch(url)
        .then((response) => response.text())
        .then((html) => {
          const doc = parseHTML(html);
          const results = doc.querySelector('[data-cart-upsell-results]');
          const markup = results ? results.innerHTML : '';
          CartUpsell.cache.set(url, markup);
          this.fill(markup);
        })
        .catch(() => {});
    }

    fill(markup) {
      const target = this.querySelector('[data-cart-upsell-target]');
      if (!target) return;
      target.innerHTML = markup;
      this.hidden = !target.querySelector('[data-upsell-item]');
    }
  }
  customElements.define('cart-upsell', CartUpsell);

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('form[data-product-form]');
    if (!form) return;
    event.preventDefault();
    const missing = Array.from(form.elements).find(
      (el) => el.hasAttribute && el.hasAttribute('data-required-property') && !el.disabled && !String(el.value || '').trim()
    );
    if (missing) {
      if (missing.reportValidity) missing.reportValidity();
      missing.focus();
      return;
    }
    const button = form.querySelector('[type="submit"]');
    const errorEl = form.querySelector('[data-form-error]');
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    button?.setAttribute('aria-busy', 'true');
    try {
      const formData = new FormData(form);
      const item = { id: Number(formData.get('id')), quantity: Number(formData.get('quantity') || 1) };
      const properties = {};
      for (const [key, value] of formData.entries()) {
        const match = key.match(/^properties\[(.+)\]$/);
        if (match && value) properties[match[1]] = value;
      }
      if (Object.keys(properties).length) item.properties = properties;
      if (formData.get('selling_plan')) item.selling_plan = Number(formData.get('selling_plan'));
      const items = [item];
      const info = form.closest('product-info');
      if (info && form.id === 'ProductForm-' + info.dataset.section) {
        info.querySelectorAll('input[data-upsell-addon]:checked').forEach((input) => {
          if (input.value) items.push({ id: Number(input.value), quantity: 1 });
        });
      }
      afterAdd(await addToCart(items));
    } catch (error) {
      if (errorEl) {
        errorEl.textContent = error.message;
        errorEl.hidden = false;
      }
    } finally {
      button?.removeAttribute('aria-busy');
    }
  });

  class BundleAdd extends HTMLElement {
    connectedCallback() {
      this.button = this.querySelector('button');
      this.errorEl = this.querySelector('[data-form-error]');
      this.button?.addEventListener('click', () => this.add());
    }

    async add() {
      const ids = (this.dataset.variantIds || '').split(',').filter(Boolean);
      if (!ids.length) return;
      this.button.setAttribute('aria-busy', 'true');
      if (this.errorEl) this.errorEl.hidden = true;
      try {
        afterAdd(await addToCart(ids.map((id) => ({ id: Number(id), quantity: 1 }))));
      } catch (error) {
        if (this.errorEl) {
          this.errorEl.textContent = error.message;
          this.errorEl.hidden = false;
        }
      } finally {
        this.button.removeAttribute('aria-busy');
      }
    }
  }
  customElements.define('bundle-add', BundleAdd);

  class FbtBundle extends HTMLElement {
    connectedCallback() {
      if (this.dataset.load === 'true') this.load();
      else this.init();
    }

    async load() {
      try {
        const response = await fetch(this.dataset.url);
        const doc = parseHTML(await response.text());
        const next = doc.querySelector('fbt-bundle');
        if (next && next.querySelector('[data-fbt-item]:not([data-fbt-current])')) {
          this.innerHTML = next.innerHTML;
          this.dataset.load = 'false';
          this.init();
        } else {
          this.closest('.shopify-section')?.setAttribute('hidden', '');
        }
      } catch (error) {
        this.closest('.shopify-section')?.setAttribute('hidden', '');
      }
    }

    init() {
      if (this.ready) return;
      this.ready = true;
      this.addEventListener('change', () => this.update());
      this.querySelector('[data-fbt-add]')?.addEventListener('click', () => this.add());
      this.update();
    }

    items() {
      return Array.from(this.querySelectorAll('[data-fbt-item]')).map((item) => {
        const check = item.querySelector('[data-fbt-check]');
        const select = item.querySelector('[data-fbt-variant]');
        const option = select ? select.selectedOptions[0] : null;
        return {
          el: item,
          on: check ? check.checked : true,
          id: Number(option ? option.value : item.dataset.variantId),
          price: Number(option ? option.dataset.price : item.dataset.price),
          available: option ? !option.disabled : item.dataset.available !== 'false'
        };
      });
    }

    update() {
      let total = 0;
      let count = 0;
      this.items().forEach((item) => {
        const priceEl = item.el.querySelector('[data-fbt-price]');
        if (priceEl) priceEl.textContent = formatMoney(item.price);
        const thumb = this.querySelector(`[data-fbt-thumb="${item.el.dataset.fbtItem}"]`);
        thumb?.classList.toggle('is-off', !item.on);
        if (item.on && item.available) {
          total += item.price;
          count += 1;
        }
      });
      const totalEl = this.querySelector('[data-fbt-total]');
      if (totalEl) totalEl.textContent = formatMoney(total);
      const button = this.querySelector('[data-fbt-add]');
      if (button) button.disabled = count === 0;
      const label = this.querySelector('[data-fbt-label]');
      if (label && label.dataset.template) label.textContent = label.dataset.template.replace('[count]', count);
    }

    async add() {
      const items = this.items()
        .filter((item) => item.on && item.available && item.id)
        .map((item) => ({ id: item.id, quantity: 1 }));
      if (!items.length) return;
      const button = this.querySelector('[data-fbt-add]');
      const errorEl = this.querySelector('[data-form-error]');
      button?.setAttribute('aria-busy', 'true');
      if (errorEl) errorEl.hidden = true;
      try {
        afterAdd(await addToCart(items));
      } catch (error) {
        if (errorEl) {
          errorEl.textContent = error.message;
          errorEl.hidden = false;
        }
      } finally {
        button?.removeAttribute('aria-busy');
      }
    }
  }
  customElements.define('fbt-bundle', FbtBundle);

  class QuantityInput extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('input');
      this.addEventListener('click', (event) => {
        const button = event.target.closest('button[name]');
        if (!button || !this.input) return;
        event.preventDefault();
        const step = Number(this.input.step) || 1;
        const min = Number(this.input.min) || 0;
        const current = Number(this.input.value) || min;
        const next = button.name === 'plus' ? current + step : Math.max(min, current - step);
        if (next === current) return;
        this.input.value = next;
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  }
  customElements.define('quantity-input', QuantityInput);

  class TabList extends HTMLElement {
    connectedCallback() {
      this.tabs = Array.from(this.querySelectorAll('[role="tab"]'));
      this.tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => this.select(index));
        tab.addEventListener('keydown', (event) => {
          const rtl = root.dir === 'rtl';
          let next = null;
          if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) next = (index + 1) % this.tabs.length;
          if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) next = (index - 1 + this.tabs.length) % this.tabs.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = this.tabs.length - 1;
          if (next !== null) {
            event.preventDefault();
            this.select(next);
            this.tabs[next].focus();
          }
        });
      });
    }

    select(index) {
      const apply = () => {
        this.tabs.forEach((tab, i) => {
          const selected = i === index;
          tab.setAttribute('aria-selected', String(selected));
          tab.tabIndex = selected ? 0 : -1;
          const panel = document.getElementById(tab.getAttribute('aria-controls'));
          if (panel) panel.hidden = !selected;
        });
      };
      if (document.startViewTransition && !prefersReduced) document.startViewTransition(apply);
      else apply();
    }
  }
  customElements.define('tab-list', TabList);

  class ProductInfo extends HTMLElement {}
  customElements.define('product-info', ProductInfo);

  class VariantPicker extends HTMLElement {
    connectedCallback() {
      this.addEventListener('change', () => this.onChange());
    }

    async onChange() {
      const info = this.closest('product-info');
      if (!info) return;
      const variants = JSON.parse(info.querySelector('[data-product-variants]')?.textContent || '[]');
      const selected = Array.from(this.querySelectorAll('[data-option]')).map((option) => {
        const select = option.querySelector('select');
        return select ? select.value : option.querySelector('input:checked')?.value;
      });
      const variant = variants.find((v) => v.options.every((option, i) => option === selected[i]));

      this.querySelectorAll('[data-option]').forEach((option, i) => {
        const label = option.querySelector('[data-selected-value]');
        if (label) label.textContent = selected[i] || '';
      });

      info.querySelectorAll('form[data-product-form] input[name="id"]').forEach((input) => {
        input.value = variant ? variant.id : '';
      });

      if (!variant) {
        info.querySelectorAll('[data-add-button]').forEach((button) => {
          button.disabled = true;
          const label = button.querySelector('[data-add-label]');
          if (label) label.textContent = strings.unavailable;
        });
        return;
      }

      if (info.dataset.updateUrl === 'true') {
        const url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }

      if (variant.featured_media) info.querySelector('media-gallery')?.goTo(variant.featured_media.id);

      if (info.dataset.clientRender === 'true') {
        const priceEl = info.querySelector('[data-update="price"]');
        if (priceEl) {
          const sale = variant.compare_at_price > variant.price;
          priceEl.innerHTML = `<div class="price${sale ? ' price--on-sale' : ''}"><span class="price__current">${formatMoney(variant.price)}</span>${sale ? `<s class="price__compare">${formatMoney(variant.compare_at_price)}</s>` : ''}</div>`;
        }
        info.querySelectorAll('[data-add-button]').forEach((button) => {
          button.disabled = !variant.available;
          const label = button.querySelector('[data-add-label]');
          if (label) label.textContent = variant.available ? strings.addToCart : strings.soldOut;
        });
        info.dispatchEvent(new CustomEvent('variant:change', { detail: { variant }, bubbles: true }));
        return;
      }

      try {
        const response = await fetch(`${info.dataset.url}?variant=${variant.id}&section_id=${info.dataset.section}`);
        const doc = parseHTML(await response.text());
        info.querySelectorAll('[data-update]').forEach((el) => {
          const next = doc.querySelector(`[data-update="${el.dataset.update}"]`);
          if (next) el.innerHTML = next.innerHTML;
        });
      } catch (error) {
        info.querySelectorAll('[data-add-button]').forEach((button) => {
          button.disabled = !variant.available;
        });
      }
      info.dispatchEvent(new CustomEvent('variant:change', { detail: { variant }, bubbles: true }));
    }
  }
  customElements.define('variant-picker', VariantPicker);

  class MediaGallery extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-gallery-track]');
      if (!this.track) return;
      this.slides = Array.from(this.track.querySelectorAll('[data-media-id]'));
      this.current = 0;
      this.querySelector('[data-gallery-prev]')?.addEventListener('click', () => this.step(-1));
      this.querySelector('[data-gallery-next]')?.addEventListener('click', () => this.step(1));
      this.addEventListener('click', (event) => {
        const nav = event.target.closest('[data-thumb], [data-dot]');
        if (nav) {
          this.goTo(nav.dataset.thumb || nav.dataset.dot);
          return;
        }
        const zoom = event.target.closest('[data-zoom]');
        if (zoom) this.openZoom(zoom.dataset.zoom, zoom);
      });
      if ('IntersectionObserver' in window && this.slides.length > 1) {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              this.current = this.slides.indexOf(entry.target);
              const id = entry.target.dataset.mediaId;
              this.querySelectorAll('[data-thumb], [data-dot]').forEach((el) => {
                el.setAttribute('aria-current', String((el.dataset.thumb || el.dataset.dot) === id));
              });
            });
          },
          { root: this.track, threshold: 0.6 }
        );
        this.slides.forEach((slide) => this.observer.observe(slide));
      }
    }

    disconnectedCallback() {
      this.observer?.disconnect();
    }

    scrollToSlide(slide) {
      if (!slide) return;
      const behavior = prefersReduced ? 'auto' : 'smooth';
      if (this.track.scrollWidth > this.track.clientWidth + 2) {
        const delta = slide.getBoundingClientRect().left - this.track.getBoundingClientRect().left;
        this.track.scrollBy({ left: delta, behavior });
      } else {
        slide.scrollIntoView({ behavior, block: 'nearest' });
      }
    }

    goTo(id) {
      this.scrollToSlide(this.slides.find((slide) => slide.dataset.mediaId === String(id)));
    }

    step(direction) {
      const next = Math.min(this.slides.length - 1, Math.max(0, this.current + direction));
      this.scrollToSlide(this.slides[next]);
    }

    openZoom(id, opener) {
      const dialog = document.getElementById(this.dataset.zoomTarget);
      if (!dialog) return;
      openModal(dialog, opener);
      const target = dialog.querySelector(`[data-zoom-media="${id}"]`);
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    }
  }
  customElements.define('media-gallery', MediaGallery);

  class CardSlider extends HTMLElement {
    connectedCallback() {
      this.tracks = Array.from(this.querySelectorAll('[data-slider-track]'));
      if (!this.tracks.length) return;
      this.prev = this.querySelector('[data-slider-prev]');
      this.next = this.querySelector('[data-slider-next]');
      this.prev?.addEventListener('click', () => this.move(-1));
      this.next?.addEventListener('click', () => this.move(1));
      this.onChange = () => this.update();
      this.tracks.forEach((track) => track.addEventListener('scroll', this.onChange, { passive: true }));
      if ('ResizeObserver' in window) {
        this.observer = new ResizeObserver(this.onChange);
        this.tracks.forEach((track) => this.observer.observe(track));
      }
      this.addEventListener('click', (event) => {
        if (event.target.closest('[role="tab"]')) requestAnimationFrame(this.onChange);
      });
      this.update();
    }

    disconnectedCallback() {
      this.observer?.disconnect();
    }

    get track() {
      return (this.tracks || []).find((track) => track.offsetParent !== null) || (this.tracks || [])[0];
    }

    move(direction) {
      const track = this.track;
      if (!track) return;
      const first = track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = first ? first.getBoundingClientRect().width + gap : track.clientWidth;
      const rtl = getComputedStyle(track).direction === 'rtl';
      track.scrollBy({ left: step * direction * (rtl ? -1 : 1), behavior: prefersReduced ? 'auto' : 'smooth' });
    }

    update() {
      const track = this.track;
      if (!track) return;
      const max = track.scrollWidth - track.clientWidth;
      const position = Math.abs(track.scrollLeft);
      if (this.prev) this.prev.disabled = position <= 2;
      if (this.next) this.next.disabled = position >= max - 2;
      this.toggleAttribute('data-scrollable', max > 2);
    }
  }
  customElements.define('card-slider', CardSlider);

  class StickyAtc extends HTMLElement {
    connectedCallback() {
      const target = document.getElementById(this.dataset.target);
      if (!target || !('IntersectionObserver' in window)) return;
      this.observer = new IntersectionObserver(([entry]) => {
        const passed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        this.classList.toggle('is-visible', passed);
        root.classList.toggle('has-sticky-atc', passed && getComputedStyle(this).display !== 'none');
      });
      this.observer.observe(target);
    }

    disconnectedCallback() {
      this.observer?.disconnect();
      root.classList.remove('has-sticky-atc');
    }
  }
  customElements.define('sticky-atc', StickyAtc);

  document.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-quick-view]');
    if (!trigger) return;
    const modal = document.getElementById('QuickViewModal');
    if (!modal) return;
    event.preventDefault();
    const url = trigger.dataset.quickView;
    const content = modal.querySelector('[data-quick-view-content]');
    content.innerHTML = `<div class="quick-view-modal__loading" role="status"><span class="spinner" aria-hidden="true"></span><span class="visually-hidden">${strings.loading || ''}</span></div>`;
    openModal(modal, trigger);
    try {
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}section_id=quick-view`);
      if (!response.ok) throw new Error(response.statusText);
      const doc = parseHTML(await response.text());
      const section = doc.querySelector('.quick-view');
      if (!section) throw new Error('missing');
      content.innerHTML = '';
      content.appendChild(document.importNode(section, true));
      const heading = content.querySelector('[data-quick-view-title]');
      if (heading) {
        modal.setAttribute('aria-labelledby', heading.id);
        heading.focus({ preventScroll: true });
      }
    } catch (error) {
      window.location.href = url;
    }
  });

  class PredictiveSearch extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('input[type="search"]');
      this.results = this.querySelector('[data-predictive-results]');
      this.status = this.querySelector('[data-predictive-status]');
      if (!this.input || !this.results || !routes.predictiveSearch) return;
      this.input.setAttribute('aria-controls', this.results.id);
      this.input.addEventListener('input', debounce(() => this.search(), 250));
      this.addEventListener('keydown', (event) => this.onKeydown(event));
    }

    links() {
      return Array.from(this.results.querySelectorAll('a'));
    }

    onKeydown(event) {
      if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
      const links = this.links();
      if (!links.length) return;
      event.preventDefault();
      const index = links.indexOf(document.activeElement);
      if (event.key === 'ArrowDown') links[index + 1 < links.length ? index + 1 : 0].focus();
      else if (index <= 0) this.input.focus();
      else links[index - 1].focus();
    }

    async search() {
      const query = this.input.value.trim();
      if (query.length < 2) {
        this.results.innerHTML = '';
        this.results.hidden = true;
        this.input.setAttribute('aria-expanded', 'false');
        return;
      }
      this.controller?.abort();
      this.controller = new AbortController();
      const params = new URLSearchParams({
        q: query,
        'resources[type]': 'product,collection,page,article,query',
        'resources[limit]': '6',
        'resources[limit_scope]': 'each',
        section_id: 'predictive-search'
      });
      try {
        const response = await fetch(`${routes.predictiveSearch}?${params}`, { signal: this.controller.signal });
        const doc = parseHTML(await response.text());
        const next = doc.querySelector('[data-predictive-inner]');
        this.results.innerHTML = next ? next.outerHTML : '';
        this.results.hidden = !next;
        this.input.setAttribute('aria-expanded', String(Boolean(next)));
        if (this.status && next) this.status.textContent = next.dataset.status || '';
      } catch (error) {
        if (error.name !== 'AbortError') this.results.hidden = true;
      }
    }
  }
  customElements.define('predictive-search', PredictiveSearch);

  class CountdownTimer extends HTMLElement {
    connectedCallback() {
      this.end = Date.parse(this.dataset.end || '');
      if (Number.isNaN(this.end)) {
        if (window.Shopify && window.Shopify.designMode) this.querySelector('[data-countdown-invalid]')?.removeAttribute('hidden');
        else this.hidden = true;
        return;
      }
      this.number = new Intl.NumberFormat(root.lang || undefined, { minimumIntegerDigits: 2 });
      this.units = {
        days: this.querySelector('[data-unit="days"]'),
        hours: this.querySelector('[data-unit="hours"]'),
        minutes: this.querySelector('[data-unit="minutes"]'),
        seconds: this.querySelector('[data-unit="seconds"]')
      };
      this.tick();
      this.timer = setInterval(() => this.tick(), 1000);
    }

    disconnectedCallback() {
      clearInterval(this.timer);
    }

    tick() {
      const diff = this.end - Date.now();
      if (diff <= 0) {
        clearInterval(this.timer);
        this.finish();
        return;
      }
      const total = Math.floor(diff / 1000);
      const values = {
        days: Math.floor(total / 86400),
        hours: Math.floor((total % 86400) / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60
      };
      Object.entries(values).forEach(([unit, value]) => {
        if (this.units[unit]) this.units[unit].textContent = this.number.format(value);
      });
      this.querySelector('[data-countdown-clock]')?.removeAttribute('hidden');
    }

    finish() {
      if (this.dataset.expired === 'message') {
        this.querySelector('[data-countdown-clock]')?.setAttribute('hidden', '');
        this.querySelector('[data-countdown-done]')?.removeAttribute('hidden');
        return;
      }
      if (window.Shopify && window.Shopify.designMode) return;
      const target = this.closest('[data-countdown-container]') || this;
      target.hidden = true;
    }
  }
  customElements.define('countdown-timer', CountdownTimer);

  class DeliveryInfo extends HTMLElement {
    connectedCallback() {
      this.renderEstimate();
      this.setupZones();
    }

    renderEstimate() {
      const el = this.querySelector('[data-delivery-estimate]');
      if (!el) return;
      const min = Number(this.dataset.min) || 0;
      const max = Math.max(min, Number(this.dataset.max) || min);
      const cutoff = Number(this.dataset.cutoff);
      const skip = (this.dataset.skip || '')
        .split(',')
        .filter((value) => value !== '')
        .map(Number);
      if (skip.length >= 7) return;
      const now = new Date();
      const start = new Date(now);
      if (!Number.isNaN(cutoff) && now.getHours() >= cutoff) start.setDate(start.getDate() + 1);
      const addBusinessDays = (date, days) => {
        const result = new Date(date);
        while (skip.includes(result.getDay())) result.setDate(result.getDate() + 1);
        let added = 0;
        while (added < days) {
          result.setDate(result.getDate() + 1);
          if (!skip.includes(result.getDay())) added += 1;
        }
        return result;
      };
      const formatter = new Intl.DateTimeFormat(root.lang || undefined, { weekday: 'short', day: 'numeric', month: 'short' });
      const from = formatter.format(addBusinessDays(start, min));
      const to = formatter.format(addBusinessDays(start, max));
      const template = el.dataset.template || '[start] - [end]';
      el.textContent = min === max ? (el.dataset.templateSingle || template).replace('[start]', from).replace('[end]', to) : template.replace('[start]', from).replace('[end]', to);
      el.closest('[data-estimate-row]')?.removeAttribute('hidden');
    }

    setupZones() {
      const select = this.querySelector('[data-zone-select]');
      const zones = Array.from(this.querySelectorAll('.delivery-zone'));
      if (!select || !zones.length) return;
      zones.forEach((zone, zoneIndex) => {
        const group = document.createElement('optgroup');
        group.label = zone.dataset.zoneName || '';
        (zone.dataset.governorates || '')
          .split(/[\n,،]+/)
          .map((name) => name.trim())
          .filter(Boolean)
          .forEach((name) => group.appendChild(new Option(name, `${zoneIndex}|${name}`)));
        if (group.children.length) select.appendChild(group);
      });
      if (this.dataset.layout === 'selector') {
        this.querySelector('[data-zone-table]')?.setAttribute('hidden', '');
        this.querySelector('[data-zone-picker]')?.removeAttribute('hidden');
      }
      const result = this.querySelector('[data-zone-result]');
      const show = () => {
        if (!result) return;
        const [zoneIndex] = select.value.split('|');
        const zone = zones[Number(zoneIndex)];
        if (!select.value || !zone) {
          result.hidden = true;
          return;
        }
        const parts = [zone.dataset.time, zone.dataset.fee].filter(Boolean);
        result.textContent = parts.join(' · ');
        result.hidden = !parts.length;
      };
      const saved = storage.get('theme:governorate');
      if (saved && Array.from(select.options).some((option) => option.value === saved)) select.value = saved;
      select.addEventListener('change', () => {
        storage.set('theme:governorate', select.value);
        show();
      });
      show();
    }
  }
  customElements.define('delivery-info', DeliveryInfo);

  class FacetForm extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      if (!this.form) return;
      let timer;
      this.addEventListener('input', (event) => {
        if (!event.target.form || event.target.form !== this.form) return;
        if (this.querySelector('dialog[open]')) return;
        clearTimeout(timer);
        const delay = event.target.type === 'number' ? 700 : 0;
        timer = setTimeout(() => this.submit(), delay);
      });
      this.form.addEventListener('submit', (event) => {
        event.preventDefault();
        this.submit();
      });
    }

    submit() {
      const params = new URLSearchParams(new FormData(this.form));
      for (const [key, value] of Array.from(params.entries())) {
        if (value === '') params.delete(key);
      }
      window.location.search = params.toString();
    }
  }
  customElements.define('facet-form', FacetForm);

  document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-localization-select]');
    if (select && select.form) select.form.submit();
  });

  const initHeader = () => {
    const header = document.querySelector('.site-header, [data-site-header]');
    if (!header) return;
    const wrapper = header.closest('.shopify-section') || header;
    const sticky = header.dataset.sticky;
    const transparent = header.hasAttribute('data-transparent');
    const setHeight = () => {
      root.style.setProperty('--header-height', sticky === 'none' ? '0px' : `${wrapper.offsetHeight}px`);
      if (transparent) root.style.setProperty('--header-overlap', `${header.offsetHeight}px`);
      else root.style.removeProperty('--header-overlap');
    };
    setHeight();
    if ('ResizeObserver' in window) {
      initHeader.observer?.disconnect();
      initHeader.observer = new ResizeObserver(setHeight);
      initHeader.observer.observe(wrapper);
    }
    if (initHeader.onScroll) window.removeEventListener('scroll', initHeader.onScroll);
    initHeader.onScroll = null;
    if (initHeader.onSolid) window.removeEventListener('scroll', initHeader.onSolid);
    initHeader.onSolid = null;
    if (transparent && sticky !== 'none') {
      initHeader.onSolid = () => header.classList.toggle('is-solid', window.scrollY > 12);
      initHeader.onSolid();
      window.addEventListener('scroll', initHeader.onSolid, { passive: true });
    }
    if (sticky !== 'scroll_up') return;
    let last = window.scrollY;
    initHeader.onScroll = () => {
      const y = window.scrollY;
      const menuOpen = document.querySelector('dialog.modal[open]') || header.querySelector('details[open]');
      if (!menuOpen) {
        if (y > last && y > wrapper.offsetHeight + 60) wrapper.classList.add('header-hidden');
        else if (y < last - 4 || y < 10) wrapper.classList.remove('header-hidden');
      }
      last = y;
    };
    window.addEventListener('scroll', initHeader.onScroll, { passive: true });
  };
  initHeader();

  const reveal = (() => {
    const enabled = root.classList.contains('reveal-enabled');
    if (!enabled || prefersReduced || !('IntersectionObserver' in window)) return { scan() {} };

    const sectionSelector = '#MainContent > .shopify-section, .footer-section';
    const blockSelector = [
      '.section-header',
      '.faq__intro',
      '.bundle',
      '.statement',
      '.image-text',
      '.product-hero',
      '.custom-section',
      '.countdown-banner',
      '.fbt',
      '.product-reviews__header'
    ].join(',');
    const itemSelector = [
      '.product-grid > li',
      '.collection-list > *',
      '.trust-bar > *',
      '.testimonials > *',
      '.product-reviews__grid > *',
      '.list-collections > li',
      '.blog-grid > li',
      '.faq__list > *',
      '.hero__media > *',
      '.icon-list__items > *',
      '.slider-track > *'
    ].join(',');
    const stagger = root.classList.contains('reveal-stagger');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    const inView = (el) => el.getBoundingClientRect().top < window.innerHeight * 0.92;

    const prepare = (el, delay) => {
      if (el.classList.contains('reveal') || inView(el)) return;
      el.classList.add('reveal');
      if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);
      observer.observe(el);
    };

    const scan = (scope = document) => {
      const sections =
        scope.matches && scope.matches(sectionSelector) ? [scope] : Array.from(scope.querySelectorAll(sectionSelector));
      sections.forEach((section) => {
        if (section.querySelector('[data-no-reveal]')) return;
        if (stagger && section.querySelector(itemSelector)) {
          section.querySelectorAll(blockSelector).forEach((el) => prepare(el, 0));
          section.querySelectorAll(itemSelector).forEach((el) => {
            const index = Array.from(el.parentElement.children).indexOf(el);
            prepare(el, Math.min(index, 6) * 80);
          });
        } else {
          prepare(section, 0);
        }
      });
    };

    return { scan };
  })();

  reveal.scan();

  document.addEventListener('shopify:section:load', (event) => {
    reveal.scan(event.target);
    event.target.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-revealed'));
    if (event.target.querySelector('.site-header, [data-site-header]')) initHeader();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('details[data-escape-close][open]').forEach((details) => {
      details.removeAttribute('open');
      details.querySelector('summary')?.focus();
    });
  });

  document.addEventListener('click', (event) => {
    document.querySelectorAll('details[data-click-outside][open]').forEach((details) => {
      if (!details.contains(event.target)) details.removeAttribute('open');
    });
  });
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener(
      'pointermove',
      (event) => {
        const media = event.target.closest && event.target.closest('.product-card__media[data-browse]');
        if (!media) return;
        const count = Number(media.dataset.browse);
        const rect = media.getBoundingClientRect();
        let ratio = (event.clientX - rect.left) / rect.width;
        if (root.dir === 'rtl') ratio = 1 - ratio;
        const index = String(Math.min(count, Math.max(1, Math.floor(ratio * count) + 1)));
        if (media.dataset.active !== index) media.dataset.active = index;
      },
      { passive: true }
    );
    document.addEventListener('pointerout', (event) => {
      const media = event.target.closest && event.target.closest('.product-card__media[data-browse]');
      if (media && !media.contains(event.relatedTarget)) delete media.dataset.active;
    });
  }

  class TypingHints extends HTMLElement {
    connectedCallback() {
      const words = (this.dataset.hints || '')
        .split(',')
        .map((word) => word.trim())
        .filter(Boolean);
      this.target = this.querySelector('[data-typing-text]');
      if (!this.target || !words.length) return;
      if (prefersReduced) {
        this.target.textContent = words[0];
        return;
      }
      let word = 0;
      let length = 0;
      let deleting = false;
      const tick = () => {
        const current = words[word];
        length += deleting ? -1 : 1;
        this.target.textContent = current.slice(0, length);
        let delay = deleting ? 40 : 85;
        if (!deleting && length >= current.length) {
          deleting = true;
          delay = 1800;
        } else if (deleting && length <= 0) {
          deleting = false;
          word = (word + 1) % words.length;
          delay = 350;
        }
        this.timer = setTimeout(tick, delay);
      };
      tick();
    }

    disconnectedCallback() {
      clearTimeout(this.timer);
    }
  }
  customElements.define('typing-hints', TypingHints);

  class SlideShow extends HTMLElement {
    connectedCallback() {
      this.slides = Array.from(this.querySelectorAll('[data-slide]'));
      this.dots = Array.from(this.querySelectorAll('[data-slide-dot]'));
      this.pauseButton = this.querySelector('[data-slide-pause]');
      this.counter = this.querySelector('[data-slide-current]');
      this.ring = this.querySelector('[data-slide-ring]');
      this.index = 0;
      this.interval = Number(this.dataset.interval) || 6000;
      this.autoplay = this.dataset.autoplay === 'true' && !prefersReduced && this.slides.length > 1;
      this.style.setProperty('--slide-interval', `${this.interval}ms`);
      this.slides.forEach((slide, i) => this.setState(slide, i === 0));
      if (this.slides[0]) this.slides[0].classList.add('is-active');
      this.updatePauseButton();
      if (this.slides.length < 2) return;

      this.dots.forEach((dot, i) =>
        dot.addEventListener('click', () => {
          this.go(i);
          this.restart();
        })
      );
      this.querySelector('[data-slide-prev]')?.addEventListener('click', () => {
        this.go(this.index - 1);
        this.restart();
      });
      this.querySelector('[data-slide-next]')?.addEventListener('click', () => {
        this.go(this.index + 1);
        this.restart();
      });
      this.pauseButton?.addEventListener('click', () => this.togglePause());

      this.addEventListener('pointerdown', (event) => {
        this.startX = event.clientX;
        this.startY = event.clientY;
      });
      this.addEventListener('pointerup', (event) => {
        if (this.startX == null) return;
        const dx = event.clientX - this.startX;
        const dy = event.clientY - this.startY;
        this.startX = null;
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
        const forward = dx < 0 ? root.dir !== 'rtl' : root.dir === 'rtl';
        this.go(this.index + (forward ? 1 : -1));
        this.restart();
      });
      this.addEventListener('mouseenter', () => {
        this.hovering = true;
        this.stop();
      });
      this.addEventListener('mouseleave', () => {
        this.hovering = false;
        this.start();
      });
      this.addEventListener('focusin', () => this.stop());
      this.addEventListener('focusout', () => this.start());
      this.addEventListener('shopify:block:select', (event) => {
        const i = this.slides.indexOf(event.target);
        if (i < 0) return;
        this.editorHold = true;
        this.go(i);
        this.stop();
      });
      this.addEventListener('shopify:block:deselect', () => {
        this.editorHold = false;
        this.start();
      });

      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(([entry]) => {
          this.visible = entry.isIntersecting;
          if (this.visible) this.start();
          else this.stop();
        });
        this.observer.observe(this);
      } else {
        this.visible = true;
        this.start();
      }
    }

    disconnectedCallback() {
      this.stop();
      this.observer?.disconnect();
    }

    setState(slide, active) {
      slide.toggleAttribute('inert', !active);
      slide.setAttribute('aria-hidden', String(!active));
    }

    go(target) {
      const count = this.slides.length;
      const next = (target + count) % count;
      if (next === this.index) return;
      this.slides.forEach((item) => item.classList.remove('is-first-load'));
      const current = this.slides[this.index];
      current.classList.remove('is-active');
      current.classList.add('is-leaving');
      clearTimeout(current.leaveTimer);
      current.leaveTimer = setTimeout(() => current.classList.remove('is-leaving'), 1400);
      this.setState(current, false);
      const slide = this.slides[next];
      slide.classList.remove('is-leaving');
      slide.classList.add('is-active');
      this.setState(slide, true);
      this.index = next;
      this.dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === next)));
      if (this.counter) this.counter.textContent = String(next + 1);
      if (this.timer) this.tickRing();
    }

    tickRing() {
      if (!this.ring) return;
      this.ring.classList.remove('is-ticking');
      void this.ring.offsetWidth;
      this.ring.classList.add('is-ticking');
    }

    start() {
      if (!this.autoplay || this.paused || this.hovering || this.editorHold || !this.visible) return;
      this.stop();
      this.timer = setInterval(() => this.go(this.index + 1), this.interval);
      this.classList.add('is-playing');
      this.tickRing();
    }

    stop() {
      clearInterval(this.timer);
      this.timer = null;
      this.classList.remove('is-playing');
      this.ring?.classList.remove('is-ticking');
    }

    restart() {
      this.stop();
      this.start();
    }

    togglePause() {
      this.paused = !this.paused;
      if (this.paused) this.stop();
      else this.start();
      this.updatePauseButton();
    }

    updatePauseButton() {
      if (!this.pauseButton) return;
      this.pauseButton.hidden = !this.autoplay;
      this.pauseButton.setAttribute('aria-pressed', String(Boolean(this.paused)));
      this.pauseButton.setAttribute('aria-label', this.paused ? strings.play : strings.pause);
      this.pauseButton.classList.toggle('is-paused', Boolean(this.paused));
    }
  }
  customElements.define('slide-show', SlideShow);

  class ScrollProgress extends HTMLElement {
    connectedCallback() {
      if (prefersReduced) {
        this.style.setProperty('--p', this.dataset.staticProgress || '0.5');
        this.classList.add('is-static');
        return;
      }
      this.onScroll = () => {
        if (this.ticking) return;
        this.ticking = true;
        requestAnimationFrame(() => {
          this.ticking = false;
          this.update();
        });
      };
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) this.listen();
          else this.unlisten();
        });
        this.observer.observe(this);
      } else {
        this.listen();
      }
      this.update();
    }

    disconnectedCallback() {
      this.observer?.disconnect();
      this.unlisten();
    }

    listen() {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onScroll);
      this.update();
    }

    unlisten() {
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onScroll);
    }

    update() {
      const rect = this.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      this.style.setProperty('--p', progress.toFixed(4));
      this.classList.toggle('is-complete', progress > 0.9);
    }
  }
  customElements.define('scroll-progress', ScrollProgress);

  class ArcGallery extends HTMLElement {
    connectedCallback() {
      this.stage = this.querySelector('[data-arc-stage]');
      this.items = Array.from(this.querySelectorAll('[data-arc-item]'));
      this.captions = Array.from(this.querySelectorAll('[data-arc-caption]'));
      this.counter = this.querySelector('[data-arc-counter]');
      if (!this.stage || !this.items.length) return;
      this.index = Math.floor((this.items.length - 1) / 2);
      this.items.forEach((item, i) => {
        item.style.setProperty('--i', i);
        item.addEventListener('click', () => this.go(i));
      });
      this.querySelector('[data-arc-prev]')?.addEventListener('click', () => this.go(this.index - 1));
      this.querySelector('[data-arc-next]')?.addEventListener('click', () => this.go(this.index + 1));
      this.stage.addEventListener('pointerdown', (event) => {
        this.startX = event.clientX;
      });
      this.stage.addEventListener('pointerup', (event) => {
        if (this.startX == null) return;
        const dx = event.clientX - this.startX;
        this.startX = null;
        if (Math.abs(dx) < 40) return;
        const forward = dx < 0 ? root.dir !== 'rtl' : root.dir === 'rtl';
        this.go(this.index + (forward ? 1 : -1));
      });
      this.addEventListener('shopify:block:select', (event) => {
        const i = this.items.indexOf(event.target);
        if (i > -1) this.go(i);
      });
      if ('ResizeObserver' in window) {
        this.observer = new ResizeObserver(() => this.layout());
        this.observer.observe(this.stage);
      }
      this.layout();
    }

    disconnectedCallback() {
      this.observer?.disconnect();
    }

    layout() {
      const width = this.stage.clientWidth;
      const itemWidth = this.items[0].offsetWidth || 200;
      const radius = Math.max(width * 0.8, itemWidth * 3.2);
      const gap = Math.max(12, itemWidth * 0.08);
      this.step = ((itemWidth + gap) / radius) * (180 / Math.PI);
      this.style.setProperty('--arc-radius', `${Math.round(radius)}px`);
      this.style.setProperty('--arc-step', `${this.step.toFixed(3)}deg`);
      this.render();
    }

    go(target) {
      const count = this.items.length;
      this.index = Math.min(count - 1, Math.max(0, target));
      this.render();
    }

    render() {
      this.style.setProperty('--arc-index', this.index);
      const limit = 58;
      this.items.forEach((item, i) => {
        const angle = Math.abs(i - this.index) * (this.step || 12);
        item.classList.toggle('is-active', i === this.index);
        item.classList.toggle('is-far', angle > limit);
        item.setAttribute('aria-current', String(i === this.index));
      });
      this.captions.forEach((caption, i) => {
        caption.hidden = i !== this.index;
      });
      if (this.counter) this.counter.textContent = `${this.index + 1} / ${this.items.length}`;
      const prev = this.querySelector('[data-arc-prev]');
      const next = this.querySelector('[data-arc-next]');
      if (prev) prev.disabled = this.index === 0;
      if (next) next.disabled = this.index === this.items.length - 1;
    }
  }
  customElements.define('arc-gallery', ArcGallery);

  class SetBuilder extends HTMLElement {
    connectedCallback() {
      this.slots = Array.from(this.querySelectorAll('[data-set-slot]'));
      this.state = this.slots.map(() => null);
      this.required = this.dataset.required === 'true';
      this.addButton = this.querySelector('[data-set-add]');
      this.totalEl = this.querySelector('[data-set-total]');
      this.errorEl = this.querySelector('[data-form-error]');
      this.tabs = this.querySelector('tab-list');
      this.addEventListener('click', (event) => {
        const pick = event.target.closest('[data-set-pick]');
        if (pick) {
          this.pick(pick);
          return;
        }
        const remove = event.target.closest('[data-set-remove]');
        if (remove) this.clear(Number(remove.dataset.setRemove));
      });
      this.addEventListener('change', (event) => {
        const select = event.target.closest('[data-set-variant]');
        if (!select) return;
        const option = select.selectedOptions[0];
        const price = select.closest('[data-set-item]')?.querySelector('[data-set-price]');
        if (price && option) price.textContent = formatMoney(option.dataset.price);
      });
      this.addButton?.addEventListener('click', () => this.add());
      this.render();
    }

    pick(button) {
      const item = button.closest('[data-set-item]');
      const step = Number(button.closest('[data-set-step]')?.dataset.setStep || 0);
      if (!item || step >= this.state.length) return;
      const select = item.querySelector('[data-set-variant]');
      const option = select ? select.selectedOptions[0] : null;
      if (option && option.disabled) return;
      const id = Number(option ? option.value : item.dataset.variantId);
      if (!id) return;
      this.state[step] = {
        id,
        title: item.dataset.title,
        image: item.dataset.image,
        price: Number(option ? option.dataset.price : item.dataset.price) || 0
      };
      this.render();
      const nextEmpty = this.state.findIndex((entry) => !entry);
      if (nextEmpty > -1 && nextEmpty !== step && this.tabs && typeof this.tabs.select === 'function') {
        this.tabs.select(nextEmpty);
      }
    }

    clear(index) {
      this.state[index] = null;
      this.render();
    }

    render() {
      this.slots.forEach((slot, i) => {
        const entry = this.state[i];
        slot.classList.toggle('is-filled', Boolean(entry));
        const image = slot.querySelector('img');
        if (image) {
          if (entry && entry.image) {
            image.src = entry.image;
            image.alt = entry.title || '';
            image.hidden = false;
          } else {
            image.hidden = true;
            image.removeAttribute('src');
          }
        }
        const title = slot.querySelector('[data-slot-title]');
        if (title) title.textContent = entry ? entry.title : '';
        const remove = slot.querySelector('[data-set-remove]');
        if (remove) remove.hidden = !entry;
      });
      const ids = this.state.filter(Boolean).map((entry) => String(entry.id));
      this.querySelectorAll('[data-set-item]').forEach((item) => {
        const select = item.querySelector('[data-set-variant]');
        const id = select ? select.value : item.dataset.variantId;
        item.classList.toggle('is-picked', ids.includes(String(id)));
      });
      const filled = this.state.filter(Boolean);
      if (this.totalEl) this.totalEl.textContent = formatMoney(filled.reduce((sum, entry) => sum + entry.price, 0));
      this.querySelectorAll('[data-set-count]').forEach((el) => {
        el.textContent = filled.length;
      });
      const ready = this.required ? filled.length === this.state.length : filled.length > 0;
      if (this.addButton) this.addButton.disabled = !ready;
    }

    async add() {
      const items = this.state.filter(Boolean).map((entry) => ({ id: entry.id, quantity: 1 }));
      if (!items.length) return;
      this.addButton.setAttribute('aria-busy', 'true');
      if (this.errorEl) this.errorEl.hidden = true;
      try {
        afterAdd(await addToCart(items));
      } catch (error) {
        if (this.errorEl) {
          this.errorEl.textContent = error.message;
          this.errorEl.hidden = false;
        }
      } finally {
        this.addButton.removeAttribute('aria-busy');
      }
    }
  }
  customElements.define('set-builder', SetBuilder);

  class ProductFinder extends HTMLElement {
    connectedCallback() {
      this.steps = Array.from(this.querySelectorAll('[data-finder-step]'));
      this.results = this.querySelector('[data-finder-results]');
      this.note = this.querySelector('[data-finder-note]');
      this.progress = this.querySelector('[data-finder-progress]');
      this.counter = this.querySelector('[data-finder-counter]');
      this.prev = this.querySelector('[data-finder-prev]');
      this.next = this.querySelector('[data-finder-next]');
      this.base = this.dataset.collectionUrl;
      this.limit = Number(this.dataset.limit) || 4;
      this.cache = new Map();
      if (!this.steps.length) return;
      this.classList.add('is-ready');
      this.addEventListener('change', (event) => {
        if (!event.target.closest('[data-finder-step]')) return;
        this.refresh();
        if (this.index < this.steps.length - 1) setTimeout(() => this.show(this.index + 1), 280);
      });
      this.prev?.addEventListener('click', () => this.show(this.index - 1));
      this.next?.addEventListener('click', () => this.show(this.index + 1));
      this.querySelector('[data-finder-restart]')?.addEventListener('click', () => {
        this.querySelectorAll('[data-finder-step] input:checked').forEach((input) => {
          input.checked = false;
        });
        this.show(0);
        this.refresh();
      });
      this.addEventListener('shopify:block:select', (event) => {
        const i = this.steps.indexOf(event.target);
        if (i > -1) this.show(i);
      });
      this.show(0);
    }

    show(target) {
      this.index = Math.min(this.steps.length - 1, Math.max(0, target));
      this.steps.forEach((step, i) => {
        step.hidden = i !== this.index;
      });
      if (this.progress) this.progress.style.setProperty('--finder-progress', `${((this.index + 1) / this.steps.length) * 100}%`);
      if (this.counter) this.counter.textContent = `${this.index + 1} / ${this.steps.length}`;
      if (this.prev) this.prev.disabled = this.index === 0;
      if (this.next) this.next.disabled = this.index === this.steps.length - 1;
    }

    tags() {
      return this.steps.map((step) => step.querySelector('input:checked')?.value).filter(Boolean);
    }

    load(tags) {
      const path = tags.length ? `${this.base}/${tags.map((tag) => encodeURIComponent(tag)).join('+')}` : this.base;
      const url = `${path}?section_id=finder-results`;
      if (!this.cache.has(url)) {
        this.cache.set(
          url,
          fetch(url)
            .then((response) => (response.ok ? response.text() : ''))
            .catch(() => '')
        );
      }
      return this.cache.get(url);
    }

    async refresh() {
      const tags = this.tags();
      let attempt = tags.slice();
      this.results?.setAttribute('aria-busy', 'true');
      try {
        for (;;) {
          const doc = parseHTML(await this.load(attempt));
          const cards = Array.from(doc.querySelectorAll('[data-finder-grid] > li')).slice(0, this.limit);
          if (cards.length || !attempt.length) {
            if (this.results) this.results.innerHTML = cards.map((card) => card.outerHTML).join('');
            if (this.note) this.note.hidden = attempt.length === tags.length;
            break;
          }
          attempt = attempt.slice(0, -1);
        }
      } finally {
        this.results?.removeAttribute('aria-busy');
      }
    }
  }
  customElements.define('product-finder', ProductFinder);

  class LookBook extends HTMLElement {
    connectedCallback() {
      this.dots = Array.from(this.querySelectorAll('[data-look-dot]'));
      this.items = Array.from(this.querySelectorAll('[data-look-item]'));
      this.counter = this.querySelector('[data-look-counter]');
      if (!this.items.length) return;
      this.dots.forEach((dot) => dot.addEventListener('click', () => this.show(Number(dot.dataset.lookDot))));
      this.querySelector('[data-look-prev]')?.addEventListener('click', () => this.show(this.index - 1));
      this.querySelector('[data-look-next]')?.addEventListener('click', () => this.show(this.index + 1));
      this.addEventListener('shopify:block:select', (event) => {
        const i = this.items.indexOf(event.target);
        if (i > -1) this.show(i);
      });
      this.show(0);
    }

    show(target) {
      const count = this.items.length;
      this.index = (target + count) % count;
      this.items.forEach((item, i) => {
        item.hidden = i !== this.index;
      });
      this.dots.forEach((dot) => dot.setAttribute('aria-pressed', String(Number(dot.dataset.lookDot) === this.index)));
      if (this.counter) this.counter.textContent = `${this.index + 1} / ${count}`;
    }
  }
  customElements.define('look-book', LookBook);

  const RECENT_KEY = 'theme:recently-viewed';
  const readRecent = () => {
    try {
      const list = JSON.parse(storage.get(RECENT_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (error) {
      return [];
    }
  };
  if (theme.product) {
    const list = readRecent().filter((handle) => handle !== theme.product);
    list.unshift(theme.product);
    storage.set(RECENT_KEY, JSON.stringify(list.slice(0, 12)));
  }

  class RecentlyViewed extends HTMLElement {
    connectedCallback() {
      this.load();
    }

    async load() {
      const limit = Number(this.dataset.limit) || 4;
      const handles = readRecent()
        .filter((handle) => handle !== theme.product)
        .slice(0, limit);
      const track = this.querySelector('[data-recent-track]');
      if (!track || !handles.length) return;
      const base = (routes.root || '/').replace(/\/$/, '');
      const pages = await Promise.all(
        handles.map((handle) =>
          fetch(`${base}/products/${encodeURIComponent(handle)}?section_id=card-render`)
            .then((response) => (response.ok ? response.text() : ''))
            .catch(() => '')
        )
      );
      const cards = pages
        .map((html) => parseHTML(html).querySelector('.product-card'))
        .filter(Boolean)
        .map((card) => `<li>${card.outerHTML}</li>`);
      if (!cards.length) return;
      track.innerHTML = cards.join('');
      theme.syncSaved?.(track);
      theme.markMySize?.(track);
      this.hidden = false;
      this.querySelector('card-slider')?.update();
    }
  }
  customElements.define('recently-viewed', RecentlyViewed);
  const cardImage = (card) => card.querySelector('.product-card__media .product-card__image');

  const showSwatch = (swatch) => {
    const card = swatch.closest('.product-card');
    const image = card && cardImage(card);
    if (!image || !swatch.dataset.src) return;
    if (!image.dataset.originalSrc) {
      image.dataset.originalSrc = image.getAttribute('src') || '';
      image.dataset.originalSrcset = image.getAttribute('srcset') || '';
    }
    image.setAttribute('srcset', swatch.dataset.srcset || '');
    image.setAttribute('src', swatch.dataset.src);
  };

  const restoreSwatch = (card) => {
    const image = cardImage(card);
    if (!image || !image.dataset.originalSrc) return;
    const picked = card.querySelector('[data-card-swatch][aria-pressed="true"]');
    if (picked && picked.dataset.src) {
      showSwatch(picked);
      return;
    }
    image.setAttribute('srcset', image.dataset.originalSrcset);
    image.setAttribute('src', image.dataset.originalSrc);
  };

  document.addEventListener('click', (event) => {
    const swatch = event.target.closest('[data-card-swatch]');
    if (!swatch) return;
    event.preventDefault();
    const card = swatch.closest('.product-card');
    if (!card) return;
    card.querySelectorAll('[data-card-swatch]').forEach((item) => item.setAttribute('aria-pressed', String(item === swatch)));
    showSwatch(swatch);
    if (swatch.dataset.url) {
      card.querySelectorAll('a.product-card__title').forEach((link) => {
        link.href = swatch.dataset.url;
      });
    }
  });

  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointerover', (event) => {
      const swatch = event.target.closest && event.target.closest('[data-card-swatch]');
      if (swatch) showSwatch(swatch);
    });
    document.addEventListener('pointerout', (event) => {
      const list = event.target.closest && event.target.closest('[data-card-swatches]');
      if (list && !list.contains(event.relatedTarget)) restoreSwatch(list.closest('.product-card'));
    });
  }

  const applyGridChoice = () => {
    ['desktop', 'mobile'].forEach((size) => {
      const saved = storage.get(`theme:grid-${size}`);
      if (saved) root.dataset[`grid${size === 'desktop' ? 'Desktop' : 'Mobile'}`] = saved;
      document.querySelectorAll(`[data-grid-switch="${size}"] [data-grid-cols]`).forEach((button) => {
        const current = root.dataset[`grid${size === 'desktop' ? 'Desktop' : 'Mobile'}`] || button.closest('[data-grid-default]')?.dataset.gridDefault;
        button.setAttribute('aria-pressed', String(button.dataset.gridCols === current));
      });
    });
  };
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-grid-cols]');
    if (!button) return;
    const group = button.closest('[data-grid-switch]');
    if (!group) return;
    const size = group.dataset.gridSwitch;
    root.dataset[`grid${size === 'desktop' ? 'Desktop' : 'Mobile'}`] = button.dataset.gridCols;
    storage.set(`theme:grid-${size}`, button.dataset.gridCols);
    applyGridChoice();
  });
  applyGridChoice();
  document.addEventListener('shopify:section:load', applyGridChoice);
  document.addEventListener('facets:updated', applyGridChoice);

  class RailScroll extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-rail-track]');
      this.sticky = this.querySelector('[data-rail-sticky]');
      this.bar = this.querySelector('[data-rail-progress]');
      this.desktop = window.matchMedia('(min-width: 750px)');
      if (!this.track || !this.sticky || prefersReduced) {
        this.classList.add('is-static');
        return;
      }
      this.onScroll = () => {
        if (this.ticking) return;
        this.ticking = true;
        requestAnimationFrame(() => {
          this.ticking = false;
          this.update();
        });
      };
      this.measure = () => this.layout();
      if ('ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(this.measure);
        this.resizeObserver.observe(this.track);
        this.resizeObserver.observe(this.sticky);
      }
      this.desktop.addEventListener('change', this.measure);
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) window.addEventListener('scroll', this.onScroll, { passive: true });
          else window.removeEventListener('scroll', this.onScroll);
        });
        this.observer.observe(this);
      } else {
        window.addEventListener('scroll', this.onScroll, { passive: true });
      }
      this.layout();
    }

    disconnectedCallback() {
      this.resizeObserver?.disconnect();
      this.observer?.disconnect();
      this.desktop?.removeEventListener('change', this.measure);
      window.removeEventListener('scroll', this.onScroll);
    }

    layout() {
      if (!this.desktop.matches) {
        this.classList.add('is-static');
        this.style.height = '';
        this.track.style.transform = '';
        return;
      }
      this.classList.remove('is-static');
      this.distance = Math.max(0, this.track.scrollWidth - this.sticky.clientWidth);
      this.style.height = `${Math.round(this.distance + window.innerHeight)}px`;
      this.update();
    }

    update() {
      if (this.classList.contains('is-static')) return;
      const rect = this.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      const direction = root.dir === 'rtl' ? 1 : -1;
      this.track.style.transform = `translate3d(${(progress * this.distance * direction).toFixed(1)}px, 0, 0)`;
      if (this.bar) this.bar.style.transform = `scaleX(${progress.toFixed(3)})`;
    }
  }
  customElements.define('rail-scroll', RailScroll);

  class StoryStack extends HTMLElement {
    connectedCallback() {
      this.cards = Array.from(this.children).filter((child) => child.matches('.story-card'));
      if (this.cards.length < 2 || prefersReduced) return;
      this.onScroll = () => {
        if (this.ticking) return;
        this.ticking = true;
        requestAnimationFrame(() => {
          this.ticking = false;
          this.update();
        });
      };
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) window.addEventListener('scroll', this.onScroll, { passive: true });
          else window.removeEventListener('scroll', this.onScroll);
        });
        this.observer.observe(this);
      }
      this.update();
    }

    disconnectedCallback() {
      this.observer?.disconnect();
      window.removeEventListener('scroll', this.onScroll);
    }

    update() {
      this.cards.forEach((card, i) => {
        const next = this.cards[i + 1];
        if (!next) return;
        const own = card.getBoundingClientRect();
        const nextTop = next.getBoundingClientRect().top;
        const cover = Math.min(1, Math.max(0, (own.bottom - nextTop) / own.height));
        card.style.setProperty('--cover', cover.toFixed(3));
      });
    }
  }
  customElements.define('story-stack', StoryStack);

  class HoverList extends HTMLElement {
    connectedCallback() {
      this.float = this.querySelector('[data-hover-float]');
      this.items = Array.from(this.querySelectorAll('.hover-link'));
      if (!this.float || prefersReduced || !window.matchMedia('(hover: hover)').matches) return;
      this.x = 0;
      this.y = 0;
      this.tx = 0;
      this.ty = 0;
      this.items.forEach((item) => {
        item.addEventListener('pointerenter', (event) => this.show(item, event));
      });
      this.addEventListener('pointermove', (event) => {
        this.tx = event.clientX;
        this.ty = event.clientY;
        if (!this.frame) this.frame = requestAnimationFrame(() => this.follow());
      });
      this.querySelector('.hover-list__items')?.addEventListener('pointerleave', () => this.hide());
    }

    show(item, event) {
      const template = item.querySelector('template[data-hover-image]');
      if (!template) return;
      if (this.current !== item) {
        this.float.replaceChildren(template.content.cloneNode(true));
        this.current = item;
      }
      if (!this.float.classList.contains('is-visible')) {
        this.x = this.tx = event.clientX;
        this.y = this.ty = event.clientY;
        this.place(0);
      }
      this.float.classList.add('is-visible');
    }

    hide() {
      this.float.classList.remove('is-visible');
      this.current = null;
    }

    follow() {
      this.frame = null;
      const dx = this.tx - this.x;
      const dy = this.ty - this.y;
      this.x += dx * 0.18;
      this.y += dy * 0.18;
      this.place(Math.max(-8, Math.min(8, dx * 0.08)));
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) this.frame = requestAnimationFrame(() => this.follow());
    }

    place(tilt) {
      this.float.style.setProperty('--x', `${this.x.toFixed(1)}px`);
      this.float.style.setProperty('--y', `${this.y.toFixed(1)}px`);
      this.float.style.setProperty('--tilt', `${tilt.toFixed(2)}deg`);
    }
  }
  customElements.define('hover-list', HoverList);

  class VideoFeature extends HTMLElement {
    connectedCallback() {
      this.video = this.querySelector('video');
      this.button = this.querySelector('[data-video-toggle]');
      this.template = this.querySelector('template[data-video-embed]');
      this.button?.addEventListener('click', () => this.toggle());
      if (this.video) {
        if (prefersReduced || this.dataset.autoplay !== 'true') {
          this.video.pause();
          this.video.removeAttribute('autoplay');
        }
        this.video.addEventListener('play', () => this.sync());
        this.video.addEventListener('pause', () => this.sync());
        this.sync();
      }
    }

    toggle() {
      if (this.template) {
        const frame = this.querySelector('[data-video-target]');
        if (frame) frame.replaceChildren(this.template.content.cloneNode(true));
        this.classList.add('is-playing', 'is-embedded');
        this.button.hidden = true;
        return;
      }
      if (!this.video) return;
      if (this.video.paused) this.video.play().catch(() => {});
      else this.video.pause();
    }

    sync() {
      const playing = this.video && !this.video.paused;
      this.classList.toggle('is-playing', Boolean(playing));
      if (this.button) {
        this.button.setAttribute('aria-pressed', String(Boolean(playing)));
        this.button.setAttribute('aria-label', playing ? strings.pauseVideo : strings.playVideo);
      }
    }
  }
  customElements.define('video-feature', VideoFeature);

  /* Effects: toast, quick sizes, cursor, scramble headings, stickers, drag canvas, reels */
  const toast = (message, tone = 'info') => {
    let region = document.getElementById('ThemeToast');
    if (!region) {
      region = document.createElement('p');
      region.id = 'ThemeToast';
      region.className = 'toast';
      region.setAttribute('role', 'status');
      document.body.append(region);
    }
    clearTimeout(region.timer);
    region.textContent = message;
    region.dataset.tone = tone;
    region.classList.add('is-visible');
    region.timer = setTimeout(() => region.classList.remove('is-visible'), 3200);
  };
  theme.toast = toast;

  const syncQuickSizes = (card) => {
    const picked = card.querySelector('[data-card-swatch][aria-pressed="true"]');
    const color = picked ? picked.dataset.value : null;
    card.querySelectorAll('.quick-size[data-colors]').forEach((button) => {
      let map = {};
      try {
        map = JSON.parse(button.dataset.colors);
      } catch (error) {
        map = {};
      }
      const id = color ? map[color] : button.dataset.default;
      if (id) {
        button.dataset.quickSize = id;
        button.disabled = false;
      } else {
        delete button.dataset.quickSize;
        button.disabled = true;
      }
    });
  };

  document.addEventListener('click', (event) => {
    const swatch = event.target.closest('[data-card-swatch]');
    const card = swatch && swatch.closest('.product-card');
    if (card) syncQuickSizes(card);
  });

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-quick-size]');
    if (!button || button.disabled || button.getAttribute('aria-busy') === 'true') return;
    event.preventDefault();
    button.setAttribute('aria-busy', 'true');
    try {
      const data = await addToCart([{ id: Number(button.dataset.quickSize), quantity: 1 }]);
      button.classList.add('is-added');
      setTimeout(() => button.classList.remove('is-added'), 1800);
      const size = button.textContent.trim();
      toast(strings.sizeAdded ? strings.sizeAdded.replace('[size]', size) : `${strings.added}: ${size}`, 'success');
      afterAdd(data);
    } catch (error) {
      toast(error.message || strings.error, 'error');
    } finally {
      button.removeAttribute('aria-busy');
    }
  });

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (document.body.classList.contains('cursor-custom') && finePointer && !prefersReduced) {
    const dot = document.createElement('div');
    const label = document.createElement('span');
    dot.className = 'cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    dot.append(label);
    document.body.append(dot);
    const pos = { x: -100, y: -100, cx: -100, cy: -100 };
    let frame = null;
    const follow = () => {
      pos.cx += (pos.x - pos.cx) * 0.24;
      pos.cy += (pos.y - pos.cy) * 0.24;
      dot.style.transform = `translate3d(${pos.cx}px, ${pos.cy}px, 0)`;
      frame = Math.abs(pos.x - pos.cx) + Math.abs(pos.y - pos.cy) > 0.2 ? requestAnimationFrame(follow) : null;
    };
    document.addEventListener(
      'pointermove',
      (event) => {
        if (event.pointerType !== 'mouse') return;
        pos.x = event.clientX;
        pos.y = event.clientY;
        if (!dot.classList.contains('is-visible')) {
          pos.cx = pos.x;
          pos.cy = pos.y;
          dot.classList.add('is-visible');
        }
        if (!frame) frame = requestAnimationFrame(follow);
      },
      { passive: true }
    );
    document.addEventListener('pointerout', (event) => {
      if (!event.relatedTarget) dot.classList.remove('is-visible');
    });
    document.addEventListener('pointerover', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const custom = target.closest('[data-cursor]');
      const control = target.closest('button, input, select, textarea, label, summary, [role="button"], [data-card-swatch]');
      const card = target.closest('.product-card');
      const link = target.closest('a');
      let text = '';
      if (custom) text = custom.dataset.cursor;
      else if (card && !control) text = strings.cursorView || '';
      label.textContent = text;
      dot.classList.toggle('is-view', Boolean(text));
      dot.classList.toggle('is-link', !text && Boolean(link || control));
    });
  }

  if (document.body.classList.contains('scramble-headings') && !prefersReduced && 'IntersectionObserver' in window) {
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=?!/';
    const scramble = (el) => {
      const text = el.textContent;
      if (!text.trim() || el.children.length || /[؀-ۿ]/.test(text)) return;
      const chars = Array.from(text);
      const duration = Math.min(1100, 320 + chars.length * 30);
      const start = performance.now();
      el.style.minHeight = `${el.offsetHeight}px`;
      el.setAttribute('aria-label', text);
      const step = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const settled = Math.floor(progress * chars.length);
        el.textContent = chars
          .map((char, index) => (index < settled || /\s/.test(char) ? char : glyphs[Math.floor(Math.random() * glyphs.length)]))
          .join('');
        if (progress < 1) {
          requestAnimationFrame(step);
          return;
        }
        el.textContent = text;
        el.removeAttribute('aria-label');
        el.style.minHeight = '';
      };
      requestAnimationFrame(step);
    };
    const scrambleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          scrambleObserver.unobserve(entry.target);
          scramble(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    const watchScramble = (scope) => scope.querySelectorAll('[data-scramble]').forEach((el) => scrambleObserver.observe(el));
    watchScramble(document);
    document.addEventListener('shopify:section:load', (event) => watchScramble(event.target));
  }

  class StickerField extends HTMLElement {
    connectedCallback() {
      this.layer = 20;
      this.querySelectorAll('[data-sticker]').forEach((sticker) => this.bind(sticker));
    }

    offset(sticker) {
      return {
        x: parseFloat(sticker.style.getPropertyValue('--dx')) || 0,
        y: parseFloat(sticker.style.getPropertyValue('--dy')) || 0
      };
    }

    place(sticker, x, y, limits) {
      const nx = limits ? Math.min(limits.maxX, Math.max(limits.minX, x)) : x;
      const ny = limits ? Math.min(limits.maxY, Math.max(limits.minY, y)) : y;
      sticker.style.setProperty('--dx', `${nx}px`);
      sticker.style.setProperty('--dy', `${ny}px`);
    }

    limits(sticker) {
      const field = this.getBoundingClientRect();
      const rect = sticker.getBoundingClientRect();
      const now = this.offset(sticker);
      return {
        minX: now.x + field.left - rect.left,
        maxX: now.x + field.right - rect.right,
        minY: now.y + field.top - rect.top,
        maxY: now.y + field.bottom - rect.bottom
      };
    }

    bind(sticker) {
      let drag = null;
      sticker.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        const now = this.offset(sticker);
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY, ox: now.x, oy: now.y, limits: this.limits(sticker) };
        sticker.setPointerCapture(event.pointerId);
        sticker.classList.add('is-dragging');
        this.layer += 1;
        sticker.style.zIndex = this.layer;
      });
      sticker.addEventListener('pointermove', (event) => {
        if (!drag || event.pointerId !== drag.id) return;
        this.place(sticker, drag.ox + event.clientX - drag.x, drag.oy + event.clientY - drag.y, drag.limits);
      });
      const end = (event) => {
        if (!drag || event.pointerId !== drag.id) return;
        drag = null;
        sticker.classList.remove('is-dragging');
      };
      sticker.addEventListener('pointerup', end);
      sticker.addEventListener('pointercancel', end);
    }
  }
  customElements.define('sticker-field', StickerField);

  class DragCanvas extends HTMLElement {
    connectedCallback() {
      this.viewport = this.querySelector('[data-canvas-viewport]');
      if (!this.viewport || !finePointer) return;
      requestAnimationFrame(() => this.center());
      this.viewport.addEventListener('pointerdown', (event) => this.start(event));
      this.viewport.addEventListener('dragstart', (event) => event.preventDefault());
      this.viewport.addEventListener(
        'click',
        (event) => {
          if (!this.suppress) return;
          event.preventDefault();
          event.stopPropagation();
          this.suppress = false;
        },
        true
      );
      this.onMove = (event) => this.drag(event);
      this.onUp = () => this.stop();
    }

    disconnectedCallback() {
      cancelAnimationFrame(this.glide);
      window.removeEventListener('pointermove', this.onMove);
      window.removeEventListener('pointerup', this.onUp);
    }

    center() {
      const view = this.viewport;
      const rtl = getComputedStyle(view).direction === 'rtl';
      const x = Math.max(0, (view.scrollWidth - view.clientWidth) / 2);
      view.scrollLeft = rtl ? -x : x;
      view.scrollTop = Math.max(0, (view.scrollHeight - view.clientHeight) / 2);
    }

    start(event) {
      if (event.pointerType === 'touch' || event.button !== 0) return;
      cancelAnimationFrame(this.glide);
      this.state = {
        x: event.clientX,
        y: event.clientY,
        left: this.viewport.scrollLeft,
        top: this.viewport.scrollTop,
        lastX: event.clientX,
        lastY: event.clientY,
        lastT: performance.now(),
        vx: 0,
        vy: 0,
        moved: 0
      };
      this.suppress = false;
      window.addEventListener('pointermove', this.onMove);
      window.addEventListener('pointerup', this.onUp, { once: true });
    }

    drag(event) {
      const s = this.state;
      if (!s) return;
      const dx = event.clientX - s.x;
      const dy = event.clientY - s.y;
      s.moved = Math.max(s.moved, Math.abs(dx) + Math.abs(dy));
      if (s.moved > 6) {
        this.classList.add('is-dragging', 'is-touched');
        this.suppress = true;
      }
      this.viewport.scrollLeft = s.left - dx;
      this.viewport.scrollTop = s.top - dy;
      const now = performance.now();
      const dt = Math.max(1, now - s.lastT);
      s.vx = (event.clientX - s.lastX) / dt;
      s.vy = (event.clientY - s.lastY) / dt;
      s.lastX = event.clientX;
      s.lastY = event.clientY;
      s.lastT = now;
    }

    stop() {
      const s = this.state;
      this.state = null;
      window.removeEventListener('pointermove', this.onMove);
      this.classList.remove('is-dragging');
      if (!s || prefersReduced || performance.now() - s.lastT > 90) return;
      let vx = s.vx * 16;
      let vy = s.vy * 16;
      const step = () => {
        vx *= 0.93;
        vy *= 0.93;
        this.viewport.scrollLeft -= vx;
        this.viewport.scrollTop -= vy;
        this.glide = Math.abs(vx) + Math.abs(vy) > 0.6 ? requestAnimationFrame(step) : null;
      };
      this.glide = requestAnimationFrame(step);
    }
  }
  customElements.define('drag-canvas', DragCanvas);

  class ReelRow extends HTMLElement {
    connectedCallback() {
      this.reels = Array.from(this.querySelectorAll('[data-reel]'));
      const hover = window.matchMedia('(hover: hover)').matches;
      this.reels.forEach((reel) => {
        const video = reel.querySelector('video');
        if (!video) return;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.removeAttribute('autoplay');
        if (hover && !prefersReduced) {
          reel.addEventListener('pointerenter', () => {
            if (!reel.classList.contains('has-sound')) video.play().catch(() => {});
          });
          reel.addEventListener('pointerleave', () => {
            if (!reel.classList.contains('has-sound')) video.pause();
          });
        }
        reel.querySelector('[data-reel-toggle]')?.addEventListener('click', () => this.toggle(reel, video));
        video.addEventListener('play', () => this.sync(reel, video));
        video.addEventListener('pause', () => this.sync(reel, video));
      });
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) return;
              const video = entry.target.querySelector('video');
              if (video && !video.paused) video.pause();
            });
          },
          { threshold: 0.2 }
        );
        this.reels.forEach((reel) => this.observer.observe(reel));
      }
    }

    disconnectedCallback() {
      this.observer?.disconnect();
    }

    toggle(reel, video) {
      const loud = !video.paused && !video.muted;
      this.reels.forEach((other) => {
        if (other === reel) return;
        const otherVideo = other.querySelector('video');
        other.classList.remove('has-sound');
        if (otherVideo) {
          otherVideo.pause();
          otherVideo.muted = true;
        }
      });
      if (loud) {
        video.pause();
        reel.classList.remove('has-sound');
        return;
      }
      video.muted = false;
      reel.classList.add('has-sound');
      video.play().catch(() => {
        video.muted = true;
        reel.classList.remove('has-sound');
        video.play().catch(() => {});
      });
    }

    sync(reel, video) {
      const playing = !video.paused;
      reel.classList.toggle('is-playing', playing);
      const button = reel.querySelector('[data-reel-toggle]');
      if (!button) return;
      const loud = playing && !video.muted;
      button.setAttribute('aria-pressed', String(loud));
      button.setAttribute('aria-label', loud ? strings.pauseVideo : strings.playVideo);
    }
  }
  customElements.define('reel-row', ReelRow);

  /* Shopping tools: saved items, size finder, back in stock, page transitions, load more, card video, photo trail, tab bar, back to top */
  const SAVED_KEY = 'theme:saved';
  const MY_SIZE_KEY = 'theme:my-size';
  const sizeNames = (theme.sizeNames || []).map((name) => String(name).trim()).filter(Boolean);

  const latinDigits = (value) =>
    String(value == null ? '' : value)
      .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
      .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));

  const readSaved = () => {
    try {
      const list = JSON.parse(storage.get(SAVED_KEY) || '[]');
      return Array.isArray(list) ? list.filter((handle) => typeof handle === 'string' && handle) : [];
    } catch (error) {
      return [];
    }
  };

  const syncSaved = (scope = document) => {
    const list = readSaved();
    scope.querySelectorAll('[data-save]').forEach((button) => {
      const on = list.includes(button.dataset.save);
      const title = button.dataset.saveTitle || '';
      button.setAttribute('aria-pressed', String(on));
      if (strings.save && strings.unsave) button.setAttribute('aria-label', (on ? strings.unsave : strings.save).replace('[title]', title));
      const text = button.querySelector('[data-save-text]');
      if (text) text.textContent = on ? strings.savedLabel : strings.saveLabel;
    });
    document.querySelectorAll('[data-saved-count]').forEach((el) => {
      el.textContent = list.length;
      if (el.hasAttribute('data-hide-empty')) el.hidden = list.length === 0;
    });
  };
  theme.syncSaved = syncSaved;

  const writeSaved = (list) => {
    storage.set(SAVED_KEY, JSON.stringify(list.slice(0, 60)));
    syncSaved();
    document.dispatchEvent(new CustomEvent('saved:change', { detail: { list } }));
  };

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-save]');
    if (!button) return;
    event.preventDefault();
    const handle = button.dataset.save;
    const list = readSaved();
    const on = list.includes(handle);
    writeSaved(on ? list.filter((item) => item !== handle) : [handle, ...list]);
    if (!on && !prefersReduced) {
      button.classList.remove('is-popping');
      void button.offsetWidth;
      button.classList.add('is-popping');
    }
    toast(on ? strings.savedRemoved : strings.savedAdded, on ? 'info' : 'success');
  });
  window.addEventListener('storage', (event) => {
    if (event.key === SAVED_KEY) syncSaved();
  });
  document.addEventListener('shopify:section:load', () => syncSaved());
  document.addEventListener('modal:open', () => syncSaved());
  syncSaved();

  const readMySize = () => {
    try {
      const value = JSON.parse(storage.get(MY_SIZE_KEY) || 'null');
      return value && value.size ? value : null;
    } catch (error) {
      return null;
    }
  };

  const markMySize = (scope = document) => {
    const mine = readMySize();
    const size = mine ? String(mine.size).trim().toLowerCase() : '';
    scope.querySelectorAll('.quick-size').forEach((button) => {
      button.classList.toggle('is-my-size', Boolean(size) && button.textContent.trim().toLowerCase() === size);
    });
    scope.querySelectorAll('variant-picker [data-option]').forEach((option) => {
      if (!sizeNames.includes((option.dataset.optionName || '').trim())) return;
      option.querySelectorAll('.variant-picker__pill').forEach((label) => {
        label.classList.toggle('is-my-size', Boolean(size) && label.textContent.trim().toLowerCase() === size);
      });
    });
  };
  theme.markMySize = markMySize;
  markMySize();
  document.addEventListener('shopify:section:load', (event) => markMySize(event.target));

  class SavedDrawer extends HTMLElement {
    connectedCallback() {
      this.dialog = this.querySelector('dialog');
      this.list = this.querySelector('[data-saved-list]');
      this.empty = this.querySelector('[data-saved-empty]');
      this.cache = new Map();
      if (!this.dialog || !this.list) return;
      this.dialog.addEventListener('modal:open', () => this.render());
      document.addEventListener('saved:change', () => {
        if (this.dialog.open) this.render();
      });
    }

    async card(handle) {
      if (this.cache.has(handle)) return this.cache.get(handle);
      const base = (routes.root || '/').replace(/\/$/, '');
      const response = await fetch(`${base}/products/${encodeURIComponent(handle)}?section_id=card-render`).catch(() => null);
      if (!response) return '';
      const html = response.ok ? await response.text() : '';
      const card = html ? parseHTML(html).querySelector('.product-card') : null;
      const markup = card ? card.outerHTML : '';
      this.cache.set(handle, markup);
      return markup;
    }

    async render() {
      const handles = readSaved();
      const token = (this.token = (this.token || 0) + 1);
      if (this.empty) this.empty.hidden = handles.length > 0;
      this.classList.toggle('is-loading', handles.some((handle) => !this.cache.has(handle)));
      const cards = await Promise.all(handles.map((handle) => this.card(handle)));
      if (token !== this.token) return;
      this.classList.remove('is-loading');
      this.list.innerHTML = cards
        .filter(Boolean)
        .map((card) => `<li>${card}</li>`)
        .join('');
      if (this.empty) this.empty.hidden = this.list.children.length > 0;
      syncSaved(this.list);
      markMySize(this.list);
    }
  }
  customElements.define('saved-drawer', SavedDrawer);

  class SizeFinder extends HTMLElement {
    connectedCallback() {
      this.rows = this.parse(this.dataset.table || '');
      this.form = this.querySelector('[data-size-form]');
      this.result = this.querySelector('[data-size-result]');
      if (!this.form || !this.rows.length) return;
      this.form.addEventListener('submit', (event) => {
        event.preventDefault();
        this.submit();
      });
      this.addEventListener('click', (event) => {
        const pick = event.target.closest('[data-size-pick]');
        if (pick) this.select(pick.dataset.sizePick);
      });
      const mine = readMySize();
      if (mine && mine.height && mine.weight) {
        const height = this.form.querySelector('[name="height"]');
        const weight = this.form.querySelector('[name="weight"]');
        if (height) height.value = mine.height;
        if (weight) weight.value = mine.weight;
        const fit = this.form.querySelector(`input[name="fit"][value="${mine.fit === 'oversized' ? 'oversized' : 'true'}"]`);
        if (fit) fit.checked = true;
        this.show(this.pick(Number(mine.height), Number(mine.weight), fit ? mine.fit : 'true'));
      }
    }

    parse(text) {
      const range = (cell) => {
        const numbers = (latinDigits(cell).match(/\d+(?:\.\d+)?/g) || []).map(Number);
        return numbers.length ? [Math.min(...numbers), Math.max(...numbers)] : null;
      };
      return text
        .split(/\r?\n/)
        .map((line) => line.split('|').map((cell) => cell.trim()))
        .filter((cells) => cells.length >= 3 && cells[0])
        .map(([size, height, weight]) => ({ size, height: range(height), weight: range(weight) }))
        .filter((row) => row.height && row.weight);
    }

    pick(height, weight, fit) {
      if (!(height > 0) || !(weight > 0)) return null;
      const gap = (value, [min, max]) => {
        const span = Math.max(1, max - min);
        if (value < min) return (min - value) / span;
        if (value > max) return (value - max) / span;
        return 0;
      };
      let best = -1;
      let score = Infinity;
      this.rows.forEach((row, index) => {
        const value = gap(height, row.height) + gap(weight, row.weight) * 1.25;
        if (value <= score) {
          score = value;
          best = index;
        }
      });
      if (best < 0) return null;
      if (fit === 'oversized' && best < this.rows.length - 1) best += 1;
      return this.rows[best].size;
    }

    submit() {
      const data = new FormData(this.form);
      const height = parseFloat(latinDigits(data.get('height')).replace(',', '.'));
      const weight = parseFloat(latinDigits(data.get('weight')).replace(',', '.'));
      const fit = data.get('fit') === 'oversized' ? 'oversized' : 'true';
      const size = this.pick(height, weight, fit);
      this.show(size);
      if (size && this.dataset.remember === 'true') {
        storage.set(MY_SIZE_KEY, JSON.stringify({ size, height, weight, fit }));
        markMySize();
      }
    }

    show(size) {
      if (!this.result) return;
      this.result.textContent = '';
      if (!size) {
        this.result.textContent = this.dataset.none || '';
        return;
      }
      const answer = document.createElement('p');
      answer.className = 'size-finder__answer';
      answer.textContent = (this.dataset.result || '[size]').replace('[size]', size);
      this.result.append(answer);
      if (this.findOption(size)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'button button--secondary button--small';
        button.dataset.sizePick = size;
        button.textContent = (this.dataset.pick || '[size]').replace('[size]', size);
        this.result.append(button);
      }
      const mine = this.querySelector('[data-size-mine]');
      if (mine) {
        mine.textContent = size;
        mine.hidden = false;
      }
    }

    findOption(size) {
      const scope = this.closest('product-info') || document;
      const wanted = String(size).trim().toLowerCase();
      const option = Array.from(scope.querySelectorAll('variant-picker [data-option]')).find((el) =>
        sizeNames.includes((el.dataset.optionName || '').trim())
      );
      if (!option) return null;
      const select = option.querySelector('select');
      if (select) {
        const match = Array.from(select.options).find((item) => item.value.trim().toLowerCase() === wanted);
        return match ? { select, value: match.value } : null;
      }
      const input = Array.from(option.querySelectorAll('input[type="radio"]')).find(
        (item) => item.value.trim().toLowerCase() === wanted
      );
      return input ? { input } : null;
    }

    select(size) {
      const found = this.findOption(size);
      if (!found) return;
      if (found.select) {
        found.select.value = found.value;
        found.select.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        found.input.checked = true;
        found.input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }
  customElements.define('size-finder', SizeFinder);

  document.addEventListener('submit', (event) => {
    const form = event.target.closest && event.target.closest('form[data-restock-form]');
    if (!form) return;
    try {
      window.sessionStorage.setItem('theme:restock-sent', form.closest('restock-alert')?.dataset.handle || '');
    } catch (error) {
      /* Storage can be blocked; the form still posts. */
    }
  });

  class RestockAlert extends HTMLElement {
    connectedCallback() {
      let sent = null;
      try {
        sent = window.sessionStorage.getItem('theme:restock-sent');
      } catch (error) {
        sent = null;
      }
      if (sent && sent === this.dataset.handle && /[?&]customer_posted=true/.test(window.location.search)) {
        const panel = this.querySelector('[data-restock-panel]');
        if (panel) panel.hidden = false;
        this.querySelector('[data-restock-form]')?.setAttribute('hidden', '');
        const done = this.querySelector('[data-restock-done]');
        if (done) done.hidden = false;
        try {
          window.sessionStorage.removeItem('theme:restock-sent');
        } catch (error) {
          /* ignore */
        }
      }
      this.info = this.closest('product-info');
      this.onVariant = (event) => this.update(event.detail && event.detail.variant);
      this.info?.addEventListener('variant:change', this.onVariant);
    }

    disconnectedCallback() {
      this.info?.removeEventListener('variant:change', this.onVariant);
    }

    update(variant) {
      if (!variant) return;
      const panel = this.querySelector('[data-restock-panel]');
      if (panel) panel.hidden = Boolean(variant.available);
      if (!this.info || this.info.dataset.clientRender !== 'true') return;
      const tags = this.querySelector('[data-restock-tags]');
      const slug = String(variant.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9؀-ۿ]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (tags) tags.value = `restock,${this.dataset.tagBase}:${slug}`;
    }
  }
  customElements.define('restock-alert', RestockAlert);

  if (root.classList.contains('pt-on')) {
    let lastCard = null;
    let namedImage = null;
    const clearName = () => {
      if (namedImage) namedImage.style.viewTransitionName = '';
      namedImage = null;
    };
    document.addEventListener(
      'click',
      (event) => {
        const link = event.target.closest && event.target.closest('a[href]');
        lastCard = link ? link.closest('.product-card') : null;
      },
      true
    );
    window.addEventListener('pageswap', (event) => {
      const transition = event.viewTransition;
      if (!transition) return;
      const skip = () => transition.skipTransition();
      document.addEventListener('pointerdown', skip, { once: true });
      document.addEventListener('keydown', skip, { once: true });
      clearName();
      const url = event.activation && event.activation.entry && event.activation.entry.url;
      if (!theme.photoMorph || !lastCard || !url) return;
      let target = null;
      try {
        target = new URL(url);
      } catch (error) {
        return;
      }
      if (target.origin !== window.location.origin || !/\/products\//.test(target.pathname)) return;
      const image = lastCard.querySelector('.product-card__media .product-card__image');
      if (!image) return;
      image.style.viewTransitionName = 'product-photo';
      namedImage = image;
      try {
        window.sessionStorage.setItem('theme:morph', target.pathname);
      } catch (error) {
        clearName();
      }
    });
    window.addEventListener('pageshow', () => {
      clearName();
      lastCard = null;
    });
  }

  class LoadMore extends HTMLElement {
    connectedCallback() {
      this.button = this.querySelector('[data-load-more]');
      this.button?.addEventListener('click', (event) => {
        event.preventDefault();
        this.load();
      });
      if (this.dataset.mode === 'infinite' && 'IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) this.load();
          },
          { rootMargin: '0px 0px 600px 0px' }
        );
        this.observer.observe(this);
      }
    }

    disconnectedCallback() {
      this.observer?.disconnect();
    }

    async load() {
      if (this.loading || !this.dataset.next) return;
      this.loading = true;
      this.button?.setAttribute('aria-busy', 'true');
      const hadFocus = this.contains(document.activeElement);
      try {
        const url = new URL(this.dataset.next, window.location.origin);
        url.searchParams.set('section_id', this.dataset.section);
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(String(response.status));
        const doc = parseHTML(await response.text());
        const grid = this.closest('.collection-layout__products')?.querySelector('[data-product-grid]');
        const incoming = doc.querySelector('[data-product-grid]');
        if (!grid || !incoming) throw new Error('grid');
        const items = Array.from(incoming.children).filter((item) => !item.classList.contains('grid-promo'));
        items.forEach((item) => grid.append(item));
        syncSaved(grid);
        markMySize(grid);
        const next = doc.querySelector('load-more');
        if (next) this.replaceWith(next);
        else this.remove();
        if (hadFocus) items[0]?.querySelector('a[href]')?.focus({ preventScroll: true });
      } catch (error) {
        this.loading = false;
        this.button?.removeAttribute('aria-busy');
        if (this.button && this.button.href) window.location.href = this.button.href;
      }
    }
  }
  customElements.define('load-more', LoadMore);

  if (window.matchMedia('(hover: hover)').matches && !prefersReduced) {
    document.addEventListener('pointerover', (event) => {
      const card = event.target.closest && event.target.closest('.product-card');
      if (!card || card.contains(event.relatedTarget)) return;
      const video = card.querySelector('.product-card__video');
      if (!video) return;
      video
        .play()
        .then(() => card.classList.add('is-video-playing'))
        .catch(() => {});
    });
    document.addEventListener('pointerout', (event) => {
      const card = event.target.closest && event.target.closest('.product-card');
      if (!card || card.contains(event.relatedTarget)) return;
      const video = card.querySelector('.product-card__video');
      if (!video) return;
      card.classList.remove('is-video-playing');
      video.pause();
    });
  }

  class PhotoTrail extends HTMLElement {
    connectedCallback() {
      this.items = Array.from(this.querySelectorAll('[data-trail-item]'));
      if (!this.items.length) return;
      if (prefersReduced) {
        this.classList.add('is-static');
        return;
      }
      this.index = 0;
      this.layer = 1;
      this.last = null;
      this.spacing = Number(this.dataset.spacing) || 90;
      this.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse') return;
        const point = this.point(event);
        if (this.last && Math.hypot(point.x - this.last.x, point.y - this.last.y) < this.spacing) return;
        this.last = point;
        this.drop(point);
      });
      this.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse') return;
        this.drop(this.point(event));
      });
      this.addEventListener('pointerleave', () => {
        this.last = null;
      });
    }

    point(event) {
      const rect = this.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    drop({ x, y }) {
      const item = this.items[this.index % this.items.length];
      this.index += 1;
      this.layer += 1;
      item.style.left = `${x}px`;
      item.style.top = `${y}px`;
      item.style.zIndex = String(this.layer);
      item.style.setProperty('--tilt', `${(Math.random() * 18 - 9).toFixed(1)}deg`);
      item.classList.remove('is-on');
      void item.offsetWidth;
      item.classList.add('is-on');
      this.classList.add('is-touched');
    }
  }
  customElements.define('photo-trail', PhotoTrail);

  class TabBar extends HTMLElement {
    connectedCallback() {
      this.querySelector('[data-tab-menu]')?.addEventListener('click', (event) => {
        const drawer = document.querySelector('dialog.menu-drawer');
        if (drawer) openModal(drawer, event.currentTarget);
      });
      this.querySelector('[data-tab-search]')?.addEventListener('click', (event) => {
        const search = document.querySelector('details.header-search');
        if (!search) return;
        event.preventDefault();
        document.querySelectorAll('.header-hidden').forEach((el) => el.classList.remove('header-hidden'));
        search.open = true;
        requestAnimationFrame(() => search.querySelector('input[type="search"]')?.focus());
      });
    }
  }
  customElements.define('tab-bar', TabBar);

  class BackToTop extends HTMLElement {
    connectedCallback() {
      this.querySelector('button')?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
      });
      this.onScroll = () => {
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => {
          this.frame = null;
          const max = document.documentElement.scrollHeight - window.innerHeight;
          const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
          this.style.setProperty('--progress', progress.toFixed(3));
          this.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
        });
      };
      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.onScroll();
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this.onScroll);
    }
  }
  customElements.define('back-to-top', BackToTop);
})();

/* Signup forms: show the thank-you message only on the form that was sent */
(() => {
  document.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-signup-id]');
    if (!form) return;
    try {
      window.sessionStorage.setItem('theme:signup', form.dataset.signupId);
    } catch (error) {}
  });
  let sent = null;
  try {
    sent = window.sessionStorage.getItem('theme:signup');
  } catch (error) {}
  if (!sent || !/customer_posted=true/.test(window.location.search)) return;
  document.querySelectorAll('form[data-signup-id]').forEach((form) => {
    if (form.dataset.signupId !== sent) return;
    form.querySelectorAll('[data-signup-success]').forEach((el) => (el.hidden = false));
    form.querySelectorAll('[data-signup-fields]').forEach((el) => (el.hidden = true));
  });
  try {
    window.sessionStorage.removeItem('theme:signup');
  } catch (error) {}
})();
