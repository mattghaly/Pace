(function () {
  var KEY = 'pace-entries';
  var $ = function (id) { return document.getElementById(id); };
  var entryEl = $('entry'), result = $('result'), hint = $('hint');

  // Simulated reflections. A real version would send entries to an AI through a secure server.
  var themes = [
    { id: 'energy', label: 'energy at work', keys: ['drain', 'tired', 'exhaust', 'burn', 'meeting', 'boss', 'overwhelm', 'work'],
      notice: 'Your energy seems to rise and fall with what you are doing, not just how much you do.',
      matters: 'The moments that gave you energy, like helping someone, may point to what you value in your work.',
      step: 'Tomorrow, note one task that gave you energy and one that took it. Write two lines about each.' },
    { id: 'comparison', label: 'comparing yourself to others', keys: ['behind', 'friends', 'compare', 'promotion', 'everyone', 'others', 'late', 'stuck'],
      notice: 'You are measuring yourself against other people\'s timelines, which rarely show the full picture.',
      matters: 'Feeling behind often means you care about growth. What would "ahead" look like for you, not for them?',
      step: 'Write down three things you want in a year that have nothing to do with what your friends are doing.' },
    { id: 'direction', label: 'figuring out direction', keys: ['know what i want', 'direction', 'career', 'graduat', 'future', 'purpose', 'lost', 'confus', 'life'],
      notice: 'You are facing a big open question, and it is easy to feel you need the whole answer at once.',
      matters: 'You do not need a life plan. Learning what fits you comes from small tries, not one big decision.',
      step: 'This week, talk to one person whose work interests you for 15 minutes. Write down what surprised you.' },
    { id: 'worry', label: 'worry', keys: ['anxious', 'anxiety', 'worry', 'scared', 'afraid', 'nervous', 'panic', 'pressure'],
      notice: 'Worry showed up in your entry. It often grows when thoughts stay in your head, so writing them out already helps.',
      matters: 'What you worry about often points to what you care about. Which part matters most to you?',
      step: 'Split your worry into what you can act on this week and what you cannot. Pick one small action.' },
    { id: 'lonely', label: 'feeling alone', keys: ['lonely', 'alone', 'isolated', 'no one', 'miss'],
      notice: 'You mentioned feeling alone. Big life changes can thin out your circle for a while.',
      matters: 'Connection seems important to you, which is useful to know when you choose where to spend your time.',
      step: 'Send a short message to one person you have not spoken to in a while. No big agenda needed.' },
    { id: 'good', label: 'what energizes you', keys: ['happy', 'proud', 'excited', 'enjoy', 'loved', 'great', 'grateful', 'fun'],
      notice: 'There is good energy in this entry. Moments like this are worth studying, not only enjoying.',
      matters: 'Ask what made it good: the people, the activity, or how much freedom you had.',
      step: 'Write down exactly what you were doing and who you were with. Try to repeat one part of it this week.' }
  ];
  var fallback = { id: 'general', label: 'everyday moments',
    notice: 'You took a moment to put your day into words. That habit is the foundation of knowing yourself better.',
    matters: 'Small details matter. Over a few entries, Pace looks for what keeps repeating.',
    step: 'Add one more sentence: what was the best moment of today, and what made it good?' };
  var crisis = ['kill myself', 'end my life', 'suicid', 'hurt myself', 'self-harm', 'want to die', 'no reason to live'];

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function store(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { hint.textContent = 'Could not save in this browser.'; } }
  function themeOf(id) { return themes.filter(function (t) { return t.id === id; })[0] || fallback; }
  function fmt(ts) { return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  function snip(text, n) { var w = text.split(/\s+/); return w.slice(0, n).join(' ') + (w.length > n ? '…' : ''); }
  function avg(a) { return a.reduce(function (s, e) { return s + e.mood; }, 0) / a.length; }

  function pick(text) {
    var best = fallback, top = 0;
    themes.forEach(function (t) {
      var s = 0; t.keys.forEach(function (k) { if (text.indexOf(k) !== -1) s++; });
      if (s > top) { best = t; top = s; }
    });
    return best;
  }

  function build(text, mood, ts, past) {
    var low = text.toLowerCase();
    if (crisis.some(function (w) { return low.indexOf(w) !== -1; })) {
      return { id: 'care', ts: ts, text: text, mood: mood, ref: {
        notice: 'What you wrote sounds heavy, and I\'m glad you put it into words.', past: '',
        matters: 'This is more than a diary can hold on its own, and you deserve real support from a person.',
        step: 'Please contact your local emergency number or someone you trust right now, and tell them what you wrote here.' } };
    }
    var t = pick(low), same = past.filter(function (e) { return e.id === t.id; }), p;
    if (same.length) {
      var last = same[same.length - 1], diff = mood - avg(same);
      p = 'This theme has now come up ' + (same.length + 1) + ' times. On ' + fmt(last.ts) + ' you wrote: "' + snip(last.text, 14) + '" ' +
        (diff >= 1 ? 'Today feels lighter than those days.' : diff <= -1 ? 'Today feels heavier than those days.' : 'Your mood around this theme has stayed fairly steady.');
    } else if (past.length) {
      p = 'This is a new theme compared with your ' + past.length + ' earlier entries.';
    } else {
      p = 'This is your first entry. Pace starts comparing days once you have a few.';
    }
    return { id: t.id, ts: ts, text: text, mood: mood, ref: { notice: t.notice, past: p, matters: t.matters, step: t.step } };
  }

  function show(e) {
    $('r-head').textContent = fmt(e.ts) + ' · mood ' + e.mood + ' of 5';
    $('r-text').textContent = e.text;
    $('r-notice').textContent = e.ref.notice;
    $('r-past').textContent = e.ref.past;
    $('b-past').hidden = !e.ref.past;
    $('r-matters').textContent = e.ref.matters;
    $('r-step').textContent = e.ref.step;
    result.hidden = false;
    result.style.animation = 'none'; void result.offsetWidth; result.style.animation = '';
  }

  function el(tag, text) { var n = document.createElement(tag); if (text) n.textContent = text; return n; }

  function render() {
    var list = load(), pic = $('picture'), tl = $('timeline');
    $('sample').hidden = list.length > 0;
    pic.textContent = ''; tl.textContent = '';
    if (!list.length) {
      pic.appendChild(el('p', 'Write your first entry. As your journal grows, Pace builds a picture of what keeps coming back and how you are changing.'));
    } else {
      var counts = {};
      list.forEach(function (e) { if (e.id !== 'care') counts[e.id] = (counts[e.id] || 0) + 1; });
      var ids = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 3);
      pic.appendChild(el('p', list.length + (list.length === 1 ? ' entry so far.' : ' entries so far.')));
      if (ids.length) {
        pic.appendChild(el('p', 'What keeps coming up:'));
        var ul = el('ul');
        ids.forEach(function (id) { ul.appendChild(el('li', themeOf(id).label + ' (' + counts[id] + ')')); });
        pic.appendChild(ul);
      }
      if (list.length >= 4) {
        var recent = list.slice(-3), earlier = list.slice(0, -3);
        pic.appendChild(el('p', 'Mood: about ' + avg(recent).toFixed(1) + ' recently, ' + avg(earlier).toFixed(1) + ' before that.'));
      }
      if (ids.length && counts[ids[0]] >= 2) {
        pic.appendChild(el('p', 'Your entries keep returning to ' + themeOf(ids[0]).label + '. Would it help to focus there next? One idea: ' + themeOf(ids[0]).step));
      }
    }
    list.slice().reverse().forEach(function (e) {
      var li = el('li'), b = el('button');
      b.type = 'button';
      b.appendChild(el('span', snip(e.text, 9)));
      b.appendChild(el('small', fmt(e.ts) + ' · mood ' + e.mood + ' · ' + themeOf(e.id).label));
      b.addEventListener('click', function () { show(e); result.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
      li.appendChild(b); tl.appendChild(li);
    });
  }

  $('save').addEventListener('click', function () {
    var text = entryEl.value.trim();
    if (text.length < 15) { hint.textContent = 'Write a little more first. A few sentences is enough.'; return; }
    hint.textContent = '';
    var mood = Number(document.querySelector('input[name="mood"]:checked').value), list = load();
    var e = build(text, mood, Date.now(), list);
    list.push(e); store(list); entryEl.value = ''; show(e); render();
  });

  $('sample').addEventListener('click', function () {
    var day = 86400000, now = Date.now(), list = [];
    [
      ['Back-to-back meetings all day. I was exhausted by 4pm and just stared at my screen. Not sure this job is for me.', 2],
      ['Spent the evening helping my coworker debug a problem. I loved it and time flew by. I should do more of that.', 4],
      ['Saw my friends\' promotion posts and felt behind and stuck. Everyone seems to know where they are going.', 2],
      ['Another draining day of meetings. The only good part was explaining a tool to the new intern.', 3],
      ['I honestly don\'t know what I want to do with my life. Graduation feels so far away already.', 2],
      ['Helped a friend plan her presentation today and enjoyed every minute. I felt proud and excited.', 5]
    ].forEach(function (s, i) { list.push(build(s[0], s[1], now - (6 - i) * day, list)); });
    store(list); show(list[list.length - 1]); render();
  });

  $('export').addEventListener('click', function () {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(load(), null, 2)], { type: 'application/json' }));
    a.download = 'pace-journal.json'; a.click();
  });

  $('wipe').addEventListener('click', function () {
    if (confirm('Delete all entries from this browser? This cannot be undone.')) {
      try { localStorage.removeItem(KEY); } catch (e) {}
      result.hidden = true; render();
    }
  });

  render();
})();
