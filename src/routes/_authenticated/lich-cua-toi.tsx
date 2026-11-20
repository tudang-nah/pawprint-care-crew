import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Suspense, useState } from 'react';
import { CalendarPlus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CustomerShell } from '@/components/customer-shell';
import { Empty, LoadingBlock, PageTitle, StatusBadge } from '@/components/care-shared';
import { SlotStep, SpeciesIcon } from '@/components/booking-parts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { catalogOptions, friendly, mineOptions } from '@/lib/queries';
import { addDays, bookingDay, canChange, dateLabel, money, timeLabel, vnDay, type BookingStatus } from '@/lib/booking';
export const Route = createFileRoute('/_authenticated/lich-cua-toi')({
  head: () => ({ meta: [{ title: 'Lịch của tôi · Trạm Chăm Boss' }, { name: 'description', content: 'Xem, huỷ hoặc đổi lịch chăm sóc của bé.' }, { property: 'og:title', content: 'Lịch của tôi · Trạm Chăm Boss' }, { property: 'og:description', content: 'Theo dõi lịch chăm sóc thú cưng của bạn.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: () => <CustomerShell><Suspense fallback={<LoadingBlock/>}><MyBookings/></Suspense></CustomerShell>,
});
function MyBookings() {
  const { data } = useSuspenseQuery(mineOptions); const { data: cat } = useSuspenseQuery(catalogOptions); const client = useQueryClient();
  const [moving, setMoving] = useState<null | { id: string; start: string }>(null); const [day, setDay] = useState(addDays(vnDay(), 1)); const [slot, setSlot] = useState('');
  const change = useMutation({ mutationFn: async (v: { id: string; start: string | null }) => { const { error } = await supabase.rpc('change_my_booking', { _booking: v.id, _new_start: v.start as string }); if (error) throw error; }, onSuccess: (_, v) => { toast.success(v.start ? 'Đã đổi lịch, trạm sẽ xác nhận lại nhé' : 'Đã huỷ lịch'); setMoving(null); void client.invalidateQueries({ queryKey: ['mine'] }); void client.invalidateQueries({ queryKey: ['slots'] }); }, onError: e => toast.error(friendly(e)) });
  const now = Date.now(); const open = (s: BookingStatus) => s === 'pending' || s === 'confirmed' || s === 'caring';
  const upcoming = data.bookings.filter(b => open(b.status) && Date.parse(b.start_at) > now - 3 * 3600000).reverse();
  const past = data.bookings.filter(b => !upcoming.includes(b));
  const hrs = cat.settings.cancel_hours;
  const card = (b: (typeof data.bookings)[number]) => { const editable = (b.status === 'pending' || b.status === 'confirmed') && canChange(b.start_at, new Date(), hrs);
    return <div key={b.id} className="panel p-4"><div className="flex items-start gap-3"><div className="icon-tile"><SpeciesIcon species={b.species}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-heading text-lg font-bold">{b.pet_name}</div><StatusBadge status={b.status}/></div><div className="mt-1 flex items-center gap-1 text-sm font-semibold"><Clock size={14}/> {timeLabel(b.start_at)} · {dateLabel(b.start_at)}</div><div className="mt-1 text-sm text-muted-foreground">{b.booking_items.map(i => i.name).join(', ')}</div><div className="mt-2 font-bold text-primary">{money(b.total)}</div></div></div>
      {(b.status === 'pending' || b.status === 'confirmed') && <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">{editable ? <><Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setMoving({ id: b.id, start: b.start_at }); setDay(bookingDay(b.start_at)); setSlot(''); }}>Đổi lịch</Button><Button size="sm" variant="ghost" className="rounded-xl text-destructive" disabled={change.isPending} onClick={() => { if (window.confirm(`Huỷ lịch của ${b.pet_name}?`)) change.mutate({ id: b.id, start: null }); }}>Huỷ lịch</Button></> : <span className="text-xs text-muted-foreground">Chỉ huỷ/đổi được trước {hrs} giờ. Cần hỗ trợ, bạn gọi cho trạm nhé.</span>}</div>}</div>; };
  return <div className="mx-auto max-w-3xl"><PageTitle title="Lịch của tôi" subtitle={`Được huỷ hoặc đổi lịch trước ${hrs} giờ.`}><Button asChild className="rounded-2xl"><Link to="/dat-lich"><CalendarPlus/> Đặt lịch mới</Link></Button></PageTitle>
    <h2 className="section-title mb-3">Sắp tới</h2>{upcoming.length ? <div className="grid gap-3">{upcoming.map(card)}</div> : <div className="panel"><Empty title="Chưa có lịch nào" hint="Đặt cho bé một buổi spa thơm tho ngay nhé!"><Button asChild className="rounded-2xl"><Link to="/dat-lich">Đặt lịch ngay</Link></Button></Empty></div>}
    {past.length > 0 && <><h2 className="section-title mb-3 mt-8">Lịch sử</h2><div className="grid gap-3 opacity-90">{past.map(card)}</div></>}
    <Dialog open={Boolean(moving)} onOpenChange={o => !o && setMoving(null)}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-3xl"><DialogHeader><DialogTitle className="font-heading text-2xl">Đổi lịch hẹn</DialogTitle></DialogHeader><SlotStep day={day} setDay={d => { setDay(d); setSlot(''); }} slot={slot} setSlot={setSlot} settings={cat.settings}/><Button size="lg" className="mt-2 h-12 rounded-2xl" disabled={!slot || change.isPending} onClick={() => moving && change.mutate({ id: moving.id, start: slot })}>{change.isPending ? 'Đang đổi…' : 'Xác nhận đổi lịch'}</Button></DialogContent></Dialog>
  </div>;
}
