import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { LovableMark } from '@lovable.dev/cloud-auth-js/react';
import { Button } from '@/components/ui/button';
import { Field, Notice } from './care-shared';
import { PawPrint, LogOut, LockKeyhole, Mail } from 'lucide-react';
import { saveCare } from '@/lib/care.functions';
import { careSchema } from '@/lib/care-validation';
import type { CareData } from '@/lib/pet-care';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';
const CareContext = createContext<{ data: CareData; save: (next: CareData) => Promise<boolean>; ready: boolean; storageError: string; pending: boolean } | null>(null);
export const accessOptions = queryOptions({ queryKey: ['care-access'], queryFn: async () => { const { data, error } = await supabase.rpc('care_has_access'); if (error) throw error; return data; }, staleTime: 0 });
export const stateOptions = queryOptions({ queryKey: ['care-state'], queryFn: async () => { const { data, error } = await supabase.rpc('care_read'); if (error) throw error; const row = data?.[0]; if (!row) throw new Error('Không thể đọc dữ liệu nhóm.'); return { data: careSchema.parse(row.data), version: row.version }; }, staleTime: 0, refetchInterval: 15000 });
export function SharedCareProvider({ children }: { children: ReactNode }) {
  const { data: state } = useSuspenseQuery(stateOptions);
  const queryClient = useQueryClient();
  const saveFn = useServerFn(saveCare);
  const [storageError, setError] = useState('');
  const mutation = useMutation({ mutationFn: (next: CareData) => saveFn({ data: { data: next, version: state.version } }), onSuccess: next => { queryClient.setQueryData(['care-state'], next); setError(''); }, onError: error => { setError(error.message); toast.error(error.message); void queryClient.invalidateQueries({ queryKey: ['care-state'] }); } });
  async function save(next: CareData) { try { await mutation.mutateAsync(next); return true; } catch { return false; } }
  return <CareContext.Provider value={{ data: state.data, save, ready: true, storageError, pending: mutation.isPending }}>{children}</CareContext.Provider>;
}
export function useSharedCare() { const value = useContext(CareContext); if (!value) throw new Error('Dữ liệu nhóm chưa sẵn sàng.'); return value; }
export function AuthPanel() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const result = mode === 'forgot' ? await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }) : mode === 'signup' ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/` } }) : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (mode === 'forgot') setMessage('Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.');
      if (mode === 'signup') setMessage('Vui lòng xác nhận email. Tài khoản chỉ được truy cập khi quản lý duyệt vào nhóm.');
    } catch { setError(mode === 'login' ? 'Không thể đăng nhập. Kiểm tra email và mật khẩu rồi thử lại.' : 'Không thể gửi yêu cầu. Vui lòng thử lại.'); } finally { setBusy(false); }
  }
  async function social(provider: 'google' | 'lovable') { setBusy(true); const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/` }); if (result.error) setError('Không thể đăng nhập. Vui lòng thử lại.'); setBusy(false); }
  return <div className="app-width py-10"><div className="mx-auto max-w-sm"><div className="mb-6 text-center"><div className="icon-tile mx-auto mb-4"><PawPrint size={26}/></div><h1 className="page-heading">Trạm Chăm Boss</h1><p className="mt-2 text-sm text-muted-foreground">{mode === 'login' ? 'Đăng nhập vào trạm của bạn' : mode === 'signup' ? 'Tạo tài khoản thành viên' : 'Đặt lại mật khẩu'}</p></div><div className="panel p-6">{error && <Notice>{error}</Notice>}{message && <p role="status" className="mb-4 text-sm text-success">{message}</p>}<form onSubmit={submit} className="grid gap-4"><Field label="Email"><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}/></Field>{mode !== 'forgot' && <Field label="Mật khẩu"><input type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)}/></Field>}<Button disabled={busy} type="submit" className="h-11">{busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : mode === 'signup' ? 'Tạo tài khoản' : 'Gửi email đặt lại'}</Button></form>{mode === 'login' && <Button variant="link" className="mt-2 w-full" onClick={() => setMode('forgot')}>Quên mật khẩu?</Button>}{mode !== 'forgot' && <><div className="my-4 text-center text-xs text-muted-foreground">hoặc</div><div className="grid gap-3"><Button variant="outline" className="google-button h-11" disabled={busy} onClick={() => social('google')}><svg aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Tiếp tục với Google</Button><Button variant="outline" className="h-11" disabled={busy} onClick={() => social('lovable')}><LovableMark/> Tiếp tục với Lovable</Button></div></>}<Button variant="link" className="mt-4 w-full" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); setError(''); }}>{mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Quay lại đăng nhập'}</Button></div><p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground"><LockKeyhole size={13}/> Chỉ thành viên được duyệt có quyền truy cập</p></div></div>;
}
export function PendingAccess() { return <div className="app-width py-16 text-center"><div className="icon-tile mx-auto mb-4"><Mail/></div><h1 className="page-heading">Chờ quản lý duyệt</h1><p className="mt-3 text-muted-foreground">Tài khoản của bạn chưa có quyền truy cập dữ liệu nhóm.</p><Button variant="outline" className="mt-6" onClick={() => { void supabase.auth.signOut(); }}><LogOut/> Đăng xuất</Button></div>; }