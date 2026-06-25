import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Section } from '@/components/ui/Section';
import { getPost, getAllSlugs } from '@/lib/blog';
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
      openGraph: {
        title: post.title,
        description: post.description,
        type: 'article',
        publishedTime: post.date,
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
      <section className="bg-ajin-black py-20 md:py-32">
        <div className="container-ajin px-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-ajin-green hover:text-ajin-green-dark mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            {t('backToBlog')}
          </Link>
          <div className="flex items-center gap-3 text-sm text-ajin-gray-400 mb-4">
            <span className="rounded-full bg-ajin-green/10 text-ajin-green px-3 py-1 font-medium">
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
          <p className="mt-4 text-lg text-ajin-gray-300 max-w-2xl">
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
