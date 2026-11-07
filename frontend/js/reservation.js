(() => {
  const form = document.getElementById('reservationForm');
  if (!form) return;
  const ci = form.elements.checkin, co = form.elements.checkout;
  const adults = form.elements.adults, children = form.elements.children, rooms = form.elements.rooms;
  const preference = form.elements.room;
  const promo = form.elements.promocode;
  const error = document.getElementById('reservationError');
  const roomTypes = {
    single: { rate: 1054578, capacity: 1, label: 'Single Room' },
    double12: { rate: 1054572, capacity: 2, label: 'Small Double' },
    double: { rate: 1054557, capacity: 2, label: 'Large Double' },
    twin: { rate: 1065892, capacity: 2, label: 'Twin Room' },
    triple: { rate: 1065893, capacity: 3, label: 'Triple Room' },
    quad: { rate: 1065894, capacity: 4, label: 'Quad Room' },
    family: { rate: 1065895, capacity: 4, label: 'Family Room' },
  };
  const londonToday = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const iso = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  const nextDay = value => new Date(Date.parse(value) + 86400000).toISOString().slice(0,10);
  const nights = () => iso(ci.value) && iso(co.value) ? Math.round((Date.parse(co.value)-Date.parse(ci.value))/86400000) : 0;
  const pretty = value => iso(value) ? new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value)) : 'Choose a date';
  const params = new URLSearchParams(location.search);
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem('hotel261-stay') || '{}'); } catch {}
  for (const field of [ci, co, adults, children, rooms, preference, promo]) {
    const value = params.get(field.name) ?? saved[field.name];
    if (value !== undefined && value !== null) field.value = String(value);
  }
  if (!params.has('adults') && params.has('guests')) adults.value = params.get('guests');
  ci.min = londonToday;
  if (!iso(ci.value) || ci.value < londonToday) { ci.value = ''; co.value = ''; }
  if (!iso(co.value) || co.value <= ci.value) co.value = '';
  for (const input of [adults, children, rooms]) {
    if (!input.checkValidity()) input.value = input === adults ? 2 : input === rooms ? 1 : 0;
  }
  function render() {
    co.min = ci.value ? nextDay(ci.value) : nextDay(londonToday);
    const multi = Number(rooms.value) > 1;
    preference.disabled = multi;
    document.getElementById('roomPreferenceNote').textContent = multi ? 'Choose room types separately in the booking engine for a multiple-room stay.' : 'Subject to availability. Your room and rate are confirmed in the next step.';
    try { sessionStorage.setItem('hotel261-stay', JSON.stringify(Object.fromEntries([ci,co,adults,children,rooms,preference,promo].map(e=>[e.name,e.value])))); } catch {}
  }
  ci.addEventListener('change', () => { if (ci.value && (!co.value || co.value <= ci.value)) co.value = nextDay(ci.value); render(); });
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  function fail(message, field) { error.textContent = message; error.hidden = false; field.setAttribute('aria-invalid','true'); field.focus(); }
  form.addEventListener('submit', event => {
    event.preventDefault(); error.hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach(e=>e.removeAttribute('aria-invalid'));
    if (!ci.value || ci.value < londonToday) return fail('Choose a check-in date today or later.',ci);
    if (!co.value || nights() < 1) return fail('Choose a check-out date after check-in.',co);
    for (const input of [adults, children, rooms]) if (!input.checkValidity()) return fail(`Enter a whole number from ${input.min} to ${input.max} for ${input.name}.`,input);
    const a = Number(adults.value), c = Number(children.value), r = Number(rooms.value);
    if (a < r) return fail('Each room needs at least one adult. Add adults or reduce the number of rooms.',adults);
    if (a+c > r*4) return fail('Our largest rooms sleep four. Add rooms or contact reception for help arranging your stay.',rooms);
    const type = r === 1 ? roomTypes[preference.value] : null;
    if (type && a+c > type.capacity) return fail(`The ${type.label} sleeps up to ${type.capacity}. Choose a larger room or show all room types.`,preference);
    const url = new URL('https://direct-book.com/properties/hotel261');
    url.searchParams.set('locale', document.documentElement.lang || 'en');
    url.searchParams.set('currency','GBP');url.searchParams.set('checkInDate',ci.value);url.searchParams.set('checkOutDate',co.value);url.searchParams.set('trackPage','no');
    let aLeft = a, cLeft = c;
    for (let i=0;i<r;i++) {
      const count = r-i, assignedAdults = Math.ceil(aLeft/count), assignedChildren = Math.min(4-assignedAdults, Math.ceil(cLeft/count));
      url.searchParams.set(`items[${i}][adults]`,assignedAdults);url.searchParams.set(`items[${i}][children]`,assignedChildren);url.searchParams.set(`items[${i}][infants]`,0);
      aLeft-=assignedAdults;cLeft-=assignedChildren;
    }
    if(type)url.searchParams.set('items[0][rateId]',type.rate);
    if(promo.value.trim()) url.searchParams.set('promocode',promo.value.trim());
    location.assign(url.toString());
  });
  const promoStatus = document.getElementById('promoCopyStatus');
  function applyPromo() {
    promo.value = promo.value.trim();
    render();
    promoStatus.textContent = promo.value ? `✓ ${promo.value} applied` : 'Enter a promo code first';
  }
  document.getElementById('useReservePromo').addEventListener('click', applyPromo);
  document.getElementById('reserveDirectOffer').addEventListener('click', () => {
    promo.value = 'BOOKDIRECT15';
    document.getElementById('reservePromoOffers').open = false;
    applyPromo();
  });
  promo.addEventListener('input', () => { promoStatus.textContent = promo.value.trim() ? 'Select Apply to add this code' : ''; });
  if (promo.value.trim()) applyPromo();

  render();
})();
