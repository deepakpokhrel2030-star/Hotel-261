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
function t(key, fallback) {
  const val = window.HOTEL261_I18N && window.HOTEL261_I18N.t(key);
  return val !== undefined ? val : fallback;
}
function formatBookingRef(id) {
  if (!id) return '—';
  return 'H261-' + String(id).padStart(6, '0');
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
  const doneBtn = field.querySelector('.guests-done');

  const LIMITS = { adults: [1, 8], children: [0, 6], rooms: [1, 4] };
  const state = { adults: 2, children: 0, rooms: 1 };
  const rows = {};

  field.querySelectorAll('.stepper').forEach((stepperEl) => {
    const type = stepperEl.getAttribute('data-type');
    if (!LIMITS[type]) return;
    rows[type] = {
      minus: stepperEl.querySelector('[data-step="-"]'),
      plus: stepperEl.querySelector('[data-step="+"]'),
      countEl: stepperEl.querySelector('b'),
    };
  });

  function occupancySummary() {
    return { adults: state.adults, children: state.children, rooms: state.rooms, guests: state.adults + state.children };
  }

  function wordFor(type, n) {
    const singular = { adults: 'search.adultWord', children: 'search.childWord', rooms: 'search.roomWord' }[type];
    const plural = { adults: 'search.adultsWord', children: 'search.childrenWord', rooms: 'search.roomsWord' }[type];
    const fallback = { adults: ['adult', 'adults'], children: ['child', 'children'], rooms: ['room', 'rooms'] }[type];
    return n === 1 ? t(singular, fallback[0]) : t(plural, fallback[1]);
  }

  function render(notify) {
    Object.keys(rows).forEach((type) => {
      const [min, max] = LIMITS[type];
      rows[type].countEl.textContent = state[type];
      rows[type].minus.disabled = state[type] <= min;
      rows[type].plus.disabled = state[type] >= max;
    });
    toggle.textContent = ['adults', 'children', 'rooms']
      .filter((type) => rows[type])
      .map((type) => `${state[type]} ${wordFor(type, state[type])}`)
      .join(' · ');
    if (notify && onChange) onChange(occupancySummary());
  }

  Object.keys(rows).forEach((type) => {
    const [min, max] = LIMITS[type];
    rows[type].minus.addEventListener('click', (e) => { e.stopPropagation(); if (state[type] > min) { state[type]--; render(true); } });
    rows[type].plus.addEventListener('click', (e) => { e.stopPropagation(); if (state[type] < max) { state[type]++; render(true); } });
  });
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
  document.addEventListener('i18n:ready', () => render(false));

  return {
    get: occupancySummary,
    set: (partial) => {
      if (partial && typeof partial === 'object') Object.assign(state, partial);
      Object.keys(LIMITS).forEach((type) => {
        const [min, max] = LIMITS[type];
        state[type] = Math.min(max, Math.max(min, parseInt(state[type], 10) || min));
      });
      render(true);
    },
  };
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
  const occupancyCtrl = initGuestsDropdown(widget);

  widget.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn.value) params.set('checkin', checkIn.value);
    if (checkOut.value) params.set('checkout', checkOut.value);
    const occ = occupancyCtrl.get();
    params.set('adults', occ.adults);
    params.set('children', occ.children);
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
  if (params.get('adults') || params.get('children')) {
    guestsCtrl.set({
      adults: parseInt(params.get('adults'), 10) || 2,
      children: parseInt(params.get('children'), 10) || 0,
    });
  } else if (params.get('guests')) {
    // legacy links from before the adults/children picker existed
    guestsCtrl.set({ adults: parseInt(params.get('guests'), 10) || 2 });
  }
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
    return { checkIn: ci, checkOut: co, nights, ...guestsCtrl.get() };
  }

  /* ---------- Several room types can be picked at once: each row has its own
     quantity selector, and clicking ANY row's "I'll Reserve" reads every
     row's selector and books the whole set in one go — no separate cart step. ---------- */
  function lineTotalFor(entry, stay) {
    const nights = stay.nights || 0;
    return (nights > 0 ? entry.room.price * nights : entry.room.price) * entry.qty;
  }

  function collectSelectedRooms(forceRoomId) {
    const items = [];
    roomListEl.querySelectorAll('.rl-row').forEach((row) => {
      const roomId = row.id.replace('room-', '');
      const room = HOTEL_ROOMS.find((r) => r.id === roomId);
      if (!room) return;
      const select = row.querySelector('.rl-qty');
      if (select.disabled) return; // too small for the current party size
      let qty = parseInt(select.value, 10) || 0;
      if (roomId === forceRoomId && qty === 0) qty = 1;
      if (qty > 0) items.push({ room, qty });
    });
    return items;
  }

  function guestIconsHtml(maxGuests) {
    const person = '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>';
    const shown = Math.min(maxGuests, 2);
    let html = '<span class="rl-guest-icons">' + person.repeat(shown) + '</span>';
    if (maxGuests > shown) html += `<span class="rl-guest-extra">&times;${maxGuests}</span>`;
    return html;
  }

  function renderRooms() {
    const stay = currentStay();
    roomListEl.innerHTML = '';
    const reservePanel = document.querySelector('.rl-reserve-all');

    if (!stay.checkIn || !stay.checkOut) {
      roomListEl.innerHTML = `
        <div class="rl-empty">
          <p data-i18n="book.chooseDatesPrompt">Choose your check-in and check-out dates above to see available rooms and prices.</p>
        </div>
      `;
      if (reservePanel) reservePanel.style.display = 'none';
      return;
    }
    if (reservePanel) reservePanel.style.display = '';

    const table = document.createElement('div');
    table.className = 'rl-table';
    table.innerHTML = `
      <div class="rl-header rl-cols">
        <div data-i18n="book.roomType">Room type</div>
        <div data-i18n="book.numberOfGuests">Guests</div>
        <div data-i18n="book.todaysPrice">Today&rsquo;s price</div>
        <div data-i18n="book.yourChoices">Your choices</div>
        <div data-i18n="book.selectRoomsCol">Select rooms</div>
      </div>
    `;

    HOTEL_ROOMS.forEach((room) => {
      // A room type is only truly unbookable if even the max quantity (4)
      // of it can't sleep the party — e.g. 2 people CAN pick 2 Single Rooms
      // (1 guest each), so a lone Single Room isn't disabled just because it
      // doesn't fit everyone by itself. The real per-selection capacity
      // check happens once, across every room type together, at Reserve time.
      const tooSmall = room.maxGuests * 4 < stay.guests;
      const totalForRoom = (stay.nights > 0 ? room.price * stay.nights : room.price);
      const nightsLabel = stay.nights > 0
        ? t('book.' + (stay.nights > 1 ? 'nightsTotalMany' : 'nightsTotalOne'), `${stay.nights} night${stay.nights > 1 ? 's' : ''} total`).replace('{n}', stay.nights)
        : '';
      const reviewText = `${room.rating.toFixed(1)} · ${room.reviews} ${t('common.reviewsWord', 'reviews')}`;
      const tags = room.perks.map((perk) => `<span>${perk}</span>`).join('');
      const roomName = t('room.' + room.id + '.name', room.label);
      const roomSmall = room.small ? t('room.' + room.id + '.small', room.small) : '';
      const roomDesc = t('room.' + room.id + '.desc', room.nights_label + ' · ' + room.desc);
      const tooSmallNote = t('book.tooSmall', 'Sleeps up to {max} — too small for {guests} guests')
        .replace('{max}', room.maxGuests * 4).replace('{guests}', stay.guests);

      const qtyOptions = [0, 1, 2, 3, 4].map((n) => `<option value="${n}">${n}</option>`).join('');

      const row = document.createElement('div');
      row.className = 'rl-row rl-cols' + (tooSmall ? ' dimmed' : '');
      row.id = 'room-' + room.id;
      row.innerHTML = `
        <div class="rl-col-room">
          <div class="rl-thumb"><img src="${room.img}" alt="${roomName} at Hotel 261" loading="lazy"></div>
          <div class="rl-info">
            <div class="rl-badge">${room.badge}</div>
            <h3>${roomName}${roomSmall ? ` <small>${roomSmall}</small>` : ''}</h3>
            <p class="rl-meta">${roomDesc} &middot; ${reviewText}</p>
            <div class="rl-tags">${tags}</div>
          </div>
        </div>
        <div class="rl-col-guests" data-label="${t('book.numberOfGuests', 'Guests')}">${guestIconsHtml(room.maxGuests)}</div>
        <div class="rl-col-price" data-label="${t('book.todaysPrice', "Today's price")}">
          <b class="rl-amount">£${room.price.toLocaleString('en-GB')}</b>
          <span class="rl-per">${t('book.perNightPhrase', 'per night')}</span>
          ${nightsLabel ? `<span class="rl-total-note">£${totalForRoom.toLocaleString('en-GB')} &middot; ${nightsLabel}</span>` : ''}
        </div>
        <div class="rl-col-choices" data-label="${t('book.yourChoices', 'Your choices')}">
          ${tooSmall
            ? `<p class="rl-note">${tooSmallNote}</p>`
            : `<span class="summary-badge"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg> <span>${t('book.freeCancellation', 'Free cancellation')}</span></span>
               <p class="rl-choice-note"><svg class="icon" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/><path d="M9 12l2 2 4-4"/></svg> ${t('book.payOnlineNote', 'Pay online — secure via Stripe')}</p>`}
        </div>
        <div class="rl-col-select" data-label="${t('book.selectRoomsCol', 'Select rooms')}">
          <select class="rl-qty" ${tooSmall ? 'disabled' : ''}>${qtyOptions}</select>
        </div>
      `;

      table.appendChild(row);
    });

    roomListEl.appendChild(table);
  }

  renderRooms();
  document.addEventListener('i18n:ready', renderRooms);

  /* ---------- One "I'll Reserve" for the whole table: pick quantities across
     as many room types as you like, then this reads every row at once. ---------- */
  const reserveAllBtn = document.getElementById('reserveAllBtn');
  const reserveAllError = document.getElementById('reserveAllError');
  reserveAllBtn.addEventListener('click', () => {
    reserveAllError.textContent = '';
    reserveAllError.classList.remove('visible');
    const stay = currentStay();
    if (!stay.checkIn || !stay.checkOut) {
      alert('Please choose your check-in and check-out dates above.');
      return;
    }
    const items = collectSelectedRooms();
    if (items.length === 0) {
      reserveAllError.textContent = t('book.errNoRoomsSelected', 'Please choose how many of at least one room type you need.');
      reserveAllError.classList.add('visible');
      return;
    }
    const totalCapacity = items.reduce((sum, item) => sum + item.room.maxGuests * item.qty, 0);
    if (totalCapacity < stay.guests) {
      reserveAllError.textContent = t('book.errCapacity', 'Your selected rooms sleep up to {max} — please select more space for {guests} guests.')
        .replace('{max}', totalCapacity).replace('{guests}', stay.guests);
      reserveAllError.classList.add('visible');
      return;
    }
    openCheckout(items, stay);
  });

  /* ---------- Checkout: room -> your details -> payment ---------- */
  const roomsSection = document.getElementById('roomsSection');
  const checkoutSection = document.getElementById('checkoutSection');
  const detailsPanel = document.getElementById('checkoutDetailsPanel');
  const paymentPanel = document.getElementById('checkoutPaymentPanel');
  const stepDetails = document.querySelector('.checkout-step[data-step="details"]');
  const stepPayment = document.querySelector('.checkout-step[data-step="payment"]');

  const coFirstName = document.getElementById('coFirstName');
  const coLastName = document.getElementById('coLastName');
  const coEmail = document.getElementById('coEmail');
  const coPhone = document.getElementById('coPhone');
  const coAddress = document.getElementById('coAddress');
  const coCity = document.getElementById('coCity');
  const coPostcode = document.getElementById('coPostcode');
  const coCountry = document.getElementById('coCountry');
  const coRequests = document.getElementById('coRequests');
  const coArrivalTime = document.getElementById('coArrivalTime');
  const coMainGuestNameRow = document.getElementById('coMainGuestNameRow');
  const coMainGuestName = document.getElementById('coMainGuestName');
  const coDetailsError = document.getElementById('coDetailsError');
  const coPaymentError = document.getElementById('coPaymentError');
  const coContinueBtn = document.getElementById('coContinueBtn');
  const coPayBtn = document.getElementById('coPayBtn');
  const coPayLabel = document.getElementById('coPayLabel');
  const coPayAmount = document.getElementById('coPayAmount');

  let activeCart = null;
  let activeStay = null;

  function setError(box, msg) {
    box.textContent = msg;
    box.classList.toggle('visible', !!msg);
  }

  function setFieldError(input, msg) {
    const errorEl = document.getElementById(input.id + 'Error');
    input.classList.toggle('invalid', !!msg);
    if (errorEl) {
      errorEl.textContent = msg || '';
      errorEl.style.display = msg ? 'block' : 'none';
    }
  }
  [coFirstName, coLastName, coEmail, coPhone, coAddress, coCity, coMainGuestName].forEach((input) => {
    input.addEventListener('input', () => setFieldError(input, ''));
  });

  document.querySelectorAll('input[name="coBookingFor"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const someoneElse = document.querySelector('input[name="coBookingFor"]:checked').value === 'someone_else';
      coMainGuestNameRow.style.display = someoneElse ? 'block' : 'none';
      if (!someoneElse) { coMainGuestName.value = ''; setFieldError(coMainGuestName, ''); }
    });
  });

  function occupancyText(stay) {
    const adultWord = stay.adults === 1 ? t('search.adultWord', 'adult') : t('search.adultsWord', 'adults');
    let text = `${stay.adults} ${adultWord}`;
    if (stay.children > 0) {
      const childWord = stay.children === 1 ? t('search.childWord', 'child') : t('search.childrenWord', 'children');
      text += `, ${stay.children} ${childWord}`;
    }
    return text;
  }

  function fillSummary(cartItems, stay) {
    const nights = stay.nights || 0;
    let totalPrice = 0;
    let totalRooms = 0;
    const itemsEl = document.getElementById('csItems');
    itemsEl.innerHTML = cartItems.map((entry) => {
      const lineTotal = lineTotalFor(entry, stay);
      totalPrice += lineTotal;
      totalRooms += entry.qty;
      const roomName = t('room.' + entry.room.id + '.name', entry.room.label);
      const roomWord = entry.qty === 1 ? t('search.roomWord', 'room') : t('search.roomsWord', 'rooms');
      return `
        <div class="summary-item">
          <div class="summary-item-thumb"><img src="${entry.room.img}" alt="${roomName}"></div>
          <div class="summary-item-info"><b>${roomName}</b><span>${entry.qty} ${roomWord}</span></div>
          <div class="summary-item-price">£${lineTotal.toLocaleString('en-GB')}</div>
        </div>
      `;
    }).join('');

    document.getElementById('csCheckIn').textContent = fmtDateShort(stay.checkIn);
    document.getElementById('csCheckOut').textContent = fmtDateShort(stay.checkOut);
    document.getElementById('csNights').textContent = nights || '—';
    document.getElementById('csGuests').textContent = occupancyText(stay);
    document.getElementById('csRooms').textContent = totalRooms + ' ' + (totalRooms === 1 ? t('search.roomWord', 'room') : t('search.roomsWord', 'rooms'));
    document.getElementById('csTotal').textContent = '£' + totalPrice.toLocaleString('en-GB');
    coPayAmount.textContent = '£' + totalPrice.toLocaleString('en-GB');
  }

  function openCheckout(cartItems, stay) {
    if (!stay.checkIn || !stay.checkOut) {
      alert('Please choose your check-in and check-out dates above.');
      return;
    }
    activeCart = cartItems;
    activeStay = stay;
    fillSummary(cartItems, stay);
    setError(coDetailsError, '');
    setError(coPaymentError, '');
    showDetailsStep();
    roomsSection.style.display = 'none';
    checkoutSection.style.display = 'block';
    checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => coFirstName.focus(), 300);
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
    const firstName = coFirstName.value.trim();
    const lastName = coLastName.value.trim();
    const email = coEmail.value.trim();
    const phone = coPhone.value.trim();
    const address = coAddress.value.trim();
    const city = coCity.value.trim();
    const bookingForSomeoneElse = document.querySelector('input[name="coBookingFor"]:checked').value === 'someone_else';
    const mainGuestName = coMainGuestName.value.trim();

    [coFirstName, coLastName, coEmail, coPhone, coAddress, coCity, coMainGuestName].forEach((input) => setFieldError(input, ''));

    let firstInvalid = null;
    if (!firstName) { setFieldError(coFirstName, t('book.errFirstName', 'Please enter your first name.')); firstInvalid = firstInvalid || coFirstName; }
    if (!lastName) { setFieldError(coLastName, t('book.errLastName', 'Please enter your last name.')); firstInvalid = firstInvalid || coLastName; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError(coEmail, t('book.errEmail', 'Please enter a valid email address.')); firstInvalid = firstInvalid || coEmail; }
    if (!phone) { setFieldError(coPhone, t('book.errPhone', 'Please enter a phone number, in case we need to reach you.')); firstInvalid = firstInvalid || coPhone; }
    if (!address) { setFieldError(coAddress, t('book.errAddress', 'Please enter your address.')); firstInvalid = firstInvalid || coAddress; }
    if (!city) { setFieldError(coCity, t('book.errCity', 'Please enter your city.')); firstInvalid = firstInvalid || coCity; }
    if (bookingForSomeoneElse && !mainGuestName) { setFieldError(coMainGuestName, t('book.errMainGuestName', "Please enter the main guest's name.")); firstInvalid = firstInvalid || coMainGuestName; }

    if (firstInvalid) { firstInvalid.focus(); return; }
    showPaymentStep();
  });

  coPayBtn.addEventListener('click', () => {
    setError(coPaymentError, '');
    if (!activeCart || !activeCart.length || !activeStay) return;

    const name = (coFirstName.value.trim() + ' ' + coLastName.value.trim()).trim();
    const email = coEmail.value.trim();
    const phone = coPhone.value.trim();
    const specialRequests = coRequests.value.trim();
    const address = coAddress.value.trim();
    const city = coCity.value.trim();
    const postcode = coPostcode.value.trim();
    const country = coCountry.value;
    const arrivalTime = coArrivalTime.value;
    const bookingFor = document.querySelector('input[name="coBookingFor"]:checked').value;
    const mainGuestName = bookingFor === 'someone_else' ? coMainGuestName.value.trim() : '';
    const travelPurpose = document.querySelector('input[name="coTravelPurpose"]:checked').value;

    coPayBtn.disabled = true;
    coPayLabel.textContent = 'Redirecting…';
    coPayAmount.style.display = 'none';

    fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: activeCart.map((entry) => ({ roomType: entry.room.id, quantity: entry.qty })),
        checkIn: activeStay.checkIn, checkOut: activeStay.checkOut,
        guests: activeStay.guests, adults: activeStay.adults, children: activeStay.children,
        name, email, phone, specialRequests,
        address, city, postcode, country, arrivalTime, bookingFor, mainGuestName, travelPurpose,
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
      const room = HOTEL_ROOMS.find((r) => r.id === preselectRoom);
      const el = document.getElementById('room-' + preselectRoom);
      if (room && el) {
        const stay = currentStay();
        const items = collectSelectedRooms(room.id);
        const totalCapacity = items.reduce((sum, item) => sum + item.room.maxGuests * item.qty, 0);
        if (stay.checkIn && stay.checkOut && totalCapacity >= stay.guests) {
          openCheckout(items, stay);
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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
      document.getElementById('rRef').textContent = formatBookingRef(data.bookingRef);
      document.getElementById('rRoom').textContent = data.roomLabel || '—';
      document.getElementById('rCheckIn').textContent = fmtDateShort(data.checkIn);
      document.getElementById('rCheckOut').textContent = fmtDateShort(data.checkOut);
      document.getElementById('rNights').textContent = data.nights || '—';
      document.getElementById('rGuests').textContent = data.guests || '—';
      document.getElementById('rRooms').textContent = data.rooms || '1';
      const amount = (data.amountTotal / 100).toLocaleString('en-GB', { style: 'currency', currency: (data.currency || 'gbp').toUpperCase() });
      document.getElementById('rTotal').textContent = amount;
      show(paidBox);
    })
    .catch(() => {
      errorMsg.textContent = 'We couldn’t reach the server to confirm this booking.';
      show(errorBox);
    });
})();

/* ---------- Check Booking page ---------- */
(function () {
  const form = document.getElementById('findBookingForm');
  const resultBox = document.getElementById('fbResult');
  if (!form || !resultBox) return;

  const emailInput = document.getElementById('fbEmail');
  const refInput = document.getElementById('fbRef');
  const errorBox = document.getElementById('fbError');
  const submitBtn = document.getElementById('fbSubmit');

  const STATUS_LABELS = {
    pending: t('checkBooking.statusPending', 'Payment pending'),
    confirmed: t('checkBooking.statusConfirmed', 'Confirmed'),
    cancelled: t('checkBooking.statusCancelled', 'Cancelled'),
  };

  function setError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.toggle('visible', !!msg);
  }

  submitBtn.addEventListener('click', () => {
    setError('');
    resultBox.style.display = 'none';

    const email = emailInput.value.trim();
    const reference = refInput.value.trim();
    if (!email) { setError('Please enter the email address you booked with.'); emailInput.focus(); return; }
    if (!reference) { setError('Please enter your booking reference.'); refInput.focus(); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Searching…';

    fetch('/api/find-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, reference }),
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error((data && data.error) || 'We couldn’t find that booking.');

        document.getElementById('frRef').textContent = formatBookingRef(data.bookingRef);
        document.getElementById('frStatus').textContent = STATUS_LABELS[data.status] || data.status;
        document.getElementById('frRoom').textContent = data.roomLabel || '—';
        document.getElementById('frCheckIn').textContent = fmtDateShort(data.checkIn);
        document.getElementById('frCheckOut').textContent = fmtDateShort(data.checkOut);
        document.getElementById('frGuests').textContent = data.guests || '—';
        document.getElementById('frRooms').textContent = data.rooms || '1';
        document.getElementById('frTotal').textContent = '£' + Number(data.totalAmount).toLocaleString('en-GB');
        resultBox.style.display = 'block';
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      })
      .catch(err => setError(err.message))
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Find My Booking';
      });
  });
})();
