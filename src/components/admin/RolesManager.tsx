'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, Loader2, Lock, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { PERMISSIONS, ROLES, type Permission, type Role } from '@/lib/permission-catalog';

interface RolesManagerProps {
  users: Array<{ email: string; role: Role; created_at: string }>;
  permissionsByRole: Record<Role, Permission[]>;
  currentEmail: string;
}

const input =
  'w-full rounded-xl border border-ajin-border px-3 py-2 text-sm focus:border-ajin-accent focus:outline-none';

export default function RolesManager({
  users,
  permissionsByRole,
  currentEmail,
}: RolesManagerProps) {
  const router = useRouter();
  const t = useTranslations('admin.roles');

  const [draft, setDraft] = useState<Record<Role, Permission[]>>({
    admin: [...permissionsByRole.admin],
    gestor: [...permissionsByRole.gestor],
  });
  const [savingRole, setSavingRole] = useState<Role | null>(null);
  const [savedRole, setSavedRole] = useState<Role | null>(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('gestor');
  const [adding, setAdding] = useState(false);
  const [busyEmail, setBusyEmail] = useState('');
  const [error, setError] = useState('');

  const toggle = (target: Role, permission: Permission) => {
    // El rol admin conserva siempre roles.manage para no perder el panel.
    if (target === 'admin' && permission === 'roles.manage') return;
    setSavedRole(null);
    setDraft((prev) => {
      const current = prev[target];
      return {
        ...prev,
        [target]: current.includes(permission)
          ? current.filter((item) => item !== permission)
          : [...current, permission],
      };
    });
  };

  const saveRole = async (target: Role) => {
    setSavingRole(target);
    setError('');
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: target, permissions: draft[target] }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? 'save-failed');
      setSavedRole(target);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(t('saveError'));
    } finally {
      setSavingRole(null);
    }
  };

  const assign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    setError('');
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? 'assign-failed');
      setEmail('');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(t('assignError'));
    } finally {
      setAdding(false);
    }
  };

  const changeUserRole = async (userEmail: string, nextRole: Role) => {
    setBusyEmail(userEmail);
    setError('');
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, role: nextRole }),
      });
      if (!response.ok) throw new Error('assign-failed');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(t('assignError'));
    } finally {
      setBusyEmail('');
    }
  };

  const removeUser = async (userEmail: string) => {
    if (userEmail === currentEmail.toLowerCase()) return;
    if (!window.confirm(t('removeConfirm', { email: userEmail }))) return;
    setBusyEmail(userEmail);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/roles?email=${encodeURIComponent(userEmail)}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('remove-failed');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(t('removeError'));
    } finally {
      setBusyEmail('');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} /> {error}
        </p>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        {ROLES.map((target) => (
          <div key={target} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ajin-primary">
                <ShieldCheck size={18} /> {t(target)}
              </h2>
              {savedRole === target && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 size={14} /> {t('saved')}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-ajin-gray-400">
              {target === 'admin' ? t('adminHint') : t('gestorHint')}
            </p>

            <div className="mt-4 space-y-2">
              {PERMISSIONS.map((permission) => {
                const locked = target === 'admin' && permission === 'roles.manage';
                const checked = draft[target].includes(permission);
                return (
                  <label
                    key={permission}
                    className={`flex items-start gap-2 rounded-xl border border-ajin-border px-3 py-2 text-sm ${
                      locked ? 'bg-ajin-surface/60' : 'cursor-pointer hover:bg-ajin-surface/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={checked}
                      disabled={locked}
                      onChange={() => toggle(target, permission)}
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 font-medium text-ajin-text">
                        {t(`permissions.${permission.replace('.', '_')}`)}
                        {locked && <Lock size={12} className="text-ajin-gray-400" />}
                      </span>
                      <span className="block text-xs text-ajin-gray-400">
                        {t(`permissions.${permission.replace('.', '_')}Desc`)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-4">
              <Button
                type="button"
                size="sm"
                onClick={() => void saveRole(target)}
                disabled={savingRole !== null}
              >
                {savingRole === target ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> {t('saving')}
                  </>
                ) : (
                  t('save')
                )}
              </Button>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ajin-primary">{t('usersTitle')}</h2>
        <p className="mt-1 text-sm text-ajin-gray-400">{t('usersHint')}</p>

        <form onSubmit={assign} className="mt-4 flex flex-wrap items-end gap-2">
          <label className="min-w-56 flex-1 text-xs">
            <span className="mb-1 block font-semibold text-ajin-text">{t('emailLabel')}</span>
            <input
              type="email"
              className={input}
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={160}
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-semibold text-ajin-text">{t('roleLabel')}</span>
            <select
              className={input}
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
            >
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {t(item)}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" size="sm" disabled={adding}>
            {adding ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {t('adding')}
              </>
            ) : (
              <>
                <Plus size={16} /> {t('addUser')}
              </>
            )}
          </Button>
        </form>

        <div className="mt-5 overflow-x-auto">
          {users.length === 0 ? (
            <p className="text-sm text-ajin-gray-400">{t('empty')}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ajin-border text-xs uppercase tracking-wide text-ajin-gray-400">
                  <th className="px-2 py-2 font-semibold">{t('emailLabel')}</th>
                  <th className="px-2 py-2 font-semibold">{t('roleLabel')}</th>
                  <th className="px-2 py-2 text-right font-semibold">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.email === currentEmail.toLowerCase();
                  return (
                  <tr key={user.email} className="border-b border-ajin-border last:border-0">
                    <td className="px-2 py-2 text-ajin-text">
                      {user.email}
                      {isSelf && (
                        <span className="ml-2 rounded-full bg-ajin-surface px-2 py-0.5 text-[11px] text-ajin-gray-400">
                          {t('you')}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <select
                        className={`${input} max-w-40`}
                        value={user.role}
                        disabled={busyEmail === user.email || isSelf}
                        onChange={(event) =>
                          void changeUserRole(user.email, event.target.value as Role)
                        }
                      >
                        {ROLES.map((item) => (
                          <option key={item} value={item}>
                            {t(item)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => void removeUser(user.email)}
                        disabled={busyEmail === user.email || isSelf}
                        className="rounded-lg border border-ajin-border p-2 text-ajin-gray-300 transition-colors hover:border-red-400 hover:text-red-500 disabled:opacity-40"
                        aria-label={t('remove')}
                        title={t('remove')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <p className="text-xs text-ajin-gray-400">{t('envNote')}</p>
    </div>
  );
}
