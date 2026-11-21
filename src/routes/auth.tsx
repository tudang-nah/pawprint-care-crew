import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Brand, Field, Notice } from '@/components/care-shared';
import { fetchRole } from '@/lib/queries';

// Đăng nhập Google dùng Supabase Auth trực tiếp. Chỉ bật khi đã cấu hình Google provider trong Supabase (VITE_ENABLE_GOOGLE_LOGIN=true).
const GOOGLE_LOGIN = import.meta.env['VITE_ENABLE_GOOGLE_LOGIN'] === 'true';
export const Route = createFileRoute('/auth')({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => (typeof s['redirect'] === 'string' && s['redirect'].startsWith('/') && !s['redirect'].startsWith('//') ? { redirect: s['redirect'] } : {}),
  head: () => ({ meta: [{ title: 'Đăng nhập · Trạm Chăm Boss' }, { name: 'description', content: 'Đăng nhập hoặc tạo tài khoản để đặt lịch chăm sóc cho bé.' }, { property: 'og:title', content: 'Đăng nhập · Trạm Chăm Boss' }, { property: 'og:description', content: 'Đặt lịch spa, tắm, cắt tỉa cho thú cưng chỉ trong vài chạm.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: AuthPage,
});
function AuthPage() {
  const navigate = useNavigate(); const search = Route.useSearch();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function go() { const role = await fetchRole().catch(() => 'customer'); if (role === 'admin' || role === 'staff') void navigate({ to: '/quan-tri', replace: true }); else if (search.redirect === '/lich-cua-toi') void navigate({ to: '/lich-cua-toi', replace: true }); else void navigate({ to: '/dat-lich', replace: true }); }
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => { if (data.user) void go(); }); const { data } = supabase.auth.onAuthStateChange(e => { if (e === 'SIGNED_IN') void go(); }); return () => data.subscription.unsubscribe(); }, []);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'forgot') { const r = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); if (r.error) throw r.error; setMessage('Đã gửi email đặt lại mật khẩu, bạn kiểm tra hộp thư nhé.'); }
      else if (mode === 'signup') { const r = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth` } }); if (r.error) throw r.error; setMessage('Gần xong rồi! Bạn mở email để xác nhận tài khoản nhé.'); }
      else { const r = await supabase.auth.signInWithPassword({ email, password }); if (r.error) throw r.error; }
    } catch { setError(mode === 'login' ? 'Email hoặc mật khẩu chưa đúng, bạn thử lại nhé.' : 'Không gửi được yêu cầu, bạn thử lại sau ít phút.'); } finally { setBusy(false); }
  }
  async function google() { setBusy(true); setError(''); const r = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth` } }); if (r.error) { console.error(r.error); setError('Không thể đăng nhập, bạn thử lại nhé.'); setBusy(false); } }
  return <div className="hero min-h-screen px-4 py-10"><div className="mx-auto max-w-sm page-enter"><div className="mb-6 flex justify-center"><Brand/></div><div className="panel p-6"><h1 className="page-heading mb-1 text-center text-2xl">{mode === 'login' ? 'Chào mừng trở lại!' : mode === 'signup' ? 'Tạo tài khoản' : 'Quên mật khẩu'}</h1><p className="mb-5 text-center text-sm text-muted-foreground">{mode === 'signup' ? 'Đặt lịch cho bé chỉ trong một phút.' : 'Đăng nhập để đặt lịch hoặc quản lý trạm.'}</p>{error && <Notice>{error}</Notice>}{message && <p role="status" className="mb-4 rounded-2xl bg-success-soft p-3 text-sm text-success">{message}</p>}
    <form onSubmit={submit} className="grid gap-4"><Field label="Email"><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ban@email.com"/></Field>{mode !== 'forgot' && <Field label="Mật khẩu"><input type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự"/></Field>}<Button disabled={busy} type="submit" size="lg" className="h-12 rounded-2xl text-base">{busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : mode === 'signup' ? 'Tạo tài khoản' : 'Gửi email đặt lại'}</Button></form>
    {mode === 'login' && <Button variant="link" className="mt-1 w-full" onClick={() => setMode('forgot')}>Quên mật khẩu?</Button>}
    {mode !== 'forgot' && GOOGLE_LOGIN && <><div className="my-4 text-center text-xs text-muted-foreground">hoặc</div><div className="grid gap-3"><Button variant="outline" className="google-button h-12 rounded-2xl" disabled={busy} onClick={() => void google()}><svg aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Tiếp tục với Google</Button></div></>}
    <Button variant="link" className="mt-3 w-full" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); setError(''); }}>{mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}</Button></div></div></div>;
}
