// ---------------------------------------------------------------------------
// content.js — everything you'd want to edit without touching script.js.
// Project text, story sections, media files, links, and your contact details.
// Edit this file, save, and the live site updates within a minute.
// ---------------------------------------------------------------------------

// DETAILS: what shows in the hover card for each project/profile/writing item.
const DETAILS = {
    'profile': {
      status: 'Profile', title: 'Nitya Vodela', noun: 'profile', compact: true,
      summary: 'Software engineer, then designer, then business analyst. Now moving into AI product management, with responsible AI at the center.',
      points: ['MS in Computer Science, UT Arlington. B.Tech, Gitam University', 'ISO 27001 Lead Auditor', 'Writes about AI safety and governance'],
      tags: ['AI product management', 'Responsible AI', 'Business analysis', 'UI/UX']
    },
    'redline': {
      status: 'Live', title: 'Redline',
      summary: 'A RAG-based AI project that checks any text for ethics and safety risks, scores it, and rewrites it to be safe.',
      points: ['Checks for ethics, privacy, bias, hallucination and safety risks', 'Returns a risk score, a summary report and a safe rewrite', 'Being enhanced with PII redaction'],
      tags: ['RAG', 'Responsible AI', 'Risk scoring', 'AI safety']
    },
    'chomp': {
      status: 'In progress', title: 'Chomp',
      summary: 'An AI chat app that turns “what should I cook?” into a decision, and tracks which saved recipes you actually cook again.',
      points: ['Vague ask: two or three options. Specific ask: one recipe', 'Allergies applied silently to every request', 'Tracks what you actually cook: To try and Cooked'],
      tags: ['Conversational AI', 'Product thinking', 'Brand identity']
    },
    'afterglow': {
      status: 'Interactive', title: 'Afterglow',
      summary: 'An interactive heat field that turns movement and sound into thermal color.',
      points: ['Pitch shapes the heat: low tones bloom wide, high tones stay tight', 'Blue, cyan, lime, yellow, orange, red: cool rim, hot core', 'The visual language of this portfolio'],
      tags: ['Interaction design', 'Creative direction', 'Generative visuals']
    },
    'dsl': {
      status: 'Digital Stamp Library', title: 'DSL', 
      summary: 'A Digital Stamp Library: stamps designed in Figma and presented as a library, open to customisation.',
      points: ['21 stamps, each designed in Figma', 'Presented as a library, shown in motion', 'Open to customisation'],
      tags: ['Figma', 'Digital stamps', 'Library']
    },
    'graphic': {
      status: 'Gallery', title: 'Graphic',
      summary: 'A curated gallery of selected graphic design, shown like a museum.',
      points: ['Eight selected pieces, each with its own placard', 'Posters, type, UI widgets and marks', 'Curated, not exhaustive'],
      tags: ['Graphic design', 'Curation']
    },
    'safety-governance': {
      status: 'Published on Medium', title: 'AI safety & governance',
      summary: 'Writing on how AI systems can be made safe, and how they can be governed.',
      points: ['Published on Medium', '“The Rise of Advanced AI Systems”: Google’s SAIF, explained for a technical audience', 'Also researches adversarial robustness, interpretability and policy strategy'],
      tags: ['AI safety', 'AI governance', 'Medium']
    }
  };

// Each project's `media` list holds centred images or looping motion graphics:
  //   { type: 'image' | 'video', src: 'data:...', alt: '', caption: '', poster: 'data:...' }
  // Add your Medium profile or publication URL here to switch on the Medium links.
  const MEDIUM_URL = 'https://medium.com/@nityavodela';
// CASES: the full story shown when a project is opened — sections, media
// (images/video in /assets/<project>/...), and any outbound links.
const CASES = {
    'profile': { sections: [
      { h: 'The path', p: '{{Software engineer, then UI/UX designer, then business analyst.}} Accenture first, then an MS in Computer Science, then design and analysis on a telecom ERP.' },
      { h: 'What I do now', p: 'I own requirements and interface design end to end for a telecom ERP. Web and mobile reached {{production within six months}}, and it is live with {{50 active users}}.' },
      { h: 'Impact', p: 'I cut requirement-to-release turnaround from {{six weeks to three}}, and led a UAT cycle that surfaced {{30 defects and 24 enhancements}} before release.' },
      { h: 'What I care about', p: 'Making AI {{trustworthy}}. I write about AI safety and governance, including Google’s SAIF framework, and built {{Redline}}, a live project for checking AI risk.' },
      { h: 'Credentials', p: '{{ISO 27001 Lead Auditor}}, Microsoft Power BI, and Google AI Essentials. I read risk, compliance and governance fluently.' },
      { h: 'Right now', p: 'Moving into {{AI product management}}, on products where trust is part of the product, not an afterthought.' }
    ],
      media: [{"type": "video", "src": "assets/profile/profile-01.mp4", "poster": "assets/profile/profile-02-poster.jpg", "alt": "The wordmark nityavodela. small in the centre while the background and ink swap between pink, blue, charcoal and white."}], empty: 'Your portrait or a short motion piece goes here', links: [] },
    'redline': { sections: [
      { h: 'What it does', p: 'Paste in any text. Redline checks it for {{ethics, privacy, bias, hallucination and safety risks}}.' },
      { h: 'What you get back', p: '{{A colour-coded risk score}}, a summary report, and a {{safe rewrite}} that corrects the text according to the report.' },
      { h: 'How it is built', p: 'A {{RAG-based}} project in Python and Streamlit, using the Hugging Face Inference API with Llama-3 and Mistral.' },
      { h: 'What is next', p: 'Being enhanced to consider {{PII redaction}} as well.' }
    ], media: [], empty: 'A screenshot or screen recording of Redline goes here',
      links: [{ label: 'Try Redline', url: 'https://ai-ethics-risk-checker.streamlit.app' }, { label: 'View on GitHub', url: 'https://github.com/nityavodela/ai-ethics-risk-checker' }] },
    'chomp': { sections: [
      { h: 'Who it is for', p: 'A frequent home cook who wants variety, and a busy person who wants speed. {{Not a beginner who needs hand-holding.}}' },
      { h: 'The job', p: 'Cut the {{decision fatigue}} of what to cook, and surface which saved recipes {{actually get cooked again}}.' },
      { h: 'How it responds', p: 'A vague ask gets {{two or three options}}. A fully specific one gets {{a single recipe}}. Concrete quantities, never “to taste”.' },
      { h: 'What it remembers', p: 'Allergies are set once and {{applied silently}} to every request. Pantry, mood and cravings are typed fresh, {{never saved}}.' },
      { h: 'Saving and cooking', p: 'Save is a bookmark. Mark it as cooked and {{To try}} becomes {{Cooked}}, with a count, a date and a note.' },
      { h: 'The brand', p: 'A cream base with {{Klein Blue, Citric, Fuchsia and Tangerine}}, set in Fraunces and Inter.' }
    ], media: [], empty: 'Brand and app screens go here', links: [] },
    'afterglow': { sections: [
      { h: 'The idea', p: 'Make the invisible visible: {{sound, movement and energy}} rendered as heat.' },
      { h: 'How it works', p: 'Your pointer is a warm body. {{Pitch shapes the heat}}: low tones bloom wide and soft, high tones stay tight and hot.' },
      { h: 'Sound', p: 'Move to play a tone, or use the microphone and your voice {{rises as heat}} from the bottom of the screen.' },
      { h: 'The palette', p: 'Blue, cyan, lime, yellow, orange, red. {{Cool rim, hot core}}, shifting along the ramp as you travel through this page.' },
      { h: 'Where it lives', p: 'It became the {{visual language of this portfolio}}: the heat lens, the glass hand, the sideways scroll.' }
    ],
      // Made from the site's own heat model: a loop, then stills for the idea, pitch, sound, palette and light mode.
      media: [{"type": "video", "src": "assets/afterglow/afterglow-01.mp4", "poster": "assets/afterglow/afterglow-02-poster.jpg", "alt": "A heat lens drifting in a slow figure-eight, its color shifting as it moves."}, {"type": "image", "src": "assets/afterglow/afterglow-03-a-single-heat-lens-a-blue-rim-arou.jpg", "alt": "A single heat lens: a blue rim around a yellow-orange core."}, {"type": "image", "src": "assets/afterglow/afterglow-04.jpg", "alt": "Two lenses: a wide soft one for a low tone, and a small hot one for a high tone."}, {"type": "image", "src": "assets/afterglow/afterglow-05.jpg", "alt": "Heat rising from the bottom of the screen: low tones on the left, high tones on the right."}, {"type": "image", "src": "assets/afterglow/afterglow-06.jpg", "alt": "The color ramp from blue to red, and three lenses showing the core sliding from yellow to red along the page."}, {"type": "image", "src": "assets/afterglow/afterglow-07-the-same-lens-in-light-mode-on-a-w.jpg", "alt": "The same lens in light mode on a white page."}],
      empty: 'A screen recording of Afterglow goes here', links: [] },
    'dsl': { sections: [
      { h: 'The idea', p: 'A {{Digital Stamp Library}} of {{21 stamps}}, presented as one collection.' },
      { h: 'The design', p: 'Every stamp {{designed in Figma}}, from seals and tickets to barcodes and labels.' },
      { h: 'Customisation', p: '{{Open to customisation.}} The same stamp reworked: filled or outlined, dark or light.' }
    ], allMediaFirst: true,
      media: [{"type": "video", "src": "assets/dsl/dsl-01.mp4", "poster": "assets/dsl/dsl-02-poster.jpg", "alt": "The stamps press in one at a time, then settle into the full library of twenty-one."}, {"type": "image", "src": "assets/dsl/dsl-03-the-full-library-twenty-one-black-.jpg", "alt": "The full library: twenty-one black and white stamps in a grid."}, {"type": "image", "src": "assets/dsl/dsl-04.jpg", "alt": "Three stamps in close-up: a circular seal, a stamp with a misty forest photo, and a movie ticket label."}, {"type": "image", "src": "assets/dsl/dsl-05.jpg", "alt": "Four stamps, each shown in two versions: filled and outlined, dark and light."}],
      empty: 'A video of the stamp library goes here', links: [] },
    'graphic': { sections: [
      { h: 'Selected works', p: 'Selected graphic design, {{hung like a museum}}. Scroll inside the frame to walk from piece to piece.' }
    ], museum: true, gallery: true, allMediaFirst: true,
      // Working titles and labels: replace meta with 'Year · Tools' for each piece.
      media: [{"type": "image", "src": "assets/graphic/graphic-01.jpg", "alt": "Six tall photographs (rock, water, light, lava, leaves, galaxy) under the words NATURE'S CHOICE.", "title": "Nature's Choice", "meta": "Typographic collage"}, {"type": "image", "src": "assets/graphic/graphic-02.jpg", "alt": "MORSE CODE set in stretched black type with dots and dashes running through it.", "title": "Morse code", "meta": "Typographic poster"}, {"type": "image", "src": "assets/graphic/graphic-03-a-light-grey-poster-with-dark-cabl.jpg", "alt": "A light grey poster with dark cables, red glow and the word powr.", "title": "POWR", "meta": "Poster"}, {"type": "image", "src": "assets/graphic/graphic-04.jpg", "alt": "Six ticket-style widget cards for an arena event in red, blue, magenta, lime, pink and gradient.", "title": "Widget designs: arena tickets", "meta": "UI widget cards"}, {"type": "image", "src": "assets/graphic/graphic-05-two-music-widget-cards-midnight-su.jpg", "alt": "Two music widget cards, Midnight Sun, in pink and aqua gradients.", "title": "Widget designs: Midnight Sun", "meta": "UI widget cards"}, {"type": "image", "src": "assets/graphic/graphic-06.jpg", "alt": "A grid of overlapping translucent circles in pink, green, blue and orange.", "title": "ot", "meta": "Pattern study"}, {"type": "image", "src": "assets/graphic/graphic-07.jpg", "alt": "Two rounded plus shapes in an orange gradient on an orange to red background.", "title": "Plus mark", "meta": "Logo mark"}, {"type": "image", "src": "assets/graphic/graphic-08.jpg", "alt": "A series of four posts titled Frequency, in white, teal light trails, amber light trails and black.", "title": "Frequency", "meta": "Social post series"}], empty: 'Framed pieces go here', links: [] },
    'safety-governance': { sections: [
      { h: 'The focus', p: 'How AI systems can be made {{safe}}, and how rules, standards and accountability keep them {{trustworthy}}.' },
      { h: 'Published', p: '{{“The Rise of Advanced AI Systems”}} on Medium, breaking down Google’s Secure AI Framework for a technical audience.' },
      { h: 'Beyond SAIF', p: 'Research on {{adversarial robustness, interpretability and policy strategy}}.' }
    ], media: [], empty: 'Article links coming soon', links: MEDIUM_URL ? [{ label: 'Read on Medium', url: MEDIUM_URL }] : [] }
  };

// CONTACT: socials and resume, shown in the "Let's talk" section.
const CONTACT = {
    socials: [
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/nityavodela/' },   // a pill switches on once it has a URL
      { label: 'Instagram', url: 'https://www.instagram.com/nityavodela/' },
      { label: 'GitHub', url: 'https://github.com/nityavodela' }
    ],
    // pdf: a data URI of the PDF (Download). pages: page images as data URIs (Preview).
    resume: {
      filename: 'Nitya_Vodela_Resume.pdf',
      pdf: 'assets/resume/resume-01.pdf',
      pages: ['assets/resume/resume-02.jpg', 'assets/resume/resume-03.jpg']
    }
  };
