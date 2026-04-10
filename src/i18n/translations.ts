export const languages = {
  tr: 'Turkce',
  en: 'English',
  fr: 'Francais',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'tr';

export const ui = {
  tr: {
    // Nav
    'nav.about': 'Hakkımda',
    'nav.blog': 'Yazılar',
    'nav.projects': 'Projeler',
    'nav.films': 'Filmler',
    'nav.contact': 'İletişim',
    'nav.menu': 'Menü',

    // Home
    'home.title': 'Semih Mutlu',
    'home.description': 'Yazılım, film ve merak üzerine kişisel site.',
    'home.subtitle': 'Yazılım geliştirici, meraklı okur, ara sıra filmci.',

    // Blog
    'blog.title': 'Yazılar',
    'blog.description': 'Yazılar ve notlar.',
    'blog.empty': 'Henüz yazı yok.',
    'blog.backLink': 'Tüm yazılar',

    // Films
    'films.title': 'Filmler',
    'films.description': 'Kısa filmler ve video çalışmaları.',
    'films.empty': 'Henüz film yok.',
    'films.backLink': 'Tüm filmler',
    'films.about': 'Hakkında',
    'films.crew': 'Ekip',
    'films.bts': 'Kamera Arkası',

    // Projects
    'projects.title': 'Projeler',
    'projects.description': 'Geliştirdiğim ve yayınladığım yazılımlar.',
    'projects.empty': 'Henüz proje yok.',

    // Contact
    'contact.title': 'İletişim',
    'contact.description': 'Bana ulaşın.',
    'contact.intro':
      'Bir şey sormak, birlikte çalışmak ya da sadece merhaba demek istiyorsan:',
    'contact.copied': 'Kopyalandı',
    'contact.findMe': 'Beni bulabileceğin yerler',

    // About
    'about.title': 'Hakkımda',
    'about.description': 'Semih Mutlu — yazılım geliştirici, filmci.',

    // 404
    '404.title': 'Sayfa Bulunamadı',
    '404.description': 'Aradığınız sayfa bulunamadı.',
    '404.message': 'Aradığın sayfa bulunamadı.',
    '404.backHome': 'Ana sayfaya dön',

    // RSS
    'rss.title': 'Semih Mutlu',
    'rss.description': 'Teknoloji, bilim ve hayat üzerine yazılar.',

    // Footer
    'footer.copyright': 'Semih Mutlu',
  },

  en: {
    'nav.about': 'About',
    'nav.blog': 'Blog',
    'nav.projects': 'Projects',
    'nav.films': 'Films',
    'nav.contact': 'Contact',
    'nav.menu': 'Menu',

    'home.title': 'Semih Mutlu',
    'home.description':
      'Personal site about software, film, and curiosity.',
    'home.subtitle':
      'Software developer, curious reader, occasional filmmaker.',

    'blog.title': 'Blog',
    'blog.description': 'Posts and notes.',
    'blog.empty': 'No posts yet.',
    'blog.backLink': 'All posts',

    'films.title': 'Films',
    'films.description': 'Short films and video works.',
    'films.empty': 'No films yet.',
    'films.backLink': 'All films',
    'films.about': 'About',
    'films.crew': 'Crew',
    'films.bts': 'Behind the Scenes',

    'projects.title': 'Projects',
    'projects.description': 'Software I have built and published.',
    'projects.empty': 'No projects yet.',

    'contact.title': 'Contact',
    'contact.description': 'Get in touch.',
    'contact.intro':
      'Want to ask something, collaborate, or just say hello:',
    'contact.copied': 'Copied',
    'contact.findMe': 'Where to find me',

    'about.title': 'About',
    'about.description': 'Semih Mutlu — software developer, filmmaker.',

    '404.title': 'Page Not Found',
    '404.description': 'The page you are looking for could not be found.',
    '404.message': 'The page you are looking for could not be found.',
    '404.backHome': 'Back to home',

    'rss.title': 'Semih Mutlu',
    'rss.description': 'Posts about technology, science, and life.',

    'footer.copyright': 'Semih Mutlu',
  },

  fr: {
    'nav.about': 'A propos',
    'nav.blog': 'Articles',
    'nav.projects': 'Projets',
    'nav.films': 'Films',
    'nav.contact': 'Contact',
    'nav.menu': 'Menu',

    'home.title': 'Semih Mutlu',
    'home.description':
      'Site personnel sur le logiciel, le cinema et la curiosite.',
    'home.subtitle':
      'Developpeur, lecteur curieux, cineaste a ses heures.',

    'blog.title': 'Articles',
    'blog.description': 'Articles et notes.',
    'blog.empty': "Pas encore d'articles.",
    'blog.backLink': 'Tous les articles',

    'films.title': 'Films',
    'films.description': 'Courts metrages et travaux video.',
    'films.empty': 'Pas encore de films.',
    'films.backLink': 'Tous les films',
    'films.about': 'A propos',
    'films.crew': 'Equipe',
    'films.bts': 'Coulisses',

    'projects.title': 'Projets',
    'projects.description': 'Logiciels que j\'ai developpes et publies.',
    'projects.empty': 'Pas encore de projets.',

    'contact.title': 'Contact',
    'contact.description': 'Me contacter.',
    'contact.intro':
      'Une question, une collaboration ou juste un bonjour :',
    'contact.copied': 'Copie',
    'contact.findMe': 'Ou me trouver',

    'about.title': 'A propos',
    'about.description': 'Semih Mutlu — developpeur, cineaste.',

    '404.title': 'Page introuvable',
    '404.description': 'La page que vous recherchez est introuvable.',
    '404.message': 'La page que vous recherchez est introuvable.',
    '404.backHome': "Retour a l'accueil",

    'rss.title': 'Semih Mutlu',
    'rss.description':
      'Articles sur la technologie, la science et la vie.',

    'footer.copyright': 'Semih Mutlu',
  },
} as const;
