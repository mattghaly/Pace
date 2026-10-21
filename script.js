(function () {
  var entry = document.getElementById('entry');
  var result = document.getElementById('result');
  var nodes = {
    notice: document.getElementById('r-notice'),
    matters: document.getElementById('r-matters'),
    step: document.getElementById('r-step')
  };

  // Simulated reflections. A real version would send the entry to an AI through a secure server.
  var themes = [
    {
      id: 'energy',
      keys: ['drain', 'tired', 'exhaust', 'burn', 'meeting', 'boss', 'overwhelm', 'work'],
      notice: 'Your energy seems to go up and down depending on what you are doing, not just how much you do.',
      matters: 'The moments that gave you energy, like helping someone, may point to what you value in your work.',
      step: 'Tomorrow, note one task that gave you energy and one that took it. Write two lines about each.'
    },
    {
      id: 'comparison',
      keys: ['behind', 'friends', 'compare', 'promotion', 'everyone', 'others', 'late', 'stuck'],
      notice: 'You are measuring yourself against other people\'s timelines. That is common at this stage, and it rarely shows the full picture.',
      matters: 'Feeling behind often means you care about growth. What would "ahead" look like for you, not for them?',
      step: 'Write down three things you want in a year that have nothing to do with what your friends are doing.'
    },
    {
      id: 'direction',
      keys: ['know what i want', 'direction', 'career', 'graduat', 'future', 'purpose', 'lost', 'confus', 'life'],
      notice: 'You are facing a big open question, and it is easy to feel that you need the whole answer at once.',
      matters: 'You do not need to know your life plan. Learning what fits you comes from small tries, not one big decision.',
      step: 'This week, talk to one person whose work interests you for 15 minutes. Write down what surprised you.'
    },
    {
      id: 'worry',
      keys: ['anxious', 'anxiety', 'worry', 'scared', 'afraid', 'nervous', 'panic', 'pressure'],
      notice: 'Worry showed up in your entry. It often grows when thoughts stay in your head, so writing them out already helps.',
      matters: 'What you worry about often points to what you care about. Which part matters most to you?',
      step: 'Split your worry into what you can act on this week and what you cannot. Pick one small action.'
    },
    {
      id: 'lonely',
      keys: ['lonely', 'alone', 'isolated', 'no one', 'miss'],
      notice: 'You mentioned feeling alone. Big life changes can thin out your circle for a while.',
      matters: 'Connection seems important to you. That is useful to know when you choose where you spend your time.',
      step: 'Send a short message to one person you have not spoken to in a while. No big agenda needed.'
    },
    {
      id: 'good',
      keys: ['happy', 'proud', 'excited', 'enjoy', 'loved', 'great', 'grateful', 'fun'],
      notice: 'There is good energy in this entry. Moments like this are worth studying, not only enjoying.',
      matters: 'Ask what made this moment good: the people, the activity, or how much freedom you had.',
      step: 'Write down exactly what you were doing and who you were with. Try to repeat one part of it this week.'
    }
  ];

  var fallback = {
    id: 'general',
    notice: 'You took a moment to put your day into words. That habit is the foundation of knowing yourself better.',
    matters: 'Small details matter here. Over a few entries, Pace looks for what keeps repeating.',
    step: 'Add one more sentence: what was the best moment of today, and what made it good?'
  };

  var crisisWords = ['kill myself', 'end my life', 'suicid', 'hurt myself', 'self-harm', 'want to die', 'no reason to live'];

  function pick(text) {
    var best = fallback, bestScore = 0;
    themes.forEach(function (t) {
      var score = 0;
      t.keys.forEach(function (k) { if (text.indexOf(k) !== -1) score++; });
      if (score > bestScore) { best = t; bestScore = score; }
    });
    return best;
  }

  function countSeen(id) {
    try {
      var data = JSON.parse(localStorage.getItem('pace-themes') || '{}');
      data[id] = (data[id] || 0) + 1;
      localStorage.setItem('pace-themes', JSON.stringify(data));
      return data[id];
    } catch (e) { return 1; }
  }

  function show(notice, matters, step) {
    nodes.notice.textContent = notice;
    nodes.matters.textContent = matters;
    nodes.step.textContent = step;
    result.hidden = false;
    result.style.animation = 'none';
    void result.offsetWidth;
    result.style.animation = '';
  }

  function reflect() {
    var text = entry.value.trim().toLowerCase();
    if (text.length < 15) {
      show('Write a little more so there is something to reflect on.', 'Even two or three sentences is enough.', 'Try describing one moment from today and how it felt.');
      return;
    }
    if (crisisWords.some(function (w) { return text.indexOf(w) !== -1; })) {
      show(
        'What you wrote sounds heavy, and I\'m glad you put it into words.',
        'This is more than a diary can hold on its own, and you deserve real support from a person.',
        'Please contact your local emergency number or someone you trust right now. If you can, tell them what you wrote here.'
      );
      return;
    }
    var t = pick(text);
    var seen = countSeen(t.id);
    var notice = t.notice;
    if (seen > 1 && t.id !== 'general') {
      notice += ' This theme has now appeared in ' + seen + ' of your entries here, which is the kind of pattern Pace tracks over time.';
    }
    show(notice, t.matters, t.step);
  }

  document.getElementById('reflect').addEventListener('click', reflect);
  Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (chip) {
    chip.addEventListener('click', function () {
      entry.value = chip.getAttribute('data-text');
      entry.focus();
    });
  });
})();
