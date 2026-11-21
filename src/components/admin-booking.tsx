import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './care-shared';
import { SpeciesIcon } from './booking-parts';
import { friendly, teamOptions } from '@/lib/queries';
import { money, nextStatus, statusLabel, timeLabel, type BookingStatus } from '@/lib/booking';
export interface AdminBooking { id: string; pet_name: string; customer_name: string; species: string; start_at: string; status: BookingStatus; total: number; note: string; staff_id: string | null; booking_items: { name: string }[] }
export function BookingRows({ bookings, isAdmin, showRevenue = true }: { bookings: AdminBooking[]; isAdmin: boolean; showRevenue?: boolean }) {
  const client = useQueryClient(); const team = useQuery({ ...teamOptions, enabled: isAdmin });
  const refresh = () => { void client.invalidateQueries({ queryKey: ['bookings'] }); void client.invalidateQueries({ queryKey: ['customers'] }); };
  const status = useMutation({ mutationFn: async (v: { id: string; s: BookingStatus }) => { const { error } = await supabase.rpc('set_booking_status', { _booking: v.id, _status: v.s }); if (error) throw error; }, onSuccess: (_, v) => { toast.success(`Đã chuyển sang “${statusLabel[v.s]}”`); refresh(); }, onError: e => toast.error(friendly(e)) });
  const assign = useMutation({ mutationFn: async (v: { id: string; staff: string }) => { const { error } = await supabase.rpc('assign_booking', { _booking: v.id, _staff: (v.staff || null) as string }); if (error) throw error; }, onSuccess: () => { toast.success('Đã phân công'); refresh(); }, onError: e => toast.error(friendly(e)) });
  return <div className="divide-y divide-border">{bookings.map(b => <div key={b.id} className="flex flex-wrap items-center gap-3 p-4">
    <div className="w-14 font-heading text-lg font-bold text-primary">{timeLabel(b.start_at)}</div>
    <div className="icon-tile"><SpeciesIcon species={b.species}/></div>
    <div className="min-w-[160px] flex-1"><div className="font-semibold">{b.pet_name} <span className="font-normal text-muted-foreground">· {b.customer_name}</span></div><div className="text-sm text-muted-foreground">{b.booking_items.map(i => i.name).join(', ')}{showRevenue && <> · <b className="text-foreground">{money(b.total)}</b></>}</div>{b.note && <div className="mt-1 text-xs italic text-muted-foreground">“{b.note}”</div>}</div>
    {isAdmin && <select aria-label="Phân công cộng sự" className="search-input w-auto min-h-9 py-1 text-sm" value={b.staff_id ?? ''} onChange={e => assign.mutate({ id: b.id, staff: e.target.value })}><option value="">Chưa phân công</option>{(team.data ?? []).map(t => <option key={t.user_id} value={t.user_id}>{t.display_name || t.email}</option>)}</select>}
    <StatusBadge status={b.status}/>
    <div className="flex gap-1">{nextStatus[b.status].map(s => <Button key={s} size="sm" variant={s === 'cancelled' ? 'ghost' : 'outline'} className="rounded-xl" disabled={status.isPending} onClick={() => { if (s !== 'cancelled' || window.confirm('Huỷ lịch này?')) status.mutate({ id: b.id, s }); }}>{s === 'confirmed' ? 'Xác nhận' : s === 'caring' ? 'Bắt đầu chăm' : s === 'completed' ? 'Hoàn thành' : 'Huỷ'}</Button>)}</div>
  </div>)}</div>;
}
