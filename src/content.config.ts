import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title:        z.string(),
      hook:         z.string(), // impact hook — index + detail headline
      category:     z.string().default('Project'), // kicker category
      date:         z.coerce.date(),
      role:         z.string().optional(),
      timeline:     z.string().optional(),
      status:       z.string().optional(), // e.g. "Active · paper in prep"
      contribution: z.string(), // required: "what I did alone vs team/mentor"
      summary:      z.string(), // standfirst
      problem:      z.string().optional(), // optional — rich projects go via MDX body
      approach:     z.string().optional(),
      result:       z.string().optional(),
      pullQuote:    z.string().optional(),
      metrics:      z
        .array(z.object({ value: z.string(), label: z.string() }))
        .default([]),
      tech:         z.array(z.string()),
      links: z
        .object({
          github: z.string().url().optional(),
          demo:   z.string().url().optional(),
          paper:  z.string().url().optional(),
        })
        .default({}),
      cover:        image(),
      coverCaption: z.string().optional(),
      gallery:      z
        .array(
          z.object({
            src:     image(),
            caption: z.string(),
            span:    z.enum(['full', 'half']).default('full'),
          }),
        )
        .default([]),
      video:        z.string().url().optional(),
      featured:     z.boolean().default(false),
      draft:        z.boolean().default(false),
    }),
});

const photos = defineCollection({
  loader: glob({ pattern: '**/*.{md,json}', base: './src/content/photos' }),
  schema: ({ image }) =>
    z.object({
      title:    z.string(),
      location: z.string().optional(),
      camera:   z.string().optional(),
      date:     z.coerce.date().optional(),
      order:    z.number().default(0),
      category: z.enum(['nature', 'city']).optional(),
      images:   z.array(
        z.object({
          src:     image(),
          alt:     z.string(),
          caption: z.string().optional(),
          span:    z.enum(['full', 'half']).default('half'),
        }),
      ),
    }),
});

export const collections = { projects, photos };
