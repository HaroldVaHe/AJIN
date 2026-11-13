'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertTriangle,
  Brain,
  Database,
  ExternalLink,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import type { KnowledgeSource } from '@/lib/knowledge/answer';
import type { KnowledgeStatus } from '@/lib/knowledge/status';

interface KnowledgeChatProps {
  status: KnowledgeStatus;
  canSync: boolean;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  error?: boolean;
  insufficient?: boolean;
  cached?: boolean;
  cachedSimilarity?: number;
  sources?: KnowledgeSource[];
}

let nextId = 1;

export default function KnowledgeChat({ status: initialStatus, canSync }: KnowledgeChatProps) {
  const t = useTranslations('admin.cerebro');
  const locale = useLocale();

  const [status, setStatus] = useState(initialStatus);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const ready = status.configured && !status.needsSetup && status.indexed;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const refreshStatus = async () => {
    try {
      const response = await fetch('/api/admin/cerebro', { cache: 'no-store' });
      const data = (await response.json()) as { success?: boolean; status?: KnowledgeStatus };
      if (data.success && data.status) setStatus(data.status);
    } catch {
      // Silencioso: el estado se reintenta en la próxima acción.
    }
  };

  const sync = async () => {
    setSyncing(true);
    setSyncNotice('');
    try {
      const response = await fetch('/api/admin/cerebro/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = (await response.json().catch(() => null)) as { success?: boolean } | null;
      if (!response.ok || !data?.success) {
        setSyncNotice(t('syncError'));
        return;
      }
      await refreshStatus();
      setSyncNotice(t('syncDone'));
    } catch {
      setSyncNotice(t('syncError'));
    } finally {
      setSyncing(false);
    }
  };

  const ask = async (raw?: string) => {
    const question = (raw ?? input).trim();
    if (question.length < 3) {
      setSyncNotice(t('questionTooShort'));
      return;
    }

    setMessages((current) => [...current, { id: nextId++, role: 'user', text: question }]);
    setInput('');
    setSending(true);
    setSyncNotice('');

    try {
      const response = await fetch('/api/admin/cerebro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, locale }),
      });
      const data = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            code?: string;
            answer?: string;
            sources?: KnowledgeSource[];
            cached?: boolean;
            insufficient?: boolean;
            cachedSimilarity?: number;
          }
        | null;

      if (!response.ok || !data?.success) {
        const message =
          data?.code === 'not_configured'
            ? t('notConfiguredHint')
            : data?.code === 'needs_setup'
              ? t('needsSetupHint')
              : data?.code === 'rate_limited'
                ? t('rateLimited')
                : data?.code === 'ai_error'
                  ? t('aiError')
                  : t('requestFailed');
        setMessages((current) => [
          ...current,
          { id: nextId++, role: 'assistant', text: message, error: true },
        ]);
        return;
      }

      const insufficient = Boolean(data.insufficient) || !data.answer;
      setMessages((current) => [
        ...current,
        {
          id: nextId++,
          role: 'assistant',
          text: data.answer || t('insufficient'),
          insufficient,
          cached: Boolean(data.cached),
          cachedSimilarity: data.cachedSimilarity,
          sources: data.sources ?? [],
        },
      ]);
      if (data.cached) void refreshStatus();
    } catch {
      setMessages((current) => [
        ...current,
        { id: nextId++, role: 'assistant', text: t('requestFailed'), error: true },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!sending && ready) void ask();
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-ajin-border bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-ajin-accent-dark" />
            <h2 className="font-semibold text-ajin-primary">{t('statusTitle')}</h2>
            {status.configured && status.provider && (
              <span className="rounded-full bg-ajin-surface px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ajin-gray-400">
                {status.provider}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canSync && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={sync}
                disabled={syncing || !status.configured || status.needsSetup}
              >
                {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                {syncing ? t('syncing') : t('sync')}
              </Button>
            )}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-ajin-gray-300 hover:bg-ajin-surface"
              >
                <Trash2 size={14} /> {t('clear')}
              </button>
            )}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-ajin-gray-400">
              {t('statusDocuments')}
            </dt>
            <dd className="font-semibold text-ajin-primary">{status.documents}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-ajin-gray-400">
              {t('statusChunks')}
            </dt>
            <dd className="font-semibold text-ajin-primary">{status.chunks}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-ajin-gray-400">
              {t('statusCache')}
            </dt>
            <dd className="font-semibold text-ajin-primary">{status.cacheEntries}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-ajin-gray-400">
              {t('lastSync')}
            </dt>
            <dd className="font-semibold text-ajin-primary">
              {status.lastSync
                ? new Date(status.lastSync.at).toLocaleString(locale, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })
                : t('never')}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-[11px] text-ajin-gray-400">
          {status.includePii ? t('piiOn') : t('piiOff')}
          {status.lastSync?.error ? ` · ${status.lastSync.error.slice(0, 160)}` : ''}
          {syncNotice ? ` · ${syncNotice}` : ''}
        </p>
      </section>

      {!status.configured && (
        <Banner tone="warning" title={t('notConfigured')} text={t('notConfiguredHint')} />
      )}
      {status.configured && status.needsSetup && (
        <Banner tone="error" title={t('needsSetup')} text={t('needsSetupHint')} />
      )}
      {status.configured && !status.needsSetup && !status.indexed && (
        <Banner
          tone="info"
          title={t('notIndexed')}
          text={canSync ? t('notIndexedHint') : t('askAdminSync')}
        />
      )}

      <section className="flex min-h-[26rem] flex-col rounded-2xl border border-ajin-border bg-white">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ajin-surface text-ajin-accent-dark">
                <Brain size={22} />
              </span>
              <h3 className="font-serif text-xl font-semibold text-ajin-primary">
                {t('emptyTitle')}
              </h3>
              <p className="mt-1 max-w-md text-sm text-ajin-gray-400">{t('emptyDesc')}</p>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-ajin-gray-400">
                {t('suggestionsTitle')}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {(['one', 'two', 'three', 'four'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    disabled={!ready || sending}
                    onClick={() => ask(t(`suggestions.${key}`))}
                    className="rounded-full border border-ajin-border px-3 py-1.5 text-xs text-ajin-text transition-colors hover:border-ajin-accent hover:bg-ajin-surface disabled:opacity-50"
                  >
                    {t(`suggestions.${key}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className={
                  message.role === 'user'
                    ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-ajin-primary px-4 py-3 text-sm text-white'
                    : message.error
                      ? 'max-w-[92%] rounded-2xl rounded-bl-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
                      : 'max-w-[92%] rounded-2xl rounded-bl-sm border border-ajin-border bg-ajin-bg px-4 py-3 text-sm text-ajin-text'
                }
              >
                {message.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                ) : (
                  <>
                    <div className="prose prose-sm max-w-none prose-headings:font-serif prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ajin-gray-400">
                      {message.cached && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ajin-surface px-2 py-0.5 font-semibold text-ajin-accent-dark">
                          <Zap size={11} /> {t('cached')}
                          {typeof message.cachedSimilarity === 'number'
                            ? ` · ${Math.round(message.cachedSimilarity * 100)}%`
                            : ''}
                        </span>
                      )}
                      {message.insufficient && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                          <AlertTriangle size={11} /> {t('insufficient')}
                        </span>
                      )}
                    </div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 border-t border-ajin-border/70 pt-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ajin-gray-400">
                          {t('sources')}
                        </p>
                        <ul className="mt-1.5 space-y-1.5">
                          {message.sources.map((source) => (
                            <li
                              key={`${source.n}-${source.sourceType}-${source.sourceId}`}
                              className="flex items-start gap-2 rounded-lg bg-white/70 px-2 py-1.5"
                            >
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ajin-primary text-[10px] font-bold text-white">
                                {source.n}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-ajin-primary">
                                  {source.title}
                                </p>
                                <p className="text-[11px] text-ajin-gray-400">
                                  {t(`sourceTypes.${source.sourceType}`)}
                                  {source.similarity > 0
                                    ? ` · ${Math.round(source.similarity * 100)}%`
                                    : ''}
                                </p>
                              </div>
                              {source.url && (
                                <Link
                                  href={source.url}
                                  className="ml-auto inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-ajin-accent-dark hover:underline"
                                >
                                  {t('viewSource')} <ExternalLink size={11} />
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-ajin-border bg-ajin-bg px-4 py-3 text-sm text-ajin-gray-400">
                <Loader2 size={15} className="animate-spin" /> {t('thinking')}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!sending && ready) void ask();
          }}
          className="border-t border-ajin-border p-3 sm:p-4"
        >
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              maxLength={500}
              disabled={!ready || sending}
              placeholder={ready ? t('placeholder') : t('notIndexedHint')}
              className="min-h-[3rem] w-full resize-y rounded-xl border border-ajin-border px-3 py-2 text-sm focus:border-ajin-accent focus:outline-none disabled:bg-ajin-surface"
              aria-label={t('placeholder')}
            />
            <Button type="submit" disabled={!ready || sending || input.trim().length < 3}>
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span className="hidden sm:inline">{t('send')}</span>
            </Button>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ajin-gray-400">
            <Sparkles size={11} /> {t('disclaimer')}
          </p>
        </form>
      </section>
    </div>
  );
}

function Banner({
  tone,
  title,
  text,
}: {
  tone: 'info' | 'warning' | 'error';
  title: string;
  text: string;
}) {
  const styles =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-ajin-border bg-ajin-surface text-ajin-text';
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs opacity-80">{text}</p>
      </div>
    </div>
  );
}
