/* ---------- Shared room data ---------- */
const HOTEL_ROOMS = [
  { id: 'single',   label: 'Single Room',                nights_label: '1 single bed · sleeps 1',       price: 54,  maxGuests: 1, img: 'images/site/single-room.jpg',     desc: 'A compact, quiet room for solo travellers.', rating: 4.8, reviews: 127, badge: 'Popular', perks: ['Free WiFi', 'Private parking', 'Air-conditioned'] },
  { id: 'twin',     label: 'Twin Room',                   nights_label: '2 single beds · sleeps 2',      price: 75,  maxGuests: 2, img: 'images/site/twin-room.jpg',       desc: 'A favourite with friends travelling together.', rating: 4.7, reviews: 96, badge: 'Best for friends', perks: ['Two single beds', 'Large bathroom', 'Great location'] },
  { id: 'double12', label: 'Double Room', small: '(1–2 Adults)', nights_label: '1 double bed · sleeps 1–2', price: 75, maxGuests: 2, img: 'images/site/double-room-1-2.jpg', desc: 'Flexible whether you’re solo or a pair.', rating: 4.6, reviews: 84, badge: 'Top value', perks: ['Flexible guest setup', 'En-suite', 'Fast check-in'] },
  { id: 'double',   label: 'Double Room',                 nights_label: '1 double bed · sleeps 2',        price: 80,  maxGuests: 2, img: 'images/site/double-room.jpg',     desc: 'Our classic double for couples and city breaks.', rating: 4.9, reviews: 214, badge: 'Guest favourite', perks: ['Breakfast available', 'Quiet street', 'Flat‑screen TV'] },
  { id: 'triple',   label: 'Triple Room',                 nights_label: '3 single beds · sleeps 3',       price: 95,  maxGuests: 3, img: 'images/site/triple-room.jpg',     desc: 'Extra space for small groups.', rating: 4.7, reviews: 73, badge: 'Family pick', perks: ['Extra space', 'Near Westfield', 'Non-smoking'] },
  { id: 'quad',     label: 'Quadruple Room',               nights_label: '2 double beds · sleeps 4',       price: 120, maxGuests: 4, img: 'images/site/quadruple-room.jpg',  desc: 'Roomy enough for two couples or a family of four.', rating: 4.8, reviews: 61, badge: 'Large family room', perks: ['Spacious', 'Two double beds', 'Private parking'] },
  { id: 'family',   label: 'Family Room',                 nights_label: '2 single beds & 1 double · sleeps 5', price: 120, maxGuests: 5, img: 'images/site/family-room.jpg', desc: 'Our largest room, built for family stays.', rating: 4.9, reviews: 118, badge: 'Very popular', perks: ['Sleeps 5', 'Family-friendly', 'Easy transport links'] },
];

function toLocalISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
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

function setDateConstraints(checkInInput, checkOutInput, nightsEl) {
  const todayStr = toLocalISODate(new Date());
  checkInInput.min = todayStr;

  function updateNights() {
    if (!nightsEl) return;
    const n = nightsBetween(checkInInput.value, checkOutInput.value);
    if (n > 0) {
      nightsEl.textContent = n + (n === 1 ? ' night' : ' nights');
      nightsEl.classList.add('visible');
    } else {
      nightsEl.classList.remove('visible');
    }
  }

  checkInInput.addEventListener('change', () => {
    if (!checkInInput.value) return;
    const next = new Date(checkInInput.value + 'T00:00:00');
    if (isNaN(next.getTime())) return;
    next.setDate(next.getDate() + 1);
    const nextStr = toLocalISODate(next);
    checkOutInput.min = nextStr;
    if (!checkOutInput.value || checkOutInput.value <= checkInInput.value) {
      checkOutInput.value = nextStr;
    }
    updateNights();
  });
  checkOutInput.addEventListener('change', updateNights);
  updateNights();
}

/* ================= Homepage hero search widget ================= */
(function () {
  const widget = document.getElementById('heroSearchWidget');
  if (!widget) return;
  const checkIn = widget.querySelector('#hsCheckIn');
  const checkOut = widget.querySelector('#hsCheckOut');
  setDateConstraints(checkIn, checkOut, widget.querySelector('#hsNights'));
  initGuestsDropdown(widget);

  widget.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn.value) params.set('checkin', checkIn.value);
    if (checkOut.value) params.set('checkout', checkOut.value);
    const guests = widget.querySelector('.stepper b').textContent;
    params.set('guests', guests);
    window.location.href = '/book?' + params.toString();
  });
})();

/* ================= Book Direct page ================= */
(function () {
  const widget = document.getElementById('bookSearchWidget');
  const roomListEl = document.getElementById('roomList');
  if (!widget || !roomListEl) return;

  const checkIn = widget.querySelector('#bsCheckIn');
  const checkOut = widget.querySelector('#bsCheckOut');
  setDateConstraints(checkIn, checkOut, widget.querySelector('#bsNights'));
  const guestsCtrl = initGuestsDropdown(widget, renderRooms);

  const params = new URLSearchParams(window.location.search);
  if (params.get('checkin')) checkIn.value = params.get('checkin');
  if (params.get('checkout')) checkOut.value = params.get('checkout');
  if (params.get('guests')) guestsCtrl.set(parseInt(params.get('guests'), 10) || 2);
  if (checkIn.value) checkOut.min = checkIn.value;
  if (checkIn.value || checkOut.value) checkOut.dispatchEvent(new Event('change'));

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

  function renderRooms() {
    const stay = currentStay();
    roomListEl.innerHTML = '';

    HOTEL_ROOMS.forEach((room) => {
      const overGuests = stay.guests > room.maxGuests;
      const item = document.createElement('article');
      item.className = 'rl-item booking-card' + (overGuests ? ' dimmed' : '');
      item.id = 'room-' + room.id;

      const totalPrice = stay.nights > 0 ? room.price * stay.nights : room.price;
      const nightlyLabel = stay.nights > 0 ? `${stay.nights} night${stay.nights > 1 ? 's' : ''} total` : 'per night';
      const reviewText = `${room.rating.toFixed(1)} · ${room.reviews} reviews`;
      const tags = room.perks.map((perk) => `<span>${perk}</span>`).join('');

      item.innerHTML = `
        <div class="rl-media booking-card__media"><img src="${room.img}" alt="${room.label} at Hotel 261" loading="lazy"></div>
        <div class="rl-body booking-card__body">
          <div class="booking-card__header">
            <div>
              <div class="booking-card__badge">${room.badge}</div>
              <h3>${room.label}${room.small ? ` <small>${room.small}</small>` : ''}</h3>
            </div>
            <div class="booking-card__score">
              <span class="score-pill">${room.rating.toFixed(1)}</span>
              <small>${reviewText}</small>
            </div>
          </div>
          <p class="rl-meta">${room.nights_label} · ${room.desc}</p>
          <div class="rl-tags">${tags}</div>
          ${overGuests ? `<p class="rl-note">Sleeps up to ${room.maxGuests} — too small for ${stay.guests} guests</p>` : ''}
        </div>
        <div class="rl-price booking-card__price">
          <div class="booking-card__price-inner">
            <span class="amount">£${totalPrice.toLocaleString('en-GB')}</span>
            <span class="per">${nightlyLabel}</span>
          </div>
          <button type="button" class="btn btn-primary rl-reserve" ${overGuests ? 'disabled' : ''}>I&rsquo;ll Reserve</button>
        </div>
      `;

      const reserveBtn = item.querySelector('.rl-reserve');
      if (!overGuests) {
        reserveBtn.addEventListener('click', () => openCheckout(room, currentStay()));
      }

      roomListEl.appendChild(item);
    });
  }

  renderRooms();

  /* ---------- Checkout: room -> your details -> payment ---------- */
  const roomsSection = document.getElementById('roomsSection');
  const checkoutSection = document.getElementById('checkoutSection');
  const detailsPanel = document.getElementById('checkoutDetailsPanel');
  const paymentPanel = document.getElementById('checkoutPaymentPanel');
  const stepDetails = document.querySelector('.checkout-step[data-step="details"]');
  const stepPayment = document.querySelector('.checkout-step[data-step="payment"]');

  const coName = document.getElementById('coName');
  const coEmail = document.getElementById('coEmail');
  const coPhone = document.getElementById('coPhone');
  const coGuestsDisplay = document.getElementById('coGuestsDisplay');
  const coRequests = document.getElementById('coRequests');
  const coDetailsError = document.getElementById('coDetailsError');
  const coPaymentError = document.getElementById('coPaymentError');
  const coContinueBtn = document.getElementById('coContinueBtn');
  const coPayBtn = document.getElementById('coPayBtn');
  const coPayLabel = document.getElementById('coPayLabel');
  const coPayAmount = document.getElementById('coPayAmount');

  let activeRoom = null;
  let activeStay = null;

  function setError(box, msg) {
    box.textContent = msg;
    box.classList.toggle('visible', !!msg);
  }

  function fillSummary(room, stay) {
    const totalPrice = stay.nights > 0 ? room.price * stay.nights : room.price;
    document.getElementById('csRoom').textContent = room.label;
    document.getElementById('csCheckIn').textContent = fmtDateShort(stay.checkIn);
    document.getElementById('csCheckOut').textContent = fmtDateShort(stay.checkOut);
    document.getElementById('csNights').textContent = stay.nights || '—';
    document.getElementById('csGuests').textContent = stay.guests;
    document.getElementById('csTotal').textContent = '£' + totalPrice.toLocaleString('en-GB');
    coGuestsDisplay.value = stay.guests + (stay.guests === 1 ? ' guest' : ' guests');
    coPayAmount.textContent = '£' + totalPrice.toLocaleString('en-GB');
  }

  function openCheckout(room, stay) {
    if (!stay.checkIn || !stay.checkOut) {
      alert('Please choose your check-in and check-out dates above.');
      return;
    }
    activeRoom = room;
    activeStay = stay;
    fillSummary(room, stay);
    setError(coDetailsError, '');
    setError(coPaymentError, '');
    showDetailsStep();
    roomsSection.style.display = 'none';
    checkoutSection.style.display = 'block';
    checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => coName.focus(), 300);
  }

  function showDetailsStep() {
    detailsPanel.style.display = 'block';
    paymentPanel.style.display = 'none';
    stepDetails.classList.add('active');
    stepDetails.classList.remove('done');
    stepPayment.classList.remove('active');
  }

  function showPaymentStep() {
    detailsPanel.style.display = 'none';
    paymentPanel.style.display = 'block';
    stepDetails.classList.remove('active');
    stepDetails.classList.add('done');
    stepPayment.classList.add('active');
  }

  document.getElementById('backToRooms').addEventListener('click', () => {
    checkoutSection.style.display = 'none';
    roomsSection.style.display = 'block';
    roomsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('backToDetails').addEventListener('click', showDetailsStep);

  coContinueBtn.addEventListener('click', () => {
    setError(coDetailsError, '');
    const name = coName.value.trim();
    const email = coEmail.value.trim();
    const phone = coPhone.value.trim();
    if (!name) { setError(coDetailsError, 'Please enter your full name.'); coName.focus(); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(coDetailsError, 'Please enter a valid email address.'); coEmail.focus(); return; }
    if (!phone) { setError(coDetailsError, 'Please enter a phone number, in case we need to reach you.'); coPhone.focus(); return; }
    showPaymentStep();
  });

  coPayBtn.addEventListener('click', () => {
    setError(coPaymentError, '');
    if (!activeRoom || !activeStay) return;

    const name = coName.value.trim();
    const email = coEmail.value.trim();
    const phone = coPhone.value.trim();
    const specialRequests = coRequests.value.trim();

    coPayBtn.disabled = true;
    coPayLabel.textContent = 'Redirecting…';
    coPayAmount.style.display = 'none';

    fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomType: activeRoom.id, checkIn: activeStay.checkIn, checkOut: activeStay.checkOut,
        guests: activeStay.guests, name, email, phone, specialRequests,
      }),
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data.url) throw new Error((data && data.error) || 'Something went wrong. Please try again.');
        window.location.href = data.url;
      })
      .catch(err => {
        setError(coPaymentError, err.message);
        coPayBtn.disabled = false;
        coPayLabel.textContent = 'Pay Securely — ';
        coPayAmount.style.display = '';
      });
  });

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

/* ---------- Booking result ---------- */
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
