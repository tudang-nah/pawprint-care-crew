import { useSuspenseQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Field } from './care-shared';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { FormEvent } from 'react';
const memberOptions = queryOptions({ queryKey: ['care-members'], queryFn: async () => { const [{ data: admin, error }, members] = await Promise.all([supabase.rpc('care_has_access', { admin_only: true }), supabase.from('care_members').select('*')]); if (error || members.error) throw error ?? members.error; return { admin, members: members.data ?? [] }; } });
export function TeamMembers() {
  const { data } = useSuspenseQuery(memberOptions); const client = useQueryClient();
  const mutation = useMutation({ mutationFn: async ({ email, remove }: { email: string; remove: boolean }) => { const { error } = await supabase.rpc('care_manage_member', { member_email: email, remove_member: remove }); if (error) throw error; }, onSuccess: () => { void client.invalidateQueries({ queryKey: ['care-members'] }); toast.success('Đã cập nhật thành viên'); }, onError: error => toast.error(error.message) });
  if (!data.admin) return null;
  async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const form = e.currentTarget; const email = String(new FormData(form).get('email')); try { await mutation.mutateAsync({ email, remove: false }); form.reset(); } catch { /* mutation displays error */ } }
  return <section className="panel mt-6 p-6"><h2 className="section-title mb-5 flex items-center gap-2"><ShieldCheck size={18} className="text-primary"/> Thành viên nhóm</h2><form className="flex flex-wrap items-end gap-3" onSubmit={submit}><div className="min-w-0 flex-1"><Field label="Email thành viên"><input name="email" type="email" required placeholder="Email được phép truy cập"/></Field></div><Button disabled={mutation.isPending} type="submit" className="h-[42px]"><Plus/> Duyệt thành viên</Button></form><div className="mt-4">{data.members.map(m => <div className="flex items-center justify-between gap-2 border-t border-border py-3" key={m.email}><span className="break-all text-xs">{m.email}</span>{m.role === 'admin' ? <span className="badge status-completed">Quản lý</span> : <Button disabled={mutation.isPending} size="icon" variant="ghost" title="Xoá thành viên" aria-label={`Xoá thành viên ${m.email}`} onClick={() => { if (window.confirm('Thu hồi quyền truy cập của thành viên này?')) mutation.mutate({ email: m.email, remove: true }); }}><Trash2/></Button>}</div>)}</div></section>;
}