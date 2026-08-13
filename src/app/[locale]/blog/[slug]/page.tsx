import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Section } from '@/components/ui/Section';
import { getPost, getAllSlugs } from '@/lib/blog';
import { SITE_URL, OG_IMAGE_URL, SITE_NAME, buildAlternates } from '@/lib/site';
import JsonLd from '@/components/ui/JsonLd';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export async function generateStaticParams() {
  const esSlugs = getAllSlugs('es').map((slug) => ({ locale: 'es', slug }));
  const enSlugs = getAllSlugs('en').map((slug) => ({ locale: 'en', slug }));
  return [...esSlugs, ...enSlugs];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  try {
    const post = getPost(slug, locale);
    return {
      title: post.title,
      description: post.description,
      alternates: buildAlternates(locale, `/blog/${slug}`),
      openGraph: {
        title: post.title,
        description: post.description,
        type: 'article',
        publishedTime: post.date,
        authors: [post.author],
        images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: post.title }],
      },
    };
  } catch {
    return { title: t('notFound') };
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });

  let post;
  try {
    post = getPost(slug, locale);
  } catch {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          author: { '@type': 'Person', name: post.author },
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/icons/favicon.png`,
          },
          image: OG_IMAGE_URL,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${SITE_URL}/${locale}/blog/${post.slug}`,
          },
        }}
      />
      <section className="bg-ajin-primary py-20 md:py-32">
        <div className="container-ajin px-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-ajin-accent hover:text-ajin-accent-dark mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            {t('backToBlog')}
          </Link>
          <div className="flex items-center gap-3 text-sm text-ajin-gray-400 mb-4">
            <span className="rounded-full bg-ajin-accent/10 text-ajin-accent px-3 py-1 font-medium">
              {post.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {post.readingTime}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl max-w-3xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-ajin-gray-400 max-w-2xl">
            {post.description}
          </p>
        </div>
      </section>

      <Section>
        <article className="prose prose-lg max-w-3xl mx-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </article>
      </Section>
    </>
  );
}
