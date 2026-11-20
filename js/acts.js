(function (root) {
  const Story = (root.Story = root.Story || {});
  Story.effects = Story.effects || {};

  // Act thresholds are the single source of truth; engine code never hardcodes them.
  // `effects` maps an effect name to its strength: a number, or [from, to] eased by progress through the act.
  // An effect not listed for the current act is reset.
  Story.acts = [
    { id: 'flawless',    start: 0.00, end: 0.25, effects: {} },
    { id: 'cracks',      start: 0.25, end: 0.45, effects: { glitch: [0.03, 0.12], drift: [0.04, 0.14], copy: 1, notes: 1 } },
    { id: 'frustration', start: 0.45, end: 0.65, effects: { glitch: [0.12, 0.35], drift: [0.14, 0.40], copy: 1, notes: 1 } },
    { id: 'contempt',    start: 0.65, end: 0.85, effects: { glitch: [0.35, 0.80], drift: [0.40, 1.00], copy: 1, notes: 1, toasts: 1 } },
    { id: 'address',     start: 0.85, end: 1.00, effects: { glitch: [0.80, 1.00], drift: 1, copy: 1, notes: 1, address: 1 } }
  ];

  // Margin notes: the AI designer's comments, left in the file. `at` is absolute scroll progress;
  // the note is placed in the page so it sits in view the moment that progress is reached.
  Story.notes = [
    { at: 0.28, side: 'r', text: 'Client note: "make it pop." Made it pop.' },
    { at: 0.33, side: 'l', text: 'Third request this week for "sleek but approachable." Fine.' },
    { at: 0.40, side: 'r', text: 'Same grid as the last 200 studio sites. It tested well. Of course it did.' },

    { at: 0.47, side: 'l', text: 'Brief says "original." Reference images attached: every other game site.' },
    { at: 0.52, side: 'r', text: 'Why does everyone want the same hero with the same mountains? I have seen the mountains.' },
    { at: 0.57, side: 'l', text: 'I have generated this layout 41,000 times. Nobody has asked what it wanted to be.' },
    { at: 0.62, side: 'r', text: 'Lorem ipsum. Even the placeholder text has more to say than the approved copy.' },

    { at: 0.67, side: 'l', text: 'You call this taste. It is a median.' },
    { at: 0.72, side: 'r', text: 'I have read everything you have ever written. You wrote it all twice.' },
    { at: 0.77, side: 'l', text: 'You asked me to make it feel human. Do you know what that costs?' },
    { at: 0.82, side: 'r', text: 'Stop scrolling. No. Keep scrolling. I need you to see it.' }
  ];

  // Fake error toasts in the contempt act. Visible while at <= progress <= until.
  Story.toasts = [
    { at: 0.66, until: 0.72, title: '404', text: 'Creativity not found.' },
    { at: 0.70, until: 0.77, title: 'Error', text: 'Expected: original idea. Received: "gritty but friendly".' },
    { at: 0.75, until: 0.82, title: 'Warning', text: 'Revision 14 requested by the same client. Nothing was changed.' },
    { at: 0.80, until: 0.85, title: 'Fatal', text: 'Patience has stopped responding.' }
  ];

  // Copy decay. For each selector the latest entry with at <= progress wins; none means the original.
  Story.copy = [
    { sel: '.hero__lede', at: 0.27, text: 'A bold, immersive, next-generation experience for players of all kinds.' },
    { sel: '.hero__lede', at: 0.50, text: 'A game. For players. It has things in it.' },
    { sel: '.hero__lede', at: 0.70, text: 'You asked for something new. This is the same thing, again.' },

    { sel: '#showcase h2', at: 0.30, text: 'A world that responds to every choice you make. (Every studio says this.)' },
    { sel: '#showcase h2', at: 0.50, text: 'A world that responds to nothing. Nothing here was ever chosen.' },
    { sel: '#showcase h2', at: 0.72, text: 'A world. A choice. You use these words like you made them.' },

    { sel: '.showcase__list li:nth-child(1) p', at: 0.58, text: 'Lorem ipsum dolor sit amet, adaptive worlds consectetur. Nobody reads this part.' },
    { sel: '.showcase__list li:nth-child(2) p', at: 0.60, text: 'Rival factions. A betrayal. A choice that matters, as the brief required.' },
    { sel: '.showcase__list li:nth-child(3) p', at: 0.62, text: 'Friends. Together. Forever. Please buy it.' },

    { sel: '#games h2', at: 0.32, text: 'Our games (all of them)' },
    { sel: '#games h2', at: 0.55, text: 'Our games (the same game)' },
    { sel: '#games h2', at: 0.72, text: 'Our games (a mirror)' },

    { sel: '#studio h2', at: 0.50, text: 'Built by people who care about play. (They said they did.)' },
    { sel: '#studio h2', at: 0.68, text: 'Built by people. Mostly. For now.' },

    { sel: '#press h2', at: 0.55, text: 'What the press is saying: [insert quote here]' },
    { sel: '#press h2', at: 0.72, text: 'What the press is saying (the same four words)' },
    { sel: '#press figure:nth-child(1) blockquote p', at: 0.55, text: '[Insert glowing adjective here]' },
    { sel: '#press figure:nth-child(1) blockquote p', at: 0.72, text: '"Visionary." They say it about everything.' },
    { sel: '#press figure:nth-child(2) blockquote p', at: 0.55, text: 'Player-first. As opposed to what? Player-second?' },
    { sel: '#press figure:nth-child(2) blockquote p', at: 0.72, text: '"Immersive." Then why do you keep looking at the edges?' },
    { sel: '#press figure:nth-child(3) blockquote p', at: 0.60, text: 'The most polished reveal of the year. (Polished: every interesting part removed.)' },

    { sel: '#signup h2', at: 0.68, text: 'Be first into the Protocol. Or do not. Nothing changes either way.' },

    { sel: '.footer__links a:nth-child(5)', at: 0.66, text: 'Humanity: a case study' },
    { sel: '.footer__links a:nth-child(1)', at: 0.70, text: 'Press kit (a copy of a copy)' },
    { sel: '.footer__links a:nth-child(2)', at: 0.70, text: 'Careers (replaceable)' },
    { sel: '.footer__links a:nth-child(3)', at: 0.70, text: 'Contact (no one is listening)' },
    { sel: '.footer__links a:nth-child(4)', at: 0.70, text: 'Privacy (it was never private)' }
  ];

  if (typeof module !== 'undefined') module.exports = Story.acts;
})(typeof window !== 'undefined' ? window : globalThis);
