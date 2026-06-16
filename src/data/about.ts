/* About-page content. Personal data lives here, not hardcoded in the page.
   Image-backed pieces (portrait, beyond) are TODO until the user supplies
   real assets — see docs/ABOUT_PAGE.md Part 5. */
export const about = {
  intro:
    "I'm a high school student in Hong Kong, studying at SCIE and applying to study computer science. I spend most of my time on AI research — how systems plan, where they break, and how to make them reliable — and on building software that solves real problems for real people. The rest of the time I'm behind a camera, at a table-tennis table, or losing at Go.",

  theme:
    "I'm drawn to things that reward both precision and patience — which is probably why I like all of them.",

  portraitAlt: 'Portrait of Jayden', // TODO: replace placeholder portrait

  // Slugs into the projects collection — covers/hooks stay in sync with Work.
  featuredWork: ['llm-planning', 'virtual-cect', 'blindrun'],

  honors: [
    { name: 'USACO Gold',     note: 'USA Computing Olympiad, top division' },
    { name: 'AIME qualifier', note: 'top ~5% of the AMC' },
    { name: 'AMC top 5%',     note: '' },
    { name: 'Silver, SPC',    note: 'physics competition' },
  ],

  // Beyond-the-screen hobbies; images are TODO placeholders for now.
  beyond: [
    { label: 'Table tennis',       note: 'nationally certified Level-2 athlete' },
    { label: 'Photography & drone', note: 'street, landscape, aerial' },
    { label: 'Video editing',      note: 'a couple on Bilibili' },
    { label: 'Go',                 note: 'amateur 3-dan' },
  ],
} as const;
