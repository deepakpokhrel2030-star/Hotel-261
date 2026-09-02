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
      answer: 'We have 7 room types, from £54&ndash;£120 a night: Single (£54, sleeps 1), Twin (£75, sleeps 2), Double Room 1&ndash;2 Adults (£75, sleeps 2), Double (£80, sleeps 2), Triple (£95, sleeps 3), Quadruple (£120, sleeps 4) and Family (£120, sleeps up to 5). See full details on our <a href="/rooms">Rooms &amp; Rates</a> page.'
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
      keywords: ['family room', 'family', 'group', 'five', '5 people'],
      answer: 'Family Room &mdash; £120/night, sleeps up to 5. Useful for visiting family or small groups who want to stay together.'
    },
    {
      keywords: ['check-in', 'check in', 'checkin', 'check-out', 'check out', 'checkout', 'arrival time', 'what time'],
      answer: 'Check-in is from 14:00&ndash;23:30, and check-out is 08:00&ndash;11:00. Please arrive by 23:30 as the hotel is closed overnight. Early check-in can\'t be guaranteed, but we\'ll accommodate you if your room is ready.'
    },
    {
      keywords: ['id', 'identification', 'deposit', 'passport'],
      answer: 'A government-issued photo ID is required at check-in (digital or scanned IDs aren\'t accepted). A £20 cash or ID deposit is required for room keys.'
    },
    {
      keywords: ['breakfast', 'food', 'eat'],
      answer: 'Full English or Italian breakfast is served 08:00&ndash;11:30 at Little Napoli, a 5-minute walk away. Ask reception for a voucher &mdash; you\'ll also get 15% off all other meals there.'
    },
    {
      keywords: ['parking', 'park', 'car'],
      answer: 'Limited on-site parking is available for £15/day, from 14:00 on arrival to 11:00 on departure. Contact us ahead to reserve a space, as availability is limited.'
    },
    {
      keywords: ['pay', 'payment', 'card'],
      answer: 'Cash is accepted on site. Online bookings can be paid in advance or on arrival, depending on the rate you choose &mdash; and our online checkout is secured by Stripe, so we never see or store your card details.'
    },
    {
      keywords: ['pet', 'pets', 'dog', 'cat'],
      answer: 'Sorry, pets aren\'t permitted at Hotel 261.'
    },
    {
      keywords: ['smoke', 'smoking'],
      answer: 'We\'re a smoke-free hotel with a designated outdoor smoking area.'
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
      keywords: ['wifi', 'wi-fi', 'internet'],
      answer: 'Free WiFi is available throughout the hotel and in every room.'
    },
    {
      keywords: ['cancel', 'cancellation', 'refund', 'change my booking'],
      answer: 'Free cancellation up to 48 hours before check-in on bookings made directly with us &mdash; and no third-party booking fees when you book direct.'
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

  var FALLBACK = 'I\'m not sure about that one &mdash; for anything I can\'t answer, please call reception on <a href="tel:+442087434411">' + PHONE + '</a>, or try one of these:';

  var QUICK_REPLIES = ['Room prices', 'Check-in times', 'Parking', 'How do I book?', 'Where are you located?'];

  function normalize(text) {
    return text.toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function findAnswer(rawText) {
    var text = normalize(rawText);
    if (!text) return null;
    var best = null;
    var bestScore = 0;
    for (var i = 0; i < KB.length; i++) {
      var entry = KB[i];
      var score = 0;
      for (var j = 0; j < entry.keywords.length; j++) {
        if (text.indexOf(entry.keywords[j]) !== -1) score++;
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
        '<svg class="icon chatbot-icon-chat" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>' +
        '<svg class="icon chatbot-icon-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '<span class="chatbot-badge" id="chatbotBadge"></span>' +
      '</button>' +
      '<div class="chatbot-panel" id="chatbotPanel">' +
        '<div class="chatbot-head">' +
          '<div><p class="chatbot-title">Hotel 261 Assistant</p><p class="chatbot-sub">Usually replies instantly</p></div>' +
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
          addMessage(answer, 'bot');
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
          addMessage('Hi! I\'m the Hotel 261 assistant 👋 Ask me about rooms &amp; prices, check-in times, parking, or how to book &mdash; or call us anytime on <a href="tel:+442087434411">' + PHONE + '</a>.', 'bot');
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
