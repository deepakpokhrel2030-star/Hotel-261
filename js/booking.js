/* ---------- Shared room data ---------- */
const HOTEL_ROOMS = [
  { id: 'single',   label: 'Single Room',                nights_label: '1 single bed · sleeps 1',       price: 54,  maxGuests: 1, img: 'images/site/single-room.jpg',     desc: 'A compact, quiet room for solo travellers.' },
  { id: 'twin',     label: 'Twin Room',                   nights_label: '2 single beds · sleeps 2',      price: 75,  maxGuests: 2, img: 'images/site/twin-room.jpg',       desc: 'A favourite with friends travelling together.' },
  { id: 'double12', label: 'Double Room', small: '(1–2 Adults)', nights_label: '1 double bed · sleeps 1–2', price: 75, maxGuests: 2, img: 'images/site/double-room-1-2.jpg', desc: 'Flexible whether you’re solo or a pair.' },
  { id: 'double',   label: 'Double Room',                 nights_label: '1 double bed · sleeps 2',        price: 80,  maxGuests: 2, img: 'images/site/double-room.jpg',     desc: 'Our classic double for couples and city breaks.' },
  { id: 'triple',   label: 'Triple Room',                 nights_label: '3 single beds · sleeps 3',       price: 95,  maxGuests: 3, img: 'images/site/triple-room.jpg',     desc: 'Extra space for small groups.' },
  { id: 'quad',     label: 'Quadruple Room',               nights_label: '2 double beds · sleeps 4',       price: 120, maxGuests: 4, img: 'images/site/quadruple-room.jpg',  desc: 'Roomy enough for two couples or a family of four.' },
  { id: 'family',   label: 'Family Room',                 nights_label: '2 single beds & 1 double · sleeps 5', price: 120, maxGuests: 5, img: 'images/site/family-room.jpg', desc: 'Our largest room, built for family stays.' },
];

function nightsBetween(a, b) {
  if (!a || !b) return 0;
  const ms = new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime();
  const n = Math.round(ms / 86400000);
  return isNaN(n) ? 0 : n;
}
function fmtDateShort(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ---------- Guests stepper dropdown (shared by any .sw-guests-field on the page) ---------- */
function initGuestsDropdown(root, onChange) {
  const field = root.querySelector('.sw-guests-field');
  if (!field) return null;
  const toggle = field.querySelector('.sw-guests-toggle');
  const dropdown = field.querySelector('.guests-dropdown');
  const minus = field.querySelector('[data-step="-"]');
  const plus = field.querySelector('[data-step="+"]');
  const countEl = field.querySelector('.stepper b');
  const doneBtn = field.querySelector('.guests-done');

  let count = parseInt(countEl.textContent, 10) || 2;
  const MIN = 1, MAX = 8;

  function render(notify) {
    countEl.textContent = count;
    minus.disabled = count <= MIN;
    plus.disabled = count >= MAX;
    toggle.textContent = count + (count === 1 ? ' guest' : ' guests');
    if (notify && onChange) onChange(count);
  }
  minus.addEventListener('click', (e) => { e.stopPropagation(); if (count > MIN) { count--; render(true); } });
  plus.addEventListener('click', (e) => { e.stopPropagation(); if (count < MAX) { count++; render(true); } });
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.guests-dropdown.open').forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
    dropdown.classList.toggle('open');
  });
  doneBtn.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.remove('open'); });
  document.addEventListener('click', (e) => {
    if (!field.contains(e.target)) dropdown.classList.remove('open');
  });

  render(false);
  return { get: () => count, set: (v) => { count = Math.min(MAX, Math.max(MIN, v)); render(true); } };
}

function setDateConstraints(checkInInput, checkOutInput) {
  const todayStr = new Date().toISOString().slice(0, 10);
  checkInInput.min = todayStr;
  checkInInput.addEventListener('change', () => {
    if (!checkInInput.value) return;
    const next = new Date(checkInInput.value + 'T00:00:00');
    if (isNaN(next.getTime())) return;
    next.setDate(next.getDate() + 1);
    const nextStr = next.toISOString().slice(0, 10);
    checkOutInput.min = nextStr;
    if (!checkOutInput.value || checkOutInput.value <= checkInInput.value) {
      checkOutInput.value = nextStr;
    }
  });
}

/* ================= Homepage hero search widget ================= */
(function () {
  const widget = document.getElementById('heroSearchWidget');
  if (!widget) return;
  const checkIn = widget.querySelector('#hsCheckIn');
  const checkOut = widget.querySelector('#hsCheckOut');
  setDateConstraints(checkIn, checkOut);
  initGuestsDropdown(widget);

  widget.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn.value) params.set('checkin', checkIn.value);
    if (checkOut.value) params.set('checkout', checkOut.value);
    const guests = widget.querySelector('.stepper b').textContent;
    params.set('guests', guests);
    window.location.href = 'book.html?' + params.toString();
  });
})();

/* ================= Book Direct page ================= */
(function () {
  const widget = document.getElementById('bookSearchWidget');
  const roomListEl = document.getElementById('roomList');
  if (!widget || !roomListEl) return;

  const checkIn = widget.querySelector('#bsCheckIn');
  const checkOut = widget.querySelector('#bsCheckOut');
  setDateConstraints(checkIn, checkOut);
  const guestsCtrl = initGuestsDropdown(widget, renderRooms);

  const params = new URLSearchParams(window.location.search);
  if (params.get('checkin')) checkIn.value = params.get('checkin');
  if (params.get('checkout')) checkOut.value = params.get('checkout');
  if (params.get('guests')) guestsCtrl.set(parseInt(params.get('guests'), 10) || 2);
  if (checkIn.value) checkOut.min = checkIn.value;

  widget.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    renderRooms();
    roomListEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function currentStay() {
    const ci = checkIn.value, co = checkOut.value;
    const nights = nightsBetween(ci, co);
    return { checkIn: ci, checkOut: co, nights, guests: guestsCtrl.get() };
  }

  function closeAllPanels(except) {
    roomListEl.querySelectorAll('.reserve-panel.open').forEach(p => {
      if (p !== except) p.classList.remove('open');
    });
  }

  function submitReservation(room, stay, panel, btn) {
    const nameInput = panel.querySelector('.rp-name');
    const emailInput = panel.querySelector('.rp-email');
    const errorBox = panel.querySelector('.form-error');
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    errorBox.textContent = '';
    errorBox.classList.remove('visible');

    if (!stay.checkIn || !stay.checkOut) {
      errorBox.textContent = 'Please choose your check-in and check-out dates above.';
      errorBox.classList.add('visible');
      return;
    }
    if (!name) { errorBox.textContent = 'Please enter your full name.'; errorBox.classList.add('visible'); return; }
    if (!email) { errorBox.textContent = 'Please enter your email address.'; errorBox.classList.add('visible'); return; }

    btn.disabled = true;
    btn.textContent = 'Redirecting…';

    fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomType: room.id, checkIn: stay.checkIn, checkOut: stay.checkOut,
        guests: stay.guests, name, email,
      }),
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data.url) throw new Error((data && data.error) || 'Something went wrong. Please try again.');
        window.location.href = data.url;
      })
      .catch(err => {
        errorBox.textContent = err.message;
        errorBox.classList.add('visible');
        btn.disabled = false;
        btn.textContent = 'Continue to Secure Payment';
      });
  }

  function renderRooms() {
    const stay = currentStay();
    roomListEl.innerHTML = '';

    HOTEL_ROOMS.forEach((room, i) => {
      const overGuests = stay.guests > room.maxGuests;
      const item = document.createElement('article');
      item.className = 'rl-item' + (overGuests ? ' dimmed' : '');
      item.id = 'room-' + room.id;

      const priceHtml = stay.nights > 0
        ? `<span class="amount">£${(room.price * stay.nights).toLocaleString('en-GB')}</span><span class="per">${stay.nights} night${stay.nights > 1 ? 's' : ''} total</span>`
        : `<span class="amount">£${room.price}</span><span class="per">per night</span>`;

      item.innerHTML = `
        <div class="rl-media"><img src="${room.img}" alt="${room.label} at Hotel 261" loading="lazy"></div>
        <div class="rl-body">
          <h3>${room.label}${room.small ? ` <small>${room.small}</small>` : ''}</h3>
          <p class="rl-meta">${room.nights_label} &middot; ${room.desc}</p>
          <div class="rl-tags"><span>Ensuite</span><span>Flat-screen TV</span><span>Free WiFi</span></div>
          ${overGuests ? `<p class="rl-note">Sleeps up to ${room.maxGuests} — too small for ${stay.guests} guests</p>` : ''}
        </div>
        <div class="rl-price">
          ${priceHtml}
          <button type="button" class="btn btn-primary rl-reserve" ${overGuests ? 'disabled' : ''}>I&rsquo;ll Reserve</button>
        </div>
        <div class="reserve-panel">
          <div class="reserve-panel-inner">
            <div class="form-row"><label>Full name</label><input type="text" class="rp-name" autocomplete="name"></div>
            <div class="form-row"><label>Email</label><input type="email" class="rp-email" autocomplete="email"></div>
            <button type="button" class="btn btn-primary rp-submit">Continue to Secure Payment</button>
            <div class="form-error"></div>
          </div>
        </div>
      `;

      const panel = item.querySelector('.reserve-panel');
      const reserveBtn = item.querySelector('.rl-reserve');
      const submitBtn = item.querySelector('.rp-submit');

      if (!overGuests) {
        reserveBtn.addEventListener('click', () => {
          const isOpen = panel.classList.contains('open');
          closeAllPanels();
          panel.classList.toggle('open', !isOpen);
          if (!isOpen) panel.querySelector('.rp-name').focus();
        });
        submitBtn.addEventListener('click', () => submitReservation(room, currentStay(), panel, submitBtn));
      }

      roomListEl.appendChild(item);
    });
  }

  renderRooms();

  const preselectRoom = params.get('room');
  if (preselectRoom) {
    setTimeout(() => {
      const el = document.getElementById('room-' + preselectRoom);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const btn = el.querySelector('.rl-reserve');
        if (btn && !btn.disabled) btn.click();
      }
    }, 100);
  }
})();

/* ---------- Booking result (booking-success.html) ---------- */
(function () {
  const loading = document.getElementById('resultLoading');
  if (!loading) return;

  const paidBox = document.getElementById('resultPaid');
  const errorBox = document.getElementById('resultError');
  const errorMsg = document.getElementById('resultErrorMsg');

  function show(el) {
    loading.style.display = 'none';
    paidBox.style.display = 'none';
    errorBox.style.display = 'none';
    el.style.display = 'block';
  }

  const sessionId = new URLSearchParams(window.location.search).get('session_id');
  if (!sessionId) {
    errorMsg.textContent = 'We couldn’t find that booking session.';
    show(errorBox);
    return;
  }

  fetch('/api/verify-session?session_id=' + encodeURIComponent(sessionId))
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok || !data.paid) {
        errorMsg.textContent = (data && data.error) || 'This booking hasn’t been confirmed as paid.';
        show(errorBox);
        return;
      }
      document.getElementById('resultName').textContent = data.guestName ? ', ' + data.guestName.split(' ')[0] : '';
      document.getElementById('rRoom').textContent = data.roomLabel || '—';
      document.getElementById('rCheckIn').textContent = fmtDateShort(data.checkIn);
      document.getElementById('rCheckOut').textContent = fmtDateShort(data.checkOut);
      document.getElementById('rNights').textContent = data.nights || '—';
      document.getElementById('rGuests').textContent = data.guests || '—';
      const amount = (data.amountTotal / 100).toLocaleString('en-GB', { style: 'currency', currency: (data.currency || 'gbp').toUpperCase() });
      document.getElementById('rTotal').textContent = amount;
      show(paidBox);
    })
    .catch(() => {
      errorMsg.textContent = 'We couldn’t reach the server to confirm this booking.';
      show(errorBox);
    });
})();
