import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { getAllPosts } from '@/lib/blog';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.blog' });
  return { title: t('title'), description: t('description') };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const posts = getAllPosts(locale);
  const t = await getTranslations({ locale, namespace: 'blog' });

  return (
    <>
      <section className="bg-ajin-black py-20 md:py-32">
        <div className="container-ajin px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">{t('title')}</h1>
          <p className="mt-4 text-lg text-ajin-gray-300 max-w-2xl mx-auto">{t('description')}</p>
        </div>
      </section>

      <Section>
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ajin-gray-400 text-lg">{t('comingSoon')}</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="h-full flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-ajin-gray-400 mb-3">
                    <span className="rounded-full bg-ajin-green/10 text-ajin-green px-3 py-1 font-medium">
                      {post.category}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold mb-2 line-clamp-2">{post.title}</h2>
                  <p className="text-sm text-ajin-gray-400 line-clamp-3 mb-4 flex-1">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-ajin-gray-400 pt-4 border-t border-ajin-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {post.readingTime}
                      </span>
                    </div>
                    <ArrowRight size={14} className="text-ajin-green" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
