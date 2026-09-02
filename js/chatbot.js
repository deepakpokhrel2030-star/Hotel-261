(function () {
  var PHONE = '020 8743 4411';

  // Every answer here is sourced from the site's own content (rooms, FAQ,
  // location pages) — nothing is invented. Keep this in sync if those facts change.
  var KB = [
    {
      keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
      answer: 'Hello! I can help with room prices, check-in times, parking, breakfast, and how to book. What would you like to know?'
    },
    {
      keywords: ['room', 'rooms', 'price', 'prices', 'cost', 'rate', 'rates', 'how much', 'cheapest'],
      answer: 'We have 7 room types, from £54&ndash;£120 a night: Single (£54, sleeps 1), Twin (£75, sleeps 2), Double Room 1&ndash;2 Adults (£75, sleeps 2), Double (£80, sleeps 2), Triple (£95, sleeps 3), Quadruple (£120, sleeps 4) and Family (£120, sleeps up to 4). See full details on our <a href="/rooms">Rooms &amp; Rates</a> page.'
    },
    {
      keywords: ['single room', 'single'],
      answer: 'Single Room &mdash; £54/night, sleeps 1. Ensuite bathroom, free WiFi, flat-screen TV and tea &amp; coffee facilities.'
    },
    {
      keywords: ['twin room', 'twin'],
      answer: 'Twin Room &mdash; £75/night, sleeps 2 in two single beds. A favourite with friends travelling together.'
    },
    {
      keywords: ['double room', 'double'],
      answer: 'We have two double options: Double Room (1&ndash;2 Adults) at £75/night, and our classic Double Room at £80/night &mdash; both sleep 2.'
    },
    {
      keywords: ['triple'],
      answer: 'Triple Room &mdash; £95/night, sleeps 3.'
    },
    {
      keywords: ['quad', 'quadruple'],
      answer: 'Quadruple Room &mdash; £120/night, sleeps 4.'
    },
    {
      keywords: ['family room', 'family', 'four', '4 people', 'kids', 'children', 'child'],
      answer: 'Family Room &mdash; £120/night, sleeps up to 4 (two single beds and one double) &mdash; ideal for families or small groups. Children are very welcome; for anything specific like a cot, it\'s best to call reception on <a href="tel:+442087434411">' + PHONE + '</a> to check what we can arrange.'
    },
    {
      keywords: ['group', 'multiple rooms', 'several rooms', 'more than one room', 'block booking'],
      answer: 'Yes &mdash; on our <a href="/book">Book</a> page you can select more than one room, including several of the same type, to cover a larger party. For 10 or more rooms, please call us on <a href="tel:+442087434411">' + PHONE + '</a> so we can help directly.'
    },
    {
      keywords: ['check-in', 'check in', 'checkin', 'check-out', 'check out', 'checkout', 'arrival time', 'what time', 'late arrival', 'early arrival'],
      answer: 'Check-in is from 14:00&ndash;23:30, and check-out is 08:00&ndash;11:00. Please arrive by 23:30 as the hotel is closed overnight. Early check-in can\'t be guaranteed, but we\'ll accommodate you if your room is ready.'
    },
    {
      keywords: ['reception hours', 'front desk', 'opening hours', 'open 24', '24 hour', '24/7', 'reception open'],
      answer: 'Reception is staffed 8am&ndash;11:30pm daily. It\'s not a 24-hour desk, which is also why check-in has to happen by 23:30 &mdash; the hotel is closed overnight.'
    },
    {
      keywords: ['id', 'identification', 'deposit', 'passport', 'photo id', 'identity'],
      answer: 'A government-issued photo ID is required at check-in (digital or scanned IDs aren\'t accepted). A £20 cash or ID deposit is required for room keys.'
    },
    {
      keywords: ['breakfast', 'food', 'eat', 'restaurant', 'dinner', 'lunch'],
      answer: 'Full English or Italian breakfast is served 08:00&ndash;11:30 at Little Napoli, a 5-minute walk away. Ask reception for a voucher &mdash; you\'ll also get 15% off all other meals there.'
    },
    {
      keywords: ['parking', 'park', 'car', 'car park', 'garage'],
      answer: 'Limited on-site parking is available for £15/day, from 14:00 on arrival to 11:00 on departure. Contact us ahead to reserve a space, as availability is limited.'
    },
    {
      keywords: ['pay', 'payment', 'card', 'credit card', 'debit card', 'cash'],
      answer: 'Cash is accepted on site. Online bookings can be paid in advance or on arrival, depending on the rate you choose &mdash; and our online checkout is secured by Stripe, so we never see or store your card details.'
    },
    {
      keywords: ['pet', 'pets', 'dog', 'cat', 'animal'],
      answer: 'Sorry, pets aren\'t permitted at Hotel 261.'
    },
    {
      keywords: ['smoke', 'smoking', 'cigarette', 'vape', 'vaping'],
      answer: 'We\'re a smoke-free hotel &mdash; that includes vaping too. There\'s a designated outdoor smoking area away from the entrance.'
    },
    {
      keywords: ['luggage', 'bag', 'bags', 'suitcase'],
      answer: 'Luggage can be stored on your arrival or departure day (departure-day storage is same-day only).'
    },
    {
      keywords: ['bike', 'bicycle', 'bicycles'],
      answer: 'Bicycles aren\'t permitted inside the hotel, but they can be chained outside by the car park at your own risk.'
    },
    {
      keywords: ['wifi', 'wi-fi', 'internet', 'internet access'],
      answer: 'Free WiFi is available throughout the hotel and in every room.'
    },
    {
      keywords: ['fridge', 'minibar', 'mini bar', 'kettle', 'tea', 'coffee', 'microwave'],
      answer: 'Every room has a fridge and tea &amp; coffee making facilities, plus there\'s a shared guest microwave available too.'
    },
    {
      keywords: ['housekeeping', 'clean', 'cleaning', 'towels', 'fresh towels'],
      answer: 'Daily housekeeping keeps rooms fresh throughout your stay.'
    },
    {
      keywords: ['star', 'stars', 'star rating', 'how big', 'how many rooms'],
      answer: 'We\'re a family-run 2-star hotel with 7 different room types, from Single up to Family rooms.'
    },
    {
      keywords: ['solo', 'travelling alone', 'traveling alone', 'one person', 'by myself'],
      answer: 'We\'re popular with solo travellers &mdash; the hotel is quiet and comfortable, and our Single Room (£54/night) is built exactly for that.'
    },
    {
      keywords: ['quiet', 'noise', 'noisy'],
      answer: 'Guests consistently tell us the hotel is quiet and comfortable &mdash; it\'s one of the things solo travellers rate us highly for.'
    },
    {
      keywords: ['nearby', 'attractions', 'things to do', 'westfield', 'wembley', 'apollo', 'qpr', 'shopping', 'bars', 'restaurants', 'stadium', 'gig', 'concert'],
      answer: 'Westfield London shopping centre is about a mile away, and we\'re well placed for Queens Park Rangers\' stadium (10&ndash;14 minutes on foot), the Hammersmith Apollo, and Wembley &mdash; plus a handful of local bars and caf&eacute;s nearby.'
    },
    {
      keywords: ['availability', 'available', 'vacancy', 'vacant', 'free room', 'sold out', 'dates'],
      answer: 'The best way to check availability is on our <a href="/book">Book</a> page &mdash; enter your dates and number of guests and we\'ll show you what fits.'
    },
    {
      keywords: ['cancel', 'cancellation', 'refund', 'change my booking'],
      answer: 'To change or cancel a booking, please call us on <a href="tel:+442087434411">' + PHONE + '</a> and we\'ll sort it out with you directly.'
    },
    {
      keywords: ['book', 'booking', 'reserve', 'reservation'],
      answer: 'You can book directly on our <a href="/book">Book</a> page &mdash; choose your dates and rooms, then pay securely online. Or call us on <a href="tel:+442087434411">' + PHONE + '</a> to book by phone.'
    },
    {
      keywords: ['where', 'location', 'address', 'directions', 'find you'],
      answer: 'We\'re at 261&ndash;263 Uxbridge Road, Shepherd\'s Bush, London W12 9DS &mdash; a short walk from Westfield London, and about 15 minutes on foot from Shepherd\'s Bush Market Underground station. See the <a href="/location">Location</a> page for a map.'
    },
    {
      keywords: ['tube', 'underground', 'station', 'train', 'transport'],
      answer: 'Shepherd\'s Bush Market Underground station (Circle &amp; Hammersmith &amp; City lines) is about a 15-minute walk from the hotel.'
    },
    {
      keywords: ['phone', 'call', 'contact', 'number'],
      answer: 'You can reach us on <a href="tel:+442087434411">' + PHONE + '</a>.'
    },
    {
      keywords: ['review', 'reviews', 'rating', 'good hotel'],
      answer: 'We\'re rated 3.3 out of 5 from 367 Google reviews. You can read more on our <a href="/reviews">Reviews</a> page.'
    },
    {
      keywords: ['wheelchair', 'accessible', 'accessibility', 'disab'],
      answer: 'For accessibility needs, please call reception on <a href="tel:+442087434411">' + PHONE + '</a>, or mention it in the Special Requests field when booking, and we\'ll do our best to help.'
    },
    {
      keywords: ['amenities', 'facilities', 'tv', 'television'],
      answer: 'Every room has an ensuite bathroom, flat-screen TV with satellite channels, free WiFi, and tea &amp; coffee making facilities (plus a shared guest microwave). See our <a href="/amenities">Amenities</a> page for the full list.'
    },
    {
      keywords: ['thanks', 'thank you', 'cheers'],
      answer: 'You\'re welcome! Anything else I can help with?'
    },
    {
      keywords: ['bye', 'goodbye', 'see you'],
      answer: 'Thanks for stopping by &mdash; have a great day! Call ' + PHONE + ' anytime if you need us.'
    }
  ];

  var FALLBACK = 'That one\'s a bit too specific for me to answer &mdash; the team will be happy to help if you call reception on <a href="tel:+442087434411">' + PHONE + '</a>. In the meantime, here\'s what I can help with:';

  var QUICK_REPLIES = ['Room prices', 'Check-in times', 'Parking', 'How do I book?', 'Where are you located?'];

  // Rotating friendly openers so replies don't feel robotic. Cycled in order
  // (not random) so the same one never fires twice in a row.
  var OPENERS = ['Happy to help!', 'Glad to help!', 'Sure thing!', 'Great question!', 'Of course!'];
  var openerIndex = 0;
  function nextOpener() {
    var opener = OPENERS[openerIndex % OPENERS.length];
    openerIndex++;
    return opener;
  }

  function normalize(text) {
    return text.toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function findAnswer(rawText) {
    var text = normalize(rawText);
    if (!text) return null;
    // Pad with spaces so every keyword is matched as a whole word/phrase, not
    // as a substring of an unrelated word (e.g. "id" inside "outside").
    var padded = ' ' + text + ' ';
    var best = null;
    var bestScore = 0;
    for (var i = 0; i < KB.length; i++) {
      var entry = KB[i];
      var score = 0;
      for (var j = 0; j < entry.keywords.length; j++) {
        var kw = entry.keywords[j];
        if (padded.indexOf(' ' + kw + ' ') !== -1) score += kw.length;
      }
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }
    return best ? best.answer : null;
  }

  function buildWidget() {
    var root = document.createElement('div');
    root.className = 'chatbot';
    root.innerHTML =
      '<button class="chatbot-toggle" id="chatbotToggle" type="button" aria-label="Chat with us" aria-expanded="false">' +
        '<svg class="icon chatbot-icon-chat" viewBox="0 0 24 24" fill="none"><path d="M12 3.5c-4.97 0-9 3.6-9 8.05 0 2.45 1.22 4.64 3.15 6.13-.1 1.14-.5 2.14-1.2 2.97a.4.4 0 0 0 .38.65c1.6-.32 2.94-.96 3.98-1.77.85.24 1.75.37 2.69.37 4.97 0 9-3.6 9-8.05s-4.03-8.05-9-8.05Z" fill="currentColor" stroke="none"/><circle cx="8.3" cy="11.6" r="1" fill="var(--accent-2)" stroke="none"/><circle cx="12" cy="11.6" r="1" fill="var(--accent-2)" stroke="none"/><circle cx="15.7" cy="11.6" r="1" fill="var(--accent-2)" stroke="none"/></svg>' +
        '<svg class="icon chatbot-icon-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '<span class="chatbot-badge" id="chatbotBadge"></span>' +
      '</button>' +
      '<div class="chatbot-panel" id="chatbotPanel">' +
        '<div class="chatbot-head">' +
          '<div><p class="chatbot-title">Hotel 261 Assistant</p><p class="chatbot-sub">Happy to help with your stay</p></div>' +
          '<button class="chatbot-close" id="chatbotClose" type="button" aria-label="Close chat">&times;</button>' +
        '</div>' +
        '<div class="chatbot-messages" id="chatbotMessages"></div>' +
        '<div class="chatbot-quick-replies" id="chatbotQuickReplies"></div>' +
        '<form class="chatbot-form" id="chatbotForm">' +
          '<input type="text" id="chatbotInput" placeholder="Ask a question&hellip;" autocomplete="off" aria-label="Type your question">' +
          '<button type="submit" class="chatbot-send" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M4 12h16M13 5l7 7-7 7"/></svg></button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(root);
    return root;
  }

  function init() {
    var root = buildWidget();
    var toggle = root.querySelector('#chatbotToggle');
    var badge = root.querySelector('#chatbotBadge');
    var panel = root.querySelector('#chatbotPanel');
    var closeBtn = root.querySelector('#chatbotClose');
    var messages = root.querySelector('#chatbotMessages');
    var quickReplies = root.querySelector('#chatbotQuickReplies');
    var form = root.querySelector('#chatbotForm');
    var input = root.querySelector('#chatbotInput');

    var opened = false;

    function scrollToBottom() {
      messages.scrollTop = messages.scrollHeight;
    }

    function addMessage(text, from) {
      var bubble = document.createElement('div');
      bubble.className = 'chatbot-msg ' + from;
      if (from === 'bot') {
        bubble.innerHTML = text;
      } else {
        bubble.textContent = text;
      }
      messages.appendChild(bubble);
      scrollToBottom();
    }

    function renderQuickReplies(list) {
      quickReplies.innerHTML = '';
      list.forEach(function (label) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chatbot-chip';
        chip.textContent = label;
        chip.addEventListener('click', function () {
          handleUserMessage(label);
        });
        quickReplies.appendChild(chip);
      });
    }

    function showTyping(callback) {
      var typing = document.createElement('div');
      typing.className = 'chatbot-typing';
      typing.innerHTML = '<span></span><span></span><span></span>';
      messages.appendChild(typing);
      scrollToBottom();
      setTimeout(function () {
        messages.removeChild(typing);
        callback();
      }, 500 + Math.random() * 300);
    }

    function handleUserMessage(text) {
      text = text.trim();
      if (!text) return;
      addMessage(text, 'user');
      quickReplies.innerHTML = '';
      showTyping(function () {
        var answer = findAnswer(text);
        if (answer) {
          addMessage(nextOpener() + ' ' + answer, 'bot');
        } else {
          addMessage(FALLBACK, 'bot');
          renderQuickReplies(QUICK_REPLIES);
        }
      });
    }

    function openPanel() {
      opened = true;
      panel.classList.add('open');
      toggle.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      if (badge) badge.style.display = 'none';
      if (!messages.children.length) {
        showTyping(function () {
          addMessage('Hi! I\'m the Hotel 261 assistant 👋 I\'m happy to help with rooms &amp; prices, check-in times, parking, pets, booking &mdash; pretty much anything about your stay. What would you like to know?', 'bot');
          renderQuickReplies(QUICK_REPLIES);
        });
      }
      setTimeout(function () { input.focus(); }, 250);
    }

    function closePanel() {
      opened = false;
      panel.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      if (opened) closePanel(); else openPanel();
    });
    closeBtn.addEventListener('click', closePanel);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value;
      input.value = '';
      handleUserMessage(text);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
