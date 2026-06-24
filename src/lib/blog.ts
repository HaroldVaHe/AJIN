import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  author: string;
  readingTime: string;
  locale: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

const contentDir = path.join(process.cwd(), 'src', 'content');

export function getAllPosts(locale: string): BlogPostMeta[] {
  const dir = path.join(contentDir, locale);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

  const posts = files.map((file) => {
    const slug = file.replace('.md', '');
    return getPostMeta(slug, locale);
  });

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostMeta(slug: string, locale: string): BlogPostMeta {
  const filePath = path.join(contentDir, locale, `${slug}.md`);
  const source = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(source);

  const wordCount = source.split(/\s+/g).length;
  const readingTime = `${Math.ceil(wordCount / 200)} min`;

  return {
    slug,
    title: data.title || slug,
    description: data.description || '',
    date: data.date || new Date().toISOString(),
    category: data.category || 'General',
    author: data.author || 'AJIN',
    readingTime,
    locale,
  };
}

export function getPost(slug: string, locale: string): BlogPost {
  const filePath = path.join(contentDir, locale, `${slug}.md`);
  const source = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(source);

  const wordCount = source.split(/\s+/g).length;
  const readingTime = `${Math.ceil(wordCount / 200)} min`;

  return {
    slug,
    title: data.title || slug,
    description: data.description || '',
    date: data.date || new Date().toISOString(),
    category: data.category || 'General',
    author: data.author || 'AJIN',
    readingTime,
    locale,
    content,
  };
}

export function getAllSlugs(locale: string): string[] {
  const dir = path.join(contentDir, locale);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.replace('.md', ''));
}
