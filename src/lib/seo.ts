export const siteUrl = 'https://selambuarada.com';

export const person = {
  name: 'Semih Mutlu',
  email: 'semihmutlu220@gmail.com',
  jobTitle: 'Software Developer',
  knowsAbout: ['Software Development', 'Filmmaking', 'Photography'],
};

export const socialLinks = [
  { href: 'https://github.com/SemihMutlu07', label: 'GitHub' },
  { href: 'https://x.com/semihlaki', label: 'X' },
  { href: 'https://www.linkedin.com/in/semihmutsuz', label: 'LinkedIn' },
  { href: 'https://www.instagram.com/semihmutsuz/', label: 'Instagram' },
  { href: 'https://www.youtube.com/@semihmutsuz', label: 'YouTube' },
  { href: 'https://letterboxd.com/semihmutsuz/', label: 'Letterboxd' },
];

export const personJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${siteUrl}/#person`,
  name: person.name,
  url: siteUrl,
  jobTitle: person.jobTitle,
  email: `mailto:${person.email}`,
  knowsAbout: person.knowsAbout,
  sameAs: socialLinks.map((l) => l.href),
});

export const websiteJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${siteUrl}/#website`,
  url: siteUrl,
  name: person.name,
  author: { '@id': `${siteUrl}/#person` },
});
