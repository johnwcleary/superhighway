// Site-wide facts shared by the components, meta tags and JSON-LD.

export const site = {
  name: 'superhighway',
  url: 'https://superhighway.fm',
  description: 'music consulting, music for sync, and music strategy by John Cleary.',
  person: 'John Cleary',
  jobTitle: 'Music consultant',
  // Non-breaking space and hyphen so the number never wraps mid-way.
  phone: { display: '(516)\u00a0707\u20119679', href: 'tel:+15167079679' },
  email: 'john@superhighway.fm',
};

export const social = [
  { label: 'linkedIn', href: 'https://www.linkedin.com/in/john-cleary-13163b83/' },
  { label: 'instagram', href: 'https://www.instagram.com/johnwcleary/' },
];

export interface Project {
  title: string;
  /** Brand or label the work was made with. */
  client: string;
  year?: string;
  /** Video link; omitted while a project has none yet. */
  href?: string;
  summary: string;
  results?: string[];
}

export const portfolio: Project[] = [
  {
    title: 'Trap Symphony',
    client: 'Audiomack',
    href: 'https://www.youtube.com/watch?v=zOdKS_ayMyM',
    summary:
      'A viral series where rap artists perform with a live orchestra, here Trippie Redd with “Wish.” I developed & executive-produce it, & own all of its music & audio: arrangement, contracting, booking, conducting & mixing.',
    results: ['Hundreds of millions of impressions across channels', 'Running for ten-plus years'],
  },
  {
    title: 'The Bridge',
    client: 'Epidemic Sound',
    year: '2024–25',
    href: 'https://www.youtube.com/watch?v=U_ZaaFEkDVc&t=43s',
    summary:
      'Johnny Marr & Richie Hawtin mentor emerging artists from Epidemic Sound’s roster, told across press, TikTok, YouTube & the Epidemic Sound app.',
    results: [
      '17M+ impressions',
      '7M+ organic views on a single TikTok',
      'Press in Music Business Worldwide, Music Week & Music Ally',
      'Highsnobiety media partnership',
    ],
  },
  {
    title: 'Extra Version',
    client: 'Epidemic Sound',
    href: 'https://www.youtube.com/watch?v=PbHdQoyYNRI',
    summary:
      'A monthly remix series: Honey Dijon, Switch, LP Giobbi & more remix the Epidemic Sound catalog, released for creators to sync. Same song, brand-new life.',
    results: [
      '100M+ views on creator videos',
      '+2,600% player downloads vs. benchmark',
      'Coverage in Billboard',
    ],
  },
  {
    title: 'CAITY',
    client: 'Feature film',
    year: '2026',
    href: 'https://en.wikipedia.org/wiki/Caity',
    summary:
      'Lindsay Calleran’s debut feature: a 16-year-old runs her family’s haunted house while handling a new crush & her father’s sobriety. Starring Chiara Aurelia & Morgan Spector.',
    results: ['World premiere at the Tribeca Festival, June 2026', 'Selected for a primetime Tribeca slot'],
  },
];
