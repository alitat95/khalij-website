'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const fa = n => Number(n).toLocaleString('fa-IR');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const header = $('#header');
const onScrollHeader = () => header.classList.toggle('scrolled', scrollY > 40);
addEventListener('scroll', onScrollHeader, { passive: true });
onScrollHeader();

(() => {
  const slides = $$('.hero-slide');
  const dots = $$('.hero-dots .dot');
  if (!slides.length || !dots.length) return;
  let current = 0;
  let timer;
  const show = index => {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    dots[current].setAttribute('aria-selected', 'false');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
    dots[current].setAttribute('aria-selected', 'true');
  };
  const play = () => {
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(() => show(current + 1), 6000);
  };
  dots.forEach((dot, index) => dot.addEventListener('click', () => { show(index); play(); }));
  play();
})();

(() => {
  const els = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('revealed')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('revealed'); io.unobserve(en.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  els.forEach(e => io.observe(e));
})();

const toast = $('#toast');
let toastT;
const showToast = msg => {
  if (!toast) return;
  toast.hidden = false;
  toast.textContent = msg;
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toastT);
  toastT = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; toast.textContent = ''; }, 450);
  }, 2600);
};

$$('.wish').forEach(w => w.addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();
  w.classList.toggle('wished');
  const on = w.classList.contains('wished');
  w.setAttribute('aria-label', on ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها');
  w.closest('.vcard')?.classList.toggle('is-loved', on);
  w.classList.remove('wish-pop');
  void w.offsetWidth;
  w.classList.add('wish-pop');
}));

const cart = new Map();
const cartDrawer = $('#cartDrawer'), cartBody = $('#cartBody'), cartFoot = $('#cartFoot');
const cartCount = $('#cartCount'), cartTotal = $('#cartTotal'), cdCount = $('#cdCount');
const scrim = $('#scrim');

const renderCart = () => {
  const items = [...cart.values()];
  const count = items.reduce((s, it) => s + it.qty, 0);
  cartCount.hidden = count === 0;
  cartCount.textContent = fa(count);
  cdCount.textContent = count ? fa(count) + ' کالا' : '';
  cartFoot.hidden = items.length === 0;

  if (!items.length) {
    cartBody.innerHTML = `
      <div class="cd-empty">
        <svg class="ic"><use href="#i-bag"/></svg>
        <strong>سبد خرید خالی است</strong>
        <span>هنوز محصولی انتخاب نشده. از فروشگاه شروع کنید.</span>
        <a class="btn btn-line" href="shop.html"><span>دیدن محصولات</span></a>
      </div>`;
    return;
  }

  cartBody.innerHTML = items.map(it => `
    <div class="cd-item" data-key="${it.name}">
      <img class="cd-item-img" src="${it.img}" alt="${it.name}" loading="lazy" referrerpolicy="no-referrer">
      <div class="cd-info">
        <h4>${it.name}</h4>
        <span class="cd-unit">هر عدد: ${fa(it.price)} تومان</span>
        <div class="cd-qty">
          <button data-act="dec" aria-label="کاهش تعداد"><svg class="ic"><use href="#i-minus"/></svg></button>
          <span class="cd-qty-num">${fa(it.qty)}</span>
          <button data-act="inc" aria-label="افزایش تعداد"><svg class="ic"><use href="#i-plus"/></svg></button>
        </div>
      </div>
      <div class="cd-side">
        <button class="cd-remove" data-act="rm" aria-label="حذف از سبد"><svg class="ic"><use href="#i-trash"/></svg></button>
        <span class="cd-price">${fa(it.price * it.qty)} تومان</span>
      </div>
    </div>`).join('');

  const gross = items.reduce((s, it) => s + it.old * it.qty, 0);
  const net = items.reduce((s, it) => s + it.price * it.qty, 0);
  $('#sumItems').textContent = fa(gross) + ' تومان';
  $('#sumSave').textContent = fa(gross - net) + ' تومان';
  cartTotal.textContent = fa(net) + ' تومان';
};

renderCart();

cartBody.addEventListener('click', e => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const row = btn.closest('.cd-item');
  const key = row.dataset.key;
  const it = cart.get(key);
  if (!it) return;
  const act = btn.dataset.act;
  const removing = act === 'rm' || (act === 'dec' && it.qty <= 1);
  if (removing) {
    row.classList.add('cd-out');
    setTimeout(() => { cart.delete(key); renderCart(); }, 300);
    return;
  }
  if (act === 'inc') it.qty++;
  if (act === 'dec') it.qty--;
  renderCart();
  const fresh = [...cartBody.querySelectorAll('.cd-item')].find(el => el.dataset.key === key);
  if (!fresh) return;
  fresh.classList.add('cd-pulse');
  const num = fresh.querySelector('.cd-qty-num');
  if (num) { num.classList.remove('cd-qty-pop'); void num.offsetWidth; num.classList.add('cd-qty-pop'); }
});

$$('.vcard-add').forEach(btn => btn.addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();
  const p = btn.closest('.vcard').dataset;
  const it = cart.get(p.name) || { name: p.name, price: +p.price, old: +(p.old || p.price), img: p.img, qty: 0 };
  it.qty++;
  cart.set(p.name, it);
  renderCart();
  cartCount.classList.remove('bump'); void cartCount.offsetWidth; cartCount.classList.add('bump');
  const label = btn.querySelector('span');
  const prev = label ? label.textContent : '';
  btn.classList.remove('is-added');
  void btn.offsetWidth;
  btn.classList.add('is-added');
  if (label) label.textContent = 'اضافه شد';
  clearTimeout(btn._addT);
  btn._addT = setTimeout(() => {
    btn.classList.remove('is-added');
    if (label) label.textContent = prev;
  }, 1400);
}));

const openDrawer = () => { cartDrawer.hidden = false; scrim.hidden = false; requestAnimationFrame(() => { cartDrawer.classList.add('show'); scrim.classList.add('show'); }); };
const closeDrawer = () => { cartDrawer.classList.remove('show'); scrim.classList.remove('show'); setTimeout(() => { cartDrawer.hidden = true; maybeHideScrim(); }, 500); };
$('#cartBtn').addEventListener('click', openDrawer);
$('#cartClose').addEventListener('click', closeDrawer);
$('#mmCart')?.addEventListener('click', () => { closeMenu(); openDrawer(); });
$('.cd-checkout')?.addEventListener('click', () => { location.href = 'checkout.html'; });

const menu = $('#mobileMenu');
const openMenu = () => { menu.hidden = false; scrim.hidden = false; requestAnimationFrame(() => { menu.classList.add('show'); scrim.classList.add('show'); }); $('#burgerBtn').setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; };
const closeMenu = () => { menu.classList.remove('show'); scrim.classList.remove('show'); $('#burgerBtn').setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; setTimeout(() => { menu.hidden = true; maybeHideScrim(); }, 550); };
$('#burgerBtn').addEventListener('click', openMenu);
$('#mmClose')?.addEventListener('click', closeMenu);
$$('#mobileMenu a').forEach(a => a.addEventListener('click', closeMenu));

function maybeHideScrim() { if (cartDrawer.hidden && menu.hidden) scrim.hidden = true; }
scrim.addEventListener('click', () => { if (!cartDrawer.hidden) closeDrawer(); if (!menu.hidden) closeMenu(); });

const overlay = $('#searchOverlay'), sInput = $('#searchInput'), sResults = $('#searchResults'), sClear = $('#searchClear');
const index = $$('.vcard[data-name]').map(c => ({ name: c.dataset.name, cat: c.dataset.cat, price: +c.dataset.price, img: c.dataset.img, el: c }));
const openSearch = () => { overlay.hidden = false; requestAnimationFrame(() => overlay.classList.add('show')); setTimeout(() => sInput.focus(), 150); document.body.style.overflow = 'hidden'; };
const closeSearch = () => { overlay.classList.remove('show'); document.body.style.overflow = ''; setTimeout(() => { overlay.hidden = true; }, 350); };
$('#searchBtn').addEventListener('click', openSearch);
$('#searchClose').addEventListener('click', closeSearch);
sClear.addEventListener('click', () => { sInput.value = ''; sClear.hidden = true; sResults.innerHTML = ''; sInput.focus(); });

const runSearch = q => {
  q = q.trim();
  sClear.hidden = !q;
  if (!q) { sResults.innerHTML = ''; return; }
  const hits = index.filter(p => (p.name + ' ' + p.cat).includes(q)).slice(0, 6);
  sResults.innerHTML = hits.length
    ? hits.map(p => `<button class="sr-card" data-name="${p.name}"><img src="${p.img}" alt="" referrerpolicy="no-referrer"><span><span class="sr-name">${p.name}</span><span class="sr-price">${fa(p.price)} تومان</span></span></button>`).join('')
    : `<p class="search-empty">با این عبارت چیزی پیدا نشد. نام محصول یا برند را عوض کنید.</p>`;
};
sInput.addEventListener('input', () => runSearch(sInput.value));
$$('.hint-chip').forEach(ch => ch.addEventListener('click', () => { sInput.value = ch.textContent; runSearch(ch.textContent); sInput.focus(); }));
sResults.addEventListener('click', e => {
  const b = e.target.closest('button[data-name]');
  if (!b) return;
  const card = index.find(p => p.name === b.dataset.name)?.el;
  closeSearch();
  if (card) setTimeout(() => {
    card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    card.classList.add('flash');
    setTimeout(() => card.classList.remove('flash'), 1500);
  }, 380);
});

const modal = $('#loginModal');
const formPhone = $('#formPhone');
const formOtp = $('#formOtp');
const phoneInput = $('#authPhone');
const phoneShown = $('#authPhoneShown');
const authLead = $('#authLead');
const authError = $('#authError');
const otpError = $('#otpError');
const otpDigits = $$('.otp-digit');
const otpTimerEl = $('#otpTimer');
const otpWait = $('#otpWait');
const otpResend = $('#otpResend');
const toEnDigit = s => String(s)
  .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
  .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
let otpTick;
let otpLeft = 0;
let authMobile = '';

const resetAuth = () => {
  formPhone.hidden = false;
  formOtp.hidden = true;
  formPhone.reset();
  otpDigits.forEach(i => { i.value = ''; });
  authError.hidden = true;
  otpError.hidden = true;
  formOtp.classList.remove('auth-shake');
  authLead.textContent = 'شماره موبایل‌تان را وارد کنید تا کد تأیید برایتان پیامک شود.';
  clearInterval(otpTick);
};

const openModal = () => {
  resetAuth();
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('show'));
  setTimeout(() => phoneInput?.focus(), 180);
};
const closeModal = () => {
  modal.classList.remove('show');
  clearInterval(otpTick);
  setTimeout(() => { modal.hidden = true; resetAuth(); }, 350);
};
$('#loginBtn').addEventListener('click', openModal);
$('#mmLogin')?.addEventListener('click', () => { closeMenu(); openModal(); });
$('#modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

const normMobile = raw => {
  let d = toEnDigit(raw).replace(/\D/g, '');
  if (d.startsWith('0098')) d = d.slice(4);
  else if (d.startsWith('98')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  if (/^\d{9}$/.test(d)) d = '9' + d;
  return /^9\d{9}$/.test(d) ? d : '';
};
const prettyMobile = d => ('0' + d).replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
const padFa = n => (n < 10 ? fa(0) : '') + fa(n);

const startOtpTimer = () => {
  otpLeft = 60;
  otpResend.hidden = true;
  otpWait.hidden = false;
  const paint = () => { otpTimerEl.textContent = padFa(Math.floor(otpLeft / 60)) + ':' + padFa(otpLeft % 60); };
  paint();
  clearInterval(otpTick);
  otpTick = setInterval(() => {
    otpLeft -= 1;
    if (otpLeft <= 0) {
      clearInterval(otpTick);
      otpWait.hidden = true;
      otpResend.hidden = false;
      return;
    }
    paint();
  }, 1000);
};

const showOtpStep = () => {
  formPhone.hidden = true;
  formOtp.hidden = false;
  phoneShown.textContent = prettyMobile(authMobile);
  authLead.textContent = 'کد پنج‌رقمی پیامک شد. آن را در کادر زیر بنویسید.';
  otpError.hidden = true;
  otpDigits.forEach(i => { i.value = ''; });
  startOtpTimer();
  setTimeout(() => otpDigits[0]?.focus(), 80);
};

phoneInput?.addEventListener('input', () => {
  const d = toEnDigit(phoneInput.value).replace(/\D/g, '').slice(0, 11);
  let shown = d;
  if (d.length > 7) shown = d.slice(0, 4) + ' ' + d.slice(4, 7) + ' ' + d.slice(7);
  else if (d.length > 4) shown = d.slice(0, 4) + ' ' + d.slice(4);
  phoneInput.value = shown;
  authError.hidden = true;
});

formPhone?.addEventListener('submit', e => {
  e.preventDefault();
  const d = normMobile(phoneInput.value);
  if (!d) { authError.hidden = false; phoneInput.focus(); return; }
  authError.hidden = true;
  authMobile = d;
  showOtpStep();
  showToast('کد تأیید ارسال شد');
});

$('#authChange')?.addEventListener('click', () => {
  formOtp.hidden = true;
  formPhone.hidden = false;
  authLead.textContent = 'شماره موبایل‌تان را وارد کنید تا کد تأیید برایتان پیامک شود.';
  clearInterval(otpTick);
  phoneInput.focus();
});

otpResend?.addEventListener('click', () => {
  startOtpTimer();
  otpDigits.forEach(i => { i.value = ''; });
  otpDigits[0]?.focus();
  showToast('کد دوباره ارسال شد');
});

otpDigits.forEach((inp, i) => {
  inp.addEventListener('input', () => {
    const v = toEnDigit(inp.value).replace(/\D/g, '').slice(-1);
    inp.value = v;
    otpError.hidden = true;
    if (v && otpDigits[i + 1]) otpDigits[i + 1].focus();
  });
  inp.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !inp.value && i) {
      otpDigits[i - 1].focus();
      otpDigits[i - 1].value = '';
      e.preventDefault();
    }
  });
  inp.addEventListener('paste', e => {
    const t = toEnDigit(e.clipboardData.getData('text')).replace(/\D/g, '').slice(0, otpDigits.length);
    if (!t) return;
    e.preventDefault();
    otpDigits.forEach((el, j) => { el.value = t[j] || ''; });
    otpDigits[Math.min(t.length, otpDigits.length) - 1].focus();
  });
});

formOtp?.addEventListener('submit', e => {
  e.preventDefault();
  const code = otpDigits.map(i => i.value).join('');
  if (code.length !== otpDigits.length) {
    otpError.hidden = false;
    formOtp.classList.remove('auth-shake');
    void formOtp.offsetWidth;
    formOtp.classList.add('auth-shake');
    return;
  }
  closeModal();
  showToast('وارد حساب شدید');
});

addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!overlay.hidden) closeSearch();
  if (!modal.hidden) closeModal();
  if (!cartDrawer.hidden) closeDrawer();
  if (!menu.hidden) closeMenu();
});

const toTop = $('#toTop');
addEventListener('scroll', () => toTop.classList.toggle('show', scrollY > 700), { passive: true });
toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

if (matchMedia('(pointer:fine)').matches && !reduceMotion) {
  $$('.magnet').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / r.width;
      const y = (e.clientY - r.top - r.height / 2) / r.height;
      el.style.transform = `translate(${x * 10}px, ${y * 8 - 3}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

(() => {
  const links = $$('.main-nav .nav-link');
  const map = links.map(l => [l, $(l.getAttribute('href'))]).filter(([, s]) => s);
  const io = new IntersectionObserver(es => {
    es.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(l => l.classList.remove('is-active'));
      map.find(([, s]) => s === en.target)?.[0].classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach(([, s]) => io.observe(s));
})();

(() => {
  const drop = document.querySelector('.sort-drop');
  const grid = document.querySelector('.shop-content .vcard-grid');
  const cards = grid ? [...grid.querySelectorAll('.vcard')] : [];
  const countEl = document.querySelector('.woocommerce-result-count');
  const native = document.querySelector('#orderby');
  let order = 'menu_order';
  let minP = 0;
  let maxP = Infinity;
  let saleOnly = false;

  const sortCards = list => {
    list.sort((a, b) => {
      const pa = Number(a.dataset.price) || 0;
      const pb = Number(b.dataset.price) || 0;
      if (order === 'price') return pa - pb;
      if (order === 'price-desc') return pb - pa;
      const ia = Number(a.dataset.productId) || 0;
      const ib = Number(b.dataset.productId) || 0;
      if (order === 'date' || order === 'popularity') return ib - ia;
      return ia - ib;
    });
  };

  const apply = () => {
    if (!grid) return;
    const visible = [];
    cards.forEach(c => {
      const p = Number(c.dataset.price) || 0;
      const onSale = c.dataset.old && Number(c.dataset.old) > p;
      const ok = p >= minP && p <= maxP && (!saleOnly || onSale);
      c.hidden = !ok;
      if (ok) visible.push(c);
    });
    sortCards(visible);
    visible.forEach(c => grid.appendChild(c));
    if (countEl) countEl.textContent = 'نمایش ' + fa(visible.length) + ' محصول';
  };

  if (drop) {
    const btn = drop.querySelector('.sort-btn');
    const menu = drop.querySelector('.sort-menu');
    const valueEl = drop.querySelector('.sort-value');
    const close = () => {
      drop.classList.remove('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (menu) menu.hidden = true;
    };
    btn?.addEventListener('click', e => {
      e.stopPropagation();
      const open = drop.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open);
      menu.hidden = !open;
    });
    menu?.querySelectorAll('[data-value]').forEach(opt => {
      opt.addEventListener('click', () => {
        order = opt.dataset.value;
        menu.querySelectorAll('[data-value]').forEach(o => {
          o.classList.toggle('is-active', o === opt);
          o.setAttribute('aria-selected', o === opt ? 'true' : 'false');
        });
        if (valueEl) valueEl.textContent = opt.textContent.trim();
        if (native) native.value = order;
        close();
        apply();
      });
    });
    document.addEventListener('click', e => { if (!drop.contains(e.target)) close(); });
  }

  const faDigits = '۰۱۲۳۴۵۶۷۸۹';
  const toFaDigits = v => String(v ?? '').replace(/\d/g, d => faDigits[d]);
  const toEnNumber = v => Number(String(v ?? '').replace(/[۰-۹]/g, d => String(faDigits.indexOf(d))).replace(/\D/g, '')) || 0;
  const paintPrice = (el, raw) => { if (el) el.value = toFaDigits(raw); };
  const bindFaInput = el => {
    if (!el) return;
    el.addEventListener('input', () => {
      const next = toFaDigits(toEnNumber(el.value) || String(el.value).replace(/\D/g, ''));
      if (el.value !== next) el.value = next;
    });
  };

  document.querySelectorAll('.price-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.price-pill').forEach(p => p.classList.toggle('is-active', p === pill));
      minP = pill.dataset.min === '' ? 0 : Number(pill.dataset.min) || 0;
      maxP = pill.dataset.max === '' ? Infinity : Number(pill.dataset.max) || Infinity;
      paintPrice(document.querySelector('#priceMin'), pill.dataset.min || '700000');
      paintPrice(document.querySelector('#priceMax'), pill.dataset.max || '2000000');
      apply();
    });
  });

  const readRange = () => {
    minP = toEnNumber(document.querySelector('#priceMin')?.value) || 0;
    const maxRaw = toEnNumber(document.querySelector('#priceMax')?.value);
    maxP = maxRaw || Infinity;
    document.querySelectorAll('.price-pill').forEach(p => p.classList.remove('is-active'));
    apply();
  };
  bindFaInput(document.querySelector('#priceMin'));
  bindFaInput(document.querySelector('#priceMax'));
  document.querySelector('#priceMin')?.addEventListener('change', readRange);
  document.querySelector('#priceMax')?.addEventListener('change', readRange);
  document.querySelector('#filterSale')?.addEventListener('change', e => {
    saleOnly = e.target.checked;
    apply();
  });
})();

document.querySelector('.contact-form')?.addEventListener('submit', e => {
  e.preventDefault();
  showToast('پیام ثبت شد. به‌زودی پاسخ می‌دهیم.');
  e.target.reset();
});


/* Cart page */
(() => {
  const wrap = document.querySelector('#cartFilled');
  if (!wrap) return;
  const fa = n => Number(n).toLocaleString('fa-IR');
  const rows = () => [...wrap.querySelectorAll('.cart_item')];
  const paint = () => {
    let sub = 0, save = 0;
    rows().forEach(tr => {
      const price = Number(tr.dataset.price) || 0;
      const old = Number(tr.dataset.old) || price;
      const qty = Number((tr.querySelector('.qty')?.textContent || '1').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 1;
      tr.querySelector('.qty').textContent = fa(qty);
      tr.querySelector('.line').textContent = fa(price * qty);
      sub += price * qty;
      save += Math.max(0, old - price) * qty;
    });
    const empty = rows().length === 0;
    document.querySelector('#cartEmpty').hidden = !empty;
    wrap.hidden = empty;
    if (empty) return;
    document.querySelector('#cartSub').textContent = fa(sub) + ' تومان';
    document.querySelector('#cartSave').textContent = fa(save) + ' تومان';
    document.querySelector('#cartShip').textContent = sub >= 2000000 ? 'رایگان' : '۳۹٬۰۰۰ تومان';
    document.querySelector('#cartPay').textContent = fa(sub >= 2000000 ? sub : sub + 39000) + ' تومان';
  };
  wrap.addEventListener('click', e => {
    const btn = e.target.closest('[data-act], .remove');
    if (!btn) return;
    e.preventDefault();
    const tr = btn.closest('.cart_item');
    if (!tr) return;
    if (btn.classList.contains('remove')) { tr.remove(); paint(); return; }
    const q = tr.querySelector('.qty');
    let n = Number((q.textContent || '1').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 1;
    if (btn.dataset.act === 'inc') n += 1;
    if (btn.dataset.act === 'dec') n = Math.max(1, n - 1);
    q.textContent = n;
    paint();
  });
  document.querySelector('#applyCoupon')?.addEventListener('click', () => {
    const v = document.querySelector('#coupon_code')?.value.trim();
    showToast(v ? 'کد تخفیف بررسی شد.' : 'کد تخفیف را بنویسید.');
  });
})();

/* Checkout */
(() => {
  const form = document.querySelector('#checkoutForm');
  if (!form) return;
  document.querySelector('#chkLogin')?.addEventListener('click', () => document.querySelector('#loginBtn')?.click());
  document.querySelector('#ship_to_different_address')?.addEventListener('change', e => {
    document.querySelector('#shippingAddress').hidden = !e.target.checked;
  });
  document.querySelector('#chkCoupon')?.addEventListener('click', () => {
    const v = document.querySelector('#checkout_coupon')?.value.trim();
    showToast(v ? 'کد تخفیف بررسی شد.' : 'کد تخفیف را بنویسید.');
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    location.href = 'thankyou.html';
  });
})();


document.querySelector('#copyOrder')?.addEventListener('click', () => {
  const id = document.querySelector('#orderId')?.textContent.trim();
  if (!id) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(id).then(() => showToast('شماره سفارش کپی شد.')).catch(() => showToast('شماره سفارش: ' + id));
  } else showToast('شماره سفارش: ' + id);
});


(() => {
  const drop = document.querySelector('#stateDrop');
  if (!drop) return;
  const btn = drop.querySelector('.state-btn');
  const menu = drop.querySelector('.state-menu');
  const valueEl = drop.querySelector('.state-value');
  const select = drop.querySelector('#billing_state');
  const close = () => {
    drop.classList.remove('is-open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (menu) menu.hidden = true;
  };
  btn?.addEventListener('click', e => {
    e.stopPropagation();
    const open = drop.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open);
    menu.hidden = !open;
  });
  menu?.querySelectorAll('[data-value]').forEach(opt => {
    opt.addEventListener('click', () => {
      menu.querySelectorAll('[data-value]').forEach(o => o.classList.toggle('is-active', o === opt));
      if (valueEl) valueEl.textContent = opt.dataset.value;
      if (select) select.value = opt.dataset.value;
      close();
    });
  });
  document.addEventListener('click', e => { if (!drop.contains(e.target)) close(); });
})();

(() => {
  const nav = document.querySelector('.woocommerce-MyAccount-navigation');
  if (!nav) return;
  const panels = {};
  document.querySelectorAll('.account-panel').forEach(el => {
    panels[el.id.replace(/^panel-/, '')] = el;
  });
  const show = id => {
    Object.entries(panels).forEach(([k, el]) => { if (el) el.hidden = k !== id; });
    nav.querySelectorAll('li').forEach(li => {
      const a = li.querySelector('[data-tab]');
      li.classList.toggle('is-active', a && a.dataset.tab === id);
    });
  };
  document.querySelectorAll('[data-tab]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.dataset.tab;
      if (!panels[id]) return;
      e.preventDefault();
      show(id);
      history.replaceState(null, '', '#' + id);
    });
  });
  const hash = (location.hash || '#dashboard').slice(1);
  if (panels[hash]) show(hash);
  document.querySelector('#accountForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const cur = document.querySelector('#password_current')?.value.trim() || '';
    const n = document.querySelector('#password_1')?.value.trim() || '';
    const c = document.querySelector('#password_2')?.value.trim() || '';
    if (cur || n || c) {
      if (!cur || !n || !c) {
        showToast('برای تغییر گذرواژه هر سه فیلد لازم است.');
        return;
      }
      if (n.length < 8) {
        showToast('گذرواژه جدید حداقل ۸ نویسه باشد.');
        return;
      }
      if (n !== c) {
        showToast('تکرار گذرواژه یکسان نیست.');
        return;
      }
    }
    showToast('تغییرات ذخیره شد.');
  });
})();


document.querySelectorAll('[data-edit]').forEach(btn => {
  btn.addEventListener('click', () => {
    const form = document.getElementById(btn.dataset.edit);
    if (!form) return;
    form.hidden = !form.hidden;
  });
});
document.querySelector('#shipSame')?.addEventListener('change', e => {
  const on = e.target.checked;
  const copy = document.querySelector('#shipCopy');
  const other = document.querySelector('#shipOther');
  if (copy) copy.hidden = !on;
  if (other) other.hidden = on;
});
document.querySelectorAll('.acc-addr-form').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    form.hidden = true;
    showToast('آدرس ذخیره شد.');
  });
});


document.querySelectorAll('.pass-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.pass);
    if (!input) return;
    const hide = input.type === 'text';
    input.type = hide ? 'password' : 'text';
    const use = btn.querySelector('use');
    if (use) use.setAttribute('href', hide ? '#i-eye' : '#i-eye-off');
  });
});

(function () {
  const file = document.querySelector('#accAvatar');
  const img = document.querySelector('#accAvatarImg');
  const letter = document.querySelector('#accAvatarLetter');
  if (!file || !img) return;
  file.addEventListener('change', () => {
    const f = file.files && file.files[0];
    if (!f || !f.type.startsWith('image/')) return;
    img.src = URL.createObjectURL(f);
    img.hidden = false;
    if (letter) letter.hidden = true;
  });
})();

document.querySelectorAll('[data-of]').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.of;
    document.querySelectorAll('[data-of]').forEach(b => b.classList.toggle('is-on', b === btn));
    document.querySelectorAll('.acc-order-list .acc-order').forEach(row => {
      row.hidden = key !== 'all' && row.dataset.ost !== key;
    });
  });
});

document.querySelectorAll('[data-unwish]').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.acc-wish')?.remove();
    const list = document.querySelector('#wishList');
    const empty = document.querySelector('#wishEmpty');
    if (list && empty && !list.querySelector('.acc-wish')) empty.hidden = false;
    showToast('از علاقه‌مندی‌ها حذف شد.');
  });
});


const PRODUCTS = {
  1: {name:'ضدآفتاب سنتلا', title:'ضدآفتاب سنتلا اصل', cat:'ضدآفتاب', price:780000, old:1100000, img:'https://storage.khanoumi.com/ProductImages/81289-202497132212596.jpg', off:'۲۹٪', short:'بافت سبک برای استفاده روزانه روی صورت. مناسب زیر آرایش.', desc:'این ضدآفتاب برای محافظت روزانه صورت است. مقدار مناسب را روی پوست تمیز پخش کنید. اگر آرایش دارید، قبل از کرم‌پودر بزنید و دو دقیقه صبر کنید تا لایه زیرین جابه‌جا نشود.', use:'۲۰ دقیقه قبل از خروج روی صورت بزنید. در آفتاب مستقیم هر دو ساعت تمدید کنید. دور چشم را با فاصله بزنید. بعد از استفاده در ظرف را ببندید.', related:[5,10,2]},
  2: {name:'رژگونه شیگلم Hush Hush', title:'رژگونه شیگلم Hush Hush', cat:'رژگونه و سایه', price:798000, old:0, img:'https://storage.khanoumi.com/ProductImages/sheglam-chroma-glow-bloom-liquid-highlighter-BB-khanoumi-202393143829344.jpg', off:'', short:'رژگونه برای برجستگی گونه. با انگشت یا براش پخش کنید.', desc:'مقدار کم را روی برجستگی گونه بزنید و به سمت شقیقه محو کنید. اگر پوست چرب است، بعد از کرم‌پودر و قبل از پودر استفاده کنید.', use:'با ضربه روی گونه بزنید. لایهٔ دوم را فقط در صورت نیاز اضافه کنید.', related:[7,9,3]},
  3: {name:'عطر پینک مای وی', title:'عطر پینک مای وی', cat:'عطر و ادکلن', price:220000, old:245000, img:'https://storage.khanoumi.com/ProductImages/8c13ddf6646745a0ac9e26d39bb92fa3.jpg', off:'۱۰٪', short:'عطر روزانه با پخش ملایم.', desc:'روی پوست تمیز، پشت گوش و مچ اسپری کنید. با لباس خیلی نزدیک اسپری نکنید تا لک نماند.', use:'دو تا سه پاف کافی است. روی پوست مرطوب ماندگاری بهتر است.', related:[2,7,12]},
  4: {name:'شامپو آرگان لایتنس', title:'شامپو آرگان لایتنس', cat:'شامپو و ماسک', price:399000, old:498000, img:'https://dkstatics-public.digikala.com/digikala-products/5a2235fefc33a4e5fe7f19be50592e894174167e_1788951528.jpg?x-oss-process=image/resize,m_lfit,h_800,w_800/quality,q_90', off:'۲۰٪', short:'شامپو برای شست‌وشوی معمول مو.', desc:'مو را خیس کنید، مقدار مناسب شامپو را کف کنید و آبکشی کنید. اگر مو رنگ‌شده است، با آب ولرم بشویید.', use:'دو بار در هفته یا طبق نیاز مو. روی پوست سر ماساژ دهید، ساقه را سبک‌تر بشویید.', related:[11,12,5]},
  5: {name:'تونر پرتقال خونی', title:'تونر پرتقال خونی', cat:'مراقبت پوستی', price:120000, old:158000, img:'https://storage.khanoumi.com/ProductImages/18-2-MHI-Double-Moisture-Normal-And-Dry-Skin-Toner-200-ml-20266417499696.jpg', off:'۲۴٪', short:'تونر بعد از شست‌وشوی صورت.', desc:'بعد از شستن صورت، با پد یا دست روی پوست بزنید و صبر کنید جذب شود. بعد از آن سرم یا مرطوب‌کننده بزنید.', use:'صبح و شب بعد از شوینده. دور چشم را با فاصله بزنید.', related:[10,1,12]},
  6: {name:'بابلیس خودکاری ریز بابی ورس', title:'بابلیس خودکاری ریز بابی ورس', cat:'محصولات برقی', price:1150000, old:1280000, img:'https://dkstatics-public.digikala.com/digikala-products/139300.jpg?x-oss-process=image/resize,m_lfit,h_800,w_800/quality,q_90', off:'۱۰٪', short:'برای پیچ و حالت دادن ساقهٔ مو.', desc:'مو را خشک و باز کنید. از گرمای متوسط شروع کنید تا مو نسوزد. بخش‌های نازک بگیرید تا پیچ یکدست شود.', use:'موی خیس استفاده نکنید. بعد از کار دستگاه را خاموش و خنک کنید.', related:[4,12,3]},
  7: {name:'رژگونه مایع الی زکیتا', title:'رژگونه مایع الی.زکیتا', cat:'رژگونه و سایه', price:350000, old:0, img:'https://storage.khanoumi.com/ProductImages/sheglam-chroma-glow-bloom-liquid-highlighter-02-khanoumi-202393143931705.jpg', off:'', short:'رژگونه مایع برای پخش روی گونه.', desc:'نقطهٔ خیلی کم روی گونه بگذارید و سریع محو کنید تا لکه نماند. روی کرم‌پودر بهتر می‌نشیند.', use:'با انگشت یا اسفنج نم‌دار پخش کنید. قبل از پودر فیکس بزنید.', related:[2,9,3]},
  8: {name:'ضدآفتاب وکالی SPF60 کلاژن', title:'ضدآفتاب وکالی SPF60 کلاژن', cat:'ضدآفتاب', price:299000, old:325000, img:'https://dkstatics-public.digikala.com/digikala-products/7c223da9a7ea5df4fc91d5227a6503f43a32e44d_1754235920.jpg?x-oss-process=image/resize,m_lfit,h_800,w_800/quality,q_90', off:'۸٪', short:'ضدآفتاب صورت برای استفاده روزانه.', desc:'روی پوست تمیز، قبل از آرایش پخش کنید. مقدار کم را چند نقطه بگذارید تا سفیدک نماند.', use:'۲۰ دقیقه قبل از خروج. هر دو ساعت در آفتاب تمدید کنید.', related:[1,5,10]},
  9: {name:'ریمل اسنس لش پرینسس', title:'ریمل اسنس لش پرینسس', cat:'ریمل', price:850000, old:1150000, img:'https://storage.khanoumi.com/ProductImages/0938eb0dd85b432f8f705b6c7367c1a7.jpg', off:'۲۶٪', short:'ریمل برای حجم و جدا کردن مژه.', desc:'برس را از ریشه به نوک بکشید. لایهٔ دوم را بعد از کمی خشک شدن بزنید تا گلوله نشود.', use:'مژه را از قبل خشک کنید. در ظرف را بعد از استفاده ببندید.', related:[2,7,3]},
  10: {name:'کرم آبرسان گارنیر هیالورونیک', title:'کرم آبرسان گارنیر هیالورونیک', cat:'مرطوب‌کننده و آبرسان', price:198000, old:248000, img:'https://storage.khanoumi.com/ProductImages/Garnier-Moisturizing-Cream-Hyaluronic-Acid-And-Aloe-Vera-50ml.khanoumi-20236131045238.jpg', off:'۲۰٪', short:'مرطوب‌کننده برای بعد از شست‌وشوی صورت.', desc:'صبح و شب روی صورت و گردن بزنید. اگر ضدآفتاب می‌زنید، آبرسان را قبل از آن بزنید.', use:'مقدار کم را تا جذب کامل پخش کنید. دور چشم را جداگانه مراقبت کنید.', related:[5,1,12]},
  11: {name:'شامپو تثبیت رنگ هیدرودرم', title:'شامپو تثبیت رنگ هیدرودرم', cat:'شامپو و ماسک', price:400000, old:499000, img:'https://storage.khanoumi.com/ProductImages/c61a3d2024614882a5ae9ad57bc8f24c.jpg', off:'۲۰٪', short:'شامپو برای موی رنگ‌شده.', desc:'مو را خیس کنید و شامپو را روی ساقه و پوست سر پخش کنید. با آب ولرم آبکشی کنید تا رنگ کمتر باز شود.', use:'به‌جای شامپوی روزانه، طبق نیاز مو. از آب خیلی داغ پرهیز کنید.', related:[4,12,5]},
  12: {name:'روغن آرگان استوینت', title:'روغن آرگان استوینت', cat:'شامپو و ماسک مو', price:389000, old:465000, img:'https://storage.khanoumi.com/ProductImages/8e9b1bbc1ff341a5bf6f9ab658b90e09.jpg', off:'۱۶٪', short:'روغن برای ساقهٔ خشک مو.', desc:'دو قطره روی ساقه و انتهای مو بزنید. به ریشه نزنید تا مو سنگینی نکند.', use:'روی موی خشک یا مرطوب. قبل از خواب یا قبل از حرارت ملایم.', related:[4,11,5]}
};



(() => {
  const box = document.querySelector('.ps-product');
  if (!box) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('p') || '1';
  const p = PRODUCTS[id] || PRODUCTS[1];
  const set = (sel, fn) => { const el = document.querySelector(sel); if (el) fn(el); };
  box.dataset.name = p.name;
  box.dataset.price = String(p.price);
  box.dataset.old = String(p.old || '');
  box.dataset.img = p.img;
  set('#psImg', el => { el.src = p.img; el.alt = p.title; });
  set('#psTitle', el => { el.textContent = p.title; });
  set('#psCat', el => { el.textContent = p.cat; });
  set('#psCatLink', el => { el.textContent = p.cat; });
  set('#psCrumb', el => { el.textContent = p.title; });
  set('#psDesc', el => { el.textContent = p.desc; });
  set('#psNow', el => { el.textContent = fa(p.price); });
  const showOff = !!(p.old && p.off);
  set('#psOld', el => {
    if (p.old) { el.hidden = false; el.textContent = fa(p.old); }
    else { el.hidden = true; }
  });
  set('#psOff', el => {
    el.hidden = !showOff;
    if (showOff) el.textContent = p.off;
  });
  set('#psOffMark', el => {
    el.hidden = !showOff;
    if (showOff) el.textContent = p.off;
  });
  document.title = p.title + ' | خلیج فارس';
  const gallery = [p.img, ...(p.related || []).map(rid => PRODUCTS[rid]?.img).filter(Boolean)]
    .filter((src, i, arr) => arr.indexOf(src) === i)
    .slice(0, 4);
  const thumbs = document.querySelector('#psThumbs');
  const mainImg = document.querySelector('#psImg');
  const zoom = document.querySelector('#psZoom');
  const zoomImg = document.querySelector('#psZoomImg');
  let gIndex = 0;
  const showG = i => {
    gIndex = (i + gallery.length) % gallery.length;
    const src = gallery[gIndex];
    if (mainImg && src) mainImg.src = src;
    if (zoomImg && src) zoomImg.src = src;
    thumbs?.querySelectorAll('button').forEach(b => b.classList.toggle('is-on', +b.dataset.g === gIndex));
  };
  if (thumbs) {
    thumbs.innerHTML = gallery.map((src, i) =>
      `<button type="button" data-g="${i}" class="${i === 0 ? 'is-on' : ''}"><img src="${src}" alt="" referrerpolicy="no-referrer"></button>`
    ).join('');
    thumbs.addEventListener('click', e => {
      const btn = e.target.closest('[data-g]');
      if (btn) showG(+btn.dataset.g);
    });
  }
  const openZoom = () => {
    if (!zoom || !gallery.length) return;
    if (zoomImg) {
      zoomImg.src = gallery[gIndex];
      zoomImg.alt = mainImg?.alt || '';
    }
    zoom.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const closeZoom = () => {
    if (!zoom) return;
    zoom.hidden = true;
    document.body.style.overflow = '';
  };
  document.querySelector('#psZoomOpen')?.addEventListener('click', openZoom);
  document.querySelector('#psZoomClose')?.addEventListener('click', closeZoom);
  document.querySelector('#psZoomPrev')?.addEventListener('click', e => { e.stopPropagation(); showG(gIndex - 1); });
  document.querySelector('#psZoomNext')?.addEventListener('click', e => { e.stopPropagation(); showG(gIndex + 1); });
  zoom?.addEventListener('click', e => { if (e.target === zoom) closeZoom(); });
  document.addEventListener('keydown', e => {
    if (!zoom || zoom.hidden) return;
    if (e.key === 'Escape') closeZoom();
    if (e.key === 'ArrowRight') showG(gIndex - 1);
    if (e.key === 'ArrowLeft') showG(gIndex + 1);
  });
  const rel = document.querySelector('#psRelated');
  if (rel) {
    rel.innerHTML = (p.related || []).map(rid => {
      const r = PRODUCTS[rid];
      if (!r) return '';
      return `<a class="aside-post" href="product.html?p=${rid}"><img src="${r.img}" alt="" loading="lazy" referrerpolicy="no-referrer"><span><strong>${r.title}</strong></span></a>`;
    }).join('');
  }

  let qty = 1;
  const num = document.querySelector('#psQtyNum');
  document.querySelector('#psMinus')?.addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    if (num) num.textContent = fa(qty);
  });
  document.querySelector('#psPlus')?.addEventListener('click', () => {
    qty += 1;
    if (num) num.textContent = fa(qty);
  });
  document.querySelector('#psAdd')?.addEventListener('click', () => {
    const d = box.dataset;
    const it = cart.get(d.name) || { name: d.name, price: +d.price, old: +(d.old || d.price), img: d.img, qty: 0 };
    it.qty += qty;
    cart.set(d.name, it);
    renderCart();
    cartCount.classList.remove('bump'); void cartCount.offsetWidth; cartCount.classList.add('bump');
    const btn = document.querySelector('#psAdd');
    const label = btn.querySelector('span');
    const prev = label ? label.textContent : '';
    btn.classList.remove('is-added');
    void btn.offsetWidth;
    btn.classList.add('is-added');
    if (label) label.textContent = 'اضافه شد';
    clearTimeout(btn._addT);
    btn._addT = setTimeout(() => {
      btn.classList.remove('is-added');
      if (label) label.textContent = prev;
    }, 1400);
  });

  const faDigits = '۰۱۲۳۴۵۶۷۸۹';
  const toEn = v => String(v ?? '').replace(/[۰-۹]/g, d => String(faDigits.indexOf(d)));
  const okPhone = v => /^09\d{9}$/.test(toEn(v).replace(/\D/g, ''));
  const starsHtml = n => {
    let s = '';
    for (let i = 1; i <= 5; i++) s += `<svg class="ic${i > n ? ' is-off' : ''}"><use href="#i-star"/></svg>`;
    return s;
  };
  let rating = 0;
  const rateVal = document.querySelector('#revRateVal');
  const paintStars = n => {
    document.querySelectorAll('#revStars [data-star]').forEach(b => {
      const v = +b.dataset.star;
      b.classList.toggle('is-fill', v <= n);
      b.classList.toggle('is-on', v === n);
    });
    if (rateVal) {
      rateVal.hidden = !n;
      if (n) rateVal.textContent = fa(n) + ' از ' + fa(5);
    }
  };
  const scale = document.querySelector('#revStars .ps-rate-scale');
  scale?.querySelectorAll('[data-star]').forEach(b => {
    b.addEventListener('click', () => { rating = +b.dataset.star; paintStars(rating); });
  });
  scale?.addEventListener('mouseover', e => {
    const b = e.target.closest('[data-star]');
    if (b) paintStars(+b.dataset.star);
  });
  scale?.addEventListener('mouseleave', () => paintStars(rating));
  const list = document.querySelector('#revList');
  const empty = document.querySelector('#revEmpty');
  const form = document.querySelector('#reviewForm');
  const addReview = (parent, name, text, rate) => {
    const li = document.createElement('li');
    li.className = 'ps-rev' + (parent !== list ? ' is-child' : '');
    const letter = (name || 'ن').trim().charAt(0);
    li.innerHTML = `<div class="ps-rev-head"><span class="ps-rev-ava" aria-hidden="true">${letter}</span><div><p class="ps-rev-idline"><strong></strong> <time>امروز</time></p>${rate ? `<span class="ps-rev-stars">${starsHtml(rate)}</span>` : ''}</div></div><p></p>`;
    li.querySelector('strong').textContent = name;
    li.querySelector('p:not(.ps-rev-idline)').textContent = text;
    if (parent === list) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ps-rev-replybtn';
      btn.dataset.reply = '';
      btn.textContent = 'پاسخ';
      li.appendChild(btn);
    }
    parent.appendChild(li);
    if (empty) empty.hidden = true;
  };
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.querySelector('#revName')?.value.trim() || '';
    const phone = document.querySelector('#revPhone')?.value.trim() || '';
    const text = document.querySelector('#revText')?.value.trim() || '';
    if (!name) { showToast('نام را بنویسید.'); return; }
    if (!okPhone(phone)) { showToast('شماره موبایل را با ۰۹ وارد کنید.'); return; }
    if (!rating) { showToast('امتیاز را انتخاب کنید.'); return; }
    if (!text) { showToast('متن دیدگاه را بنویسید.'); return; }
    addReview(list, name, text, rating);
    form.reset();
    rating = 0;
    paintStars(0);
    showToast('دیدگاه ثبت شد.');
  });
  document.querySelector('#reviews')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-reply]');
    if (!btn) return;
    const li = btn.closest('.ps-rev');
    if (!li) return;
    let wrap = li.querySelector('.ps-rev-form.is-inline');
    if (wrap) { wrap.remove(); return; }
    document.querySelectorAll('.ps-rev-form.is-inline').forEach(f => f.remove());
    wrap = document.createElement('form');
    wrap.className = 'ps-rev-form is-inline';
    wrap.innerHTML = `<div class="cf-row"><div class="cf-item"><label class="cf-label">نام</label><div class="cf-control"><svg class="ic"><use href="#i-user"/></svg><input name="rname" type="text" required></div></div><div class="cf-item"><label class="cf-label">شماره موبایل</label><div class="cf-control"><svg class="ic"><use href="#i-phone"/></svg><input name="rphone" class="phone-ltr" dir="ltr" type="tel" required></div></div></div><div class="cf-item"><label class="cf-label">پاسخ</label><div class="cf-control cf-control-area"><svg class="ic"><use href="#i-edit"/></svg><textarea name="rtext" required></textarea></div></div><button class="btn btn-solid" type="submit"><span>ثبت پاسخ</span></button>`;
    wrap.addEventListener('submit', ev => {
      ev.preventDefault();
      const fd = new FormData(wrap);
      const name = String(fd.get('rname') || '').trim();
      const phone = String(fd.get('rphone') || '').trim();
      const text = String(fd.get('rtext') || '').trim();
      if (!name) { showToast('نام را بنویسید.'); return; }
      if (!okPhone(phone)) { showToast('شماره موبایل را با ۰۹ وارد کنید.'); return; }
      if (!text) { showToast('متن پاسخ را بنویسید.'); return; }
      let kids = li.querySelector('.ps-rev-children');
      if (!kids) {
        kids = document.createElement('ol');
        kids.className = 'ps-rev-children';
        li.appendChild(kids);
      }
      addReview(kids, name, text, 0);
      wrap.remove();
      showToast('پاسخ ثبت شد.');
    });
    btn.after(wrap);
  });
})();
