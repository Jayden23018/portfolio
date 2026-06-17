/* About-page content. Personal data lives here, not hardcoded in the page.
   Image-backed pieces (portrait, beyond) are TODO until the user supplies
   real assets — see docs/ABOUT_PAGE.md Part 5. */
export const about = {
  intro:
    "I'm a high school student in Shenzhen, studying at SCIE and applying to study computer science and engineering. I spend most of my time on AI research — how systems plan, where they break, and how to make them reliable — and on building software that solves real problems for real people. The rest of the time I'm behind a camera, at a table-tennis table, or losing at Go.",

  theme:
    "I'm drawn to things that reward both precision and patience — which is probably why I like all of them.",

  portraitAlt: 'Portrait of Jayden', // TODO: replace placeholder portrait

  // Slugs into the projects collection — covers/hooks stay in sync with Work.
  featuredWork: ['llm-planning', 'virtual-cect', 'blindrun'],

  honors: [
    {
      name: 'USACO Gold',
      year: 2026,
      note: 'USA Computing Olympiad, Gold division — the third of four tiers (Bronze → Silver → Gold → Platinum) in the US competitive-programming ladder.',
    },
    {
      name: 'AIME qualifier',
      year: 2025,
      note: 'American Invitational Mathematics Examination — invitation-only, earned by top AMC scorers (~top 5% nationally).',
    },
    {
      name: 'AMC 12 — top 5%',
      year: 2025,
      note: 'American Mathematics Competition 12, top 5% nationally — the score that qualified me for the AIME.',
    },
    {
      name: 'Silver, Senior Physics Challenge',
      year: 2025,
      note: 'Senior Physics Challenge — Silver award.',
    },
    {
      name: 'Table tennis — Level-2 athlete',
      year: 2018,
      note: 'Nationally certified Level-2 athlete.',
    },
    {
      name: 'Go — amateur 3-dan',
      year: 2016,
      note: 'Amateur 3-dan ranking in Go (Weiqi).',
    },
  ],

  // Beyond-the-screen hobbies; images are TODO placeholders for now.
  beyond: [
    { label: 'Table tennis',       note: 'nationally certified Level-2 athlete' },
    { label: 'Photography & drone', note: 'street, landscape, aerial' },
    { label: 'Video editing',      note: 'a couple on Bilibili' },
    { label: 'Go',                 note: 'amateur 3-dan' },
  ],
} as const;
