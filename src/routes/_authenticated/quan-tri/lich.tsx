import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BookingRows } from '@/components/admin-booking';
import { Empty, LoadingBlock, Notice, PageTitle } from '@/components/care-shared';
import { Button } from '@/components/ui/button';
import { bookingsOptions } from '@/lib/queries';
import { addDays, bookingDay, dayLabel, vnDay } from '@/lib/booking';
export const Route = createFileRoute('/_authenticated/quan-tri/lich')({ component: Schedule });
function Schedule() {
  const { role } = Route.useRouteContext(); const isAdmin = role === 'admin';
  const [view, setView] = useState<'day' | 'week'>('day'); const [start, setStart] = useState(vnDay());
  const len = view === 'day' ? 1 : 7; const q = useQuery(bookingsOptions(start, addDays(start, len)));
  const days = Array.from({ length: len }, (_, i) => addDays(start, i));
  return <><PageTitle title="Lịch" subtitle={isAdmin ? 'Xem lịch và phân công cộng sự.' : 'Các lịch được giao cho bạn.'}><div className="flex flex-wrap items-center gap-2"><div className="flex rounded-2xl bg-muted p-1">{(['day', 'week'] as const).map(v => <button key={v} onClick={() => setView(v)} className={`rounded-xl px-4 py-1.5 text-sm font-semibold ${view === v ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>{v === 'day' ? 'Ngày' : 'Tuần'}</button>)}</div><Button variant="outline" size="icon" aria-label="Trước" onClick={() => setStart(addDays(start, -len))}><ChevronLeft/></Button><Button variant="outline" onClick={() => setStart(vnDay())}>Hôm nay</Button><Button variant="outline" size="icon" aria-label="Sau" onClick={() => setStart(addDays(start, len))}><ChevronRight/></Button></div></PageTitle>
    {q.isLoading ? <LoadingBlock/> : q.isError ? <Notice>Không tải được lịch.</Notice> : <div className="grid gap-4">{days.map(d => { const items = (q.data ?? []).filter(b => bookingDay(b.start_at) === d); return <section key={d} className="panel"><h2 className="section-title border-b border-border p-4 text-base capitalize">{dayLabel(d)} <span className="ml-2 text-sm font-normal text-muted-foreground">{items.length} lịch</span></h2>{items.length ? <BookingRows bookings={items} isAdmin={isAdmin} showRevenue={isAdmin}/> : view === 'day' ? <Empty title="Ngày này còn trống" hint="Chưa có bé nào đặt lịch."/> : <p className="p-4 text-sm text-muted-foreground">Chưa có lịch.</p>}</section>; })}</div>}</>;
}
