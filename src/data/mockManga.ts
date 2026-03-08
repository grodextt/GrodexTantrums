export type MangaType = 'Manhwa' | 'Manga' | 'Manhua';
export type MangaStatus = 'Ongoing' | 'Completed' | 'Hiatus' | 'Season End' | 'Cancelled';

export interface Chapter {
  id: number;
  number: number;
  title: string;
  date: string;
  pages?: string[];
  premium?: boolean;
}

export interface Comment {
  id: number;
  user: string;
  avatar: string;
  text: string;
  date: string;
  likes: number;
}

export interface Manga {
  id: string;
  slug: string;
  title: string;
  altTitles?: string[];
  cover: string;
  banner?: string;
  description: string;
  type: MangaType;
  status: MangaStatus;
  genres: string[];
  rating: number;
  views: number;
  bookmarks: number;
  author: string;
  artist: string;
  released: number;
  chapters: Chapter[];
  comments: Comment[];
  featured?: boolean;
  trending?: boolean;
  pinned?: boolean;
}

export const mockManga: Manga[] = [
  {
    id: '1',
    slug: 'shadow-monarch',
    title: 'Shadow Monarch',
    altTitles: ['그림자 군주', 'Shadow Lord'],
    cover: '/manga/cover1.jpg',
    banner: '/manga/cover1.jpg',
    description: 'In a world where hunters fight monsters from dimensional gates, the weakest hunter awakens a mysterious power. As he grows stronger, he discovers the truth behind the gates and the ancient war between light and shadow. His journey from the weakest to the strongest begins now.',
    type: 'Manhwa',
    status: 'Ongoing',
    genres: ['Action', 'Fantasy', 'Adventure'],
    rating: 4.8,
    views: 2500000,
    bookmarks: 185000,
    author: 'Park Jin',
    artist: 'Kim Soo',
    released: 2023,
    featured: true,
    trending: true,
    pinned: true,
    chapters: Array.from({ length: 45 }, (_, i) => ({
      id: i + 1,
      number: 45 - i,
      title: `Chapter ${45 - i}`,
      date: new Date(2026, 2, 8 - i).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      premium: i < 2,
    })),
    comments: [
      { id: 1, user: 'MangaFan99', avatar: '', text: 'This series is absolutely amazing! The art keeps getting better.', date: '2 hours ago', likes: 24 },
      { id: 2, user: 'ReaderX', avatar: '', text: 'Chapter 45 was fire! Can\'t wait for the next one.', date: '5 hours ago', likes: 18 },
      { id: 3, user: 'OtakuKing', avatar: '', text: 'The MC development is top tier. Best manhwa this year.', date: '1 day ago', likes: 42 },
    ],
  },
  {
    id: '2',
    slug: 'arcane-witch',
    title: 'The Arcane Witch',
    altTitles: ['魔法の魔女伝説', 'The Arcane Sorceress'],
    cover: '/manga/cover2.jpg',
    banner: '/manga/cover2.jpg',
    description: 'A young witch discovers she holds the key to an ancient magic that could reshape the world. Pursued by dark forces and aided by unlikely allies, she must master her powers before it\'s too late.',
    type: 'Manga',
    status: 'Ongoing',
    genres: ['Fantasy', 'Magic', 'Drama'],
    rating: 4.6,
    views: 1800000,
    bookmarks: 120000,
    author: 'Yuki Tanaka',
    artist: 'Yuki Tanaka',
    released: 2024,
    featured: true,
    trending: true,
    chapters: Array.from({ length: 32 }, (_, i) => ({
      id: i + 1,
      number: 32 - i,
      title: `Chapter ${32 - i}`,
      date: new Date(2026, 2, 7 - i).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      premium: i < 2,
    })),
    comments: [
      { id: 1, user: 'WitchLover', avatar: '', text: 'The magic system in this is so well thought out!', date: '3 hours ago', likes: 15 },
    ],
  },
  {
    id: '3',
    slug: 'flame-fist',
    title: 'Flame Fist Chronicles',
    altTitles: ['화염권 연대기', 'Flame Fist'],
    cover: '/manga/cover3.jpg',
    banner: '/manga/cover3.jpg',
    description: 'In the underground martial arts world, a young fighter with the legendary flame fist technique rises through the ranks. Each battle pushes him closer to discovering the truth about his family\'s legacy.',
    type: 'Manhwa',
    status: 'Ongoing',
    genres: ['Action', 'Martial Arts', 'Sports'],
    rating: 4.5,
    views: 1200000,
    bookmarks: 90000,
    author: 'Lee Dong',
    artist: 'Choi Min',
    released: 2024,
    trending: true,
    pinned: true,
    chapters: Array.from({ length: 28 }, (_, i) => ({
      id: i + 1,
      number: 28 - i,
      title: `Chapter ${28 - i}`,
      date: new Date(2026, 2, 6 - i).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      premium: i < 2,
    })),
    comments: [],
  },
  {
    id: '4',
    slug: 'neon-knight',
    title: 'Neon Knight',
    altTitles: ['네온 기사', 'Cybernetic Knight'],
    cover: '/manga/cover4.jpg',
    banner: '/manga/cover4.jpg',
    description: 'In a cyberpunk metropolis where corporations rule, a rogue cyborg knight fights to protect the innocent. With each mission, the lines between human and machine blur further.',
    type: 'Manhwa',
    status: 'Ongoing',
    genres: ['Sci-Fi', 'Action', 'Cyberpunk'],
    rating: 4.7,
    views: 2100000,
    bookmarks: 155000,
    author: 'Han Ji-yeon',
    artist: 'Park Seo',
    released: 2023,
    featured: true,
    trending: true,
    chapters: Array.from({ length: 52 }, (_, i) => ({
      id: i + 1,
      number: 52 - i,
      title: `Chapter ${52 - i}`,
      date: new Date(2026, 2, 8 - i).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      premium: i < 2,
    })),
    comments: [
      { id: 1, user: 'CyberFan', avatar: '', text: 'Best cyberpunk manhwa out there!', date: '1 hour ago', likes: 33 },
    ],
  },
  {
    id: '5',
    slug: 'cherry-blossom-love',
    title: 'Cherry Blossom Love',
    altTitles: ['桜の恋', 'Sakura Romance'],
    cover: '/manga/cover5.jpg',
    banner: '/manga/cover5.jpg',
    description: 'A heartwarming romance between two childhood friends who reunite under the cherry blossoms. As seasons change, their feelings bloom into something deeper than friendship.',
    type: 'Manga',
    status: 'Completed',
    genres: ['Romance', 'Slice of Life', 'Drama'],
    rating: 4.4,
    views: 950000,
    bookmarks: 78000,
    author: 'Sakura Hana',
    artist: 'Sakura Hana',
    released: 2024,
    chapters: Array.from({ length: 24 }, (_, i) => ({
      id: i + 1,
      number: 24 - i,
      title: `Chapter ${24 - i}`,
      date: new Date(2026, 1, 20 - i).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      premium: i < 2,
    })),
    comments: [],
  },
  {
    id: '6',
    slug: 'phantom-corridor',
    title: 'Phantom Corridor',
    altTitles: ['유령 복도', 'Ghost Corridor'],
    cover: '/manga/cover6.jpg',
    banner: '/manga/cover6.jpg',
    description: 'A group of students discover a hidden corridor in their school that leads to a nightmarish dimension. To escape, they must confront their deepest fears and survive the horrors within.',
    type: 'Manhwa',
    status: 'Ongoing',
    genres: ['Horror', 'Thriller', 'Mystery'],
    rating: 4.3,
    views: 780000,
    bookmarks: 56000,
    author: 'Jung Hee',
    artist: 'Kwon Tae',
    released: 2025,
    trending: true,
    chapters: Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      number: 15 - i,
      title: `Chapter ${15 - i}`,
      date: new Date(2026, 2, 5 - i).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      premium: i < 2,
    })),
    comments: [],
  },
  {
    id: '7',
    slug: 'dragon-slayers',
    title: 'Dragon Slayers',
    altTitles: ['屠龙勇士', 'Dragon Hunters'],
    cover: '/manga/cover7.jpg',
    banner: '/manga/cover7.jpg',
    description: 'Four heroes from different lands unite to face the ancient dragon that threatens to destroy the world. An epic fantasy tale of courage, sacrifice, and the bonds forged in battle.',
    type: 'Manhua',
    status: 'Ongoing',
    genres: ['Fantasy', 'Action', 'Adventure'],
    rating: 4.5,
    views: 1350000,
    bookmarks: 98000,
    author: 'Wei Long',
    artist: 'Zhang Fei',
    released: 2024,
    pinned: true,
    chapters: Array.from({ length: 38 }, (_, i) => ({
      id: i + 1,
      number: 38 - i,
      title: `Chapter ${38 - i}`,
      date: new Date(2026, 2, 7 - i).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      premium: i < 2,
    })),
    comments: [],
  },
  {
    id: '8',
    slug: 'realm-walker',
    title: 'Realm Walker',
    altTitles: ['차원 보행자', 'Dimension Walker'],
    cover: '/manga/cover8.jpg',
    banner: '/manga/cover8.jpg',
    description: 'Summoned to another world through a mysterious portal, a young man discovers he has the unique ability to walk between realms. He must use this power to prevent a catastrophic collision of worlds.',
    type: 'Manhwa',
    status: 'Ongoing',
    genres: ['Isekai', 'Fantasy', 'Action'],
    rating: 4.6,
    views: 1650000,
    bookmarks: 125000,
    author: 'Kim Tae-ho',
    artist: 'Shin Yu',
    released: 2024,
    featured: true,
    trending: true,
    chapters: Array.from({ length: 35 }, (_, i) => ({
      id: i + 1,
      number: 35 - i,
      title: `Chapter ${35 - i}`,
      date: new Date(2026, 2, 8 - i).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      premium: i < 2,
    })),
    comments: [
      { id: 1, user: 'IsekaiLord', avatar: '', text: 'Unique take on the isekai genre!', date: '4 hours ago', likes: 21 },
    ],
  },
];

export const allGenres = [...new Set(mockManga.flatMap(m => m.genres))].sort();
export const allTypes: MangaType[] = ['Manhwa', 'Manga', 'Manhua'];

export function getMangaBySlug(slug: string): Manga | undefined {
  return mockManga.find(m => m.slug === slug);
}

export function getFeaturedManga(): Manga[] {
  return mockManga.filter(m => m.featured);
}

export function getTrendingManga(): Manga[] {
  return mockManga.filter(m => m.trending);
}

export function getPinnedManga(): Manga[] {
  return mockManga.filter(m => m.pinned);
}

export function formatViews(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
