/* Site config — personal values from the about/work research.
   Fields marked // TODO are awaiting real values from the user and are
   intentionally NOT real addresses (no placeholder domains, no fabricated identity). */
export const site = {
  name:       'Jayden W.',
  tagline:    'I build AI systems,\nand photograph\nthe world.',
  standfirst:
    "I'm interested in how AI systems plan, where they fail, and how to make them reliable — and a little more human.",
  city:       'Hong Kong',
  school:     'SCIE',
  major:      'Computer Science',
  // TODO: replace with the real email address before launch
  email:      'TODO: real email',
  social: {
    github:    'https://github.com/Jayden23018',
    instagram: '', // TODO: real Instagram handle
    bilibili:  '', // TODO: optional Bilibili handle
  },
  // TODO: replace with a real hero photo + caption
  heroCaption: 'Hong Kong',
} as const;
