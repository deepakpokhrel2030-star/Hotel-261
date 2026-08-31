/* ---------- Book Direct form (book.html) ---------- */
(function () {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  const roomSelect = document.getElementById('roomType');
  const checkInInput = document.getElementById('checkIn');
  const checkOutInput = document.getElementById('checkOut');
  const guestsInput = document.getElementById('guests');
  const errorBox = document.getElementById('formError');
  const submitBtn = document.getElementById('submitBtn');

  const sumRoom = document.getElementById('sumRoom');
  const sumCheckIn = document.getElementById('sumCheckIn');
  const sumCheckOut = document.getElementById('sumCheckOut');
  const sumNights = document.getElementById('sumNights');
  const sumGuests = document.getElementById('sumGuests');
  const sumTotal = document.getElementById('sumTotal');

  const todayStr = new Date().toISOString().slice(0, 10);
  checkInInput.min = todayStr;

  function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function nightsBetween(a, b) {
    if (!a || !b) return 0;
    const ms = new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime();
    return Math.round(ms / 86400000);
  }

  function updateSummary() {
    const opt = roomSelect.selectedOptions[0];
    const price = opt && opt.dataset.price ? parseFloat(opt.dataset.price) : null;
    const maxGuests = opt && opt.dataset.max ? parseInt(opt.dataset.max, 10) : null;

    if (maxGuests) guestsInput.max = maxGuests;

    sumRoom.textContent = opt && opt.value ? opt.textContent.split(' — ')[0] : '—';
    sumCheckIn.textContent = fmtDate(checkInInput.value);
    sumCheckOut.textContent = fmtDate(checkOutInput.value);

    const nights = nightsBetween(checkInInput.value, checkOutInput.value);
    sumNights.textContent = nights > 0 ? nights + (nights === 1 ? ' night' : ' nights') : '—';
    sumGuests.textContent = guestsInput.value || '—';

    if (price && nights > 0) {
      sumTotal.textContent = '£' + (price * nights).toLocaleString('en-GB');
    } else {
      sumTotal.textContent = '£0';
    }
  }

  roomSelect.addEventListener('change', updateSummary);
  guestsInput.addEventListener('input', updateSummary);
  checkInInput.addEventListener('change', () => {
    if (checkInInput.value) {
      const next = new Date(checkInInput.value + 'T00:00:00');
      if (!isNaN(next.getTime())) {
        next.setDate(next.getDate() + 1);
        const nextStr = next.toISOString().slice(0, 10);
        checkOutInput.min = nextStr;
        if (!checkOutInput.value || checkOutInput.value <= checkInInput.value) {
          checkOutInput.value = nextStr;
        }
      }
    }
    updateSummary();
  });
  checkOutInput.addEventListener('change', updateSummary);

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.add('visible');
  }
  function clearError() {
    errorBox.textContent = '';
    errorBox.classList.remove('visible');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const roomType = roomSelect.value;
    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;
    const guests = guestsInput.value;
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!roomType) return showError('Please choose a room type.');
    if (!checkIn || !checkOut) return showError('Please choose your check-in and check-out dates.');
    if (checkOut <= checkIn) return showError('Check-out must be after check-in.');
    if (!fullName) return showError('Please enter your full name.');
    if (!email) return showError('Please enter your email address.');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Redirecting to payment…';

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomType, checkIn, checkOut, guests, name: fullName, email }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      window.location.href = data.url;
    } catch (err) {
      showError(err.message || 'Something went wrong. Please try again or call 020 8743 4411.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Continue to Secure Payment';
    }
  });

  const params = new URLSearchParams(window.location.search);
  const preselectRoom = params.get('room');
  if (preselectRoom && roomSelect.querySelector(`option[value="${preselectRoom}"]`)) {
    roomSelect.value = preselectRoom;
  }

  updateSummary();

  if (params.get('cancelled')) {
    showError('Your payment was cancelled — no charge was made. Feel free to try again.');
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

  function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
      document.getElementById('rCheckIn').textContent = fmtDate(data.checkIn);
      document.getElementById('rCheckOut').textContent = fmtDate(data.checkOut);
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
