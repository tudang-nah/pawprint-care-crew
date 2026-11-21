import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { CalendarCheck, Wallet, Gauge, Hourglass } from 'lucide-react';
import { BookingRows } from '@/components/admin-booking';
import { Empty, LoadingBlock, Notice, PageTitle } from '@/components/care-shared';
import { StaffProfile } from '@/components/staff-profile';
import { bookingsOptions, catalogOptions } from '@/lib/queries';
import { addDays, dayLabel, money, vnDay } from '@/lib/booking';
export const Route = createFileRoute('/_authenticated/quan-tri/')({ component: Today });
function Today() {
  const { role } = Route.useRouteContext(); const isAdmin = role === 'admin'; const day = vnDay();
  const q = useQuery(bookingsOptions(day, addDays(day, 1))); const cat = useQuery(catalogOptions);
  const list = q.data ?? []; const active = list.filter(b => b.status !== 'cancelled');
  const cap = cat.data ? cat.data.settings.slot_capacity * (cat.data.settings.close_hour - cat.data.settings.open_hour) : 0;
  const stats = [
    { label: 'Lịch hôm nay', value: String(active.length), icon: CalendarCheck, tone: '' },
    ...(isAdmin ? [{ label: 'Doanh thu hôm nay', value: money(list.filter(b => b.status === 'completed').reduce((s, b) => s + b.total, 0)), icon: Wallet, tone: 'mint' }] : []),
    { label: 'Công suất', value: cap ? `${Math.round((active.length / cap) * 100)}%` : '—', icon: Gauge, tone: 'sky' },
    { label: 'Chờ xác nhận', value: String(list.filter(b => b.status === 'pending').length), icon: Hourglass, tone: 'butter' },
  ];
  return <><PageTitle title="Hôm nay" subtitle={dayLabel(day)}/>
    <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">{stats.map(s => <div key={s.label} className="panel lift p-5"><div className={`icon-tile ${s.tone}`}><s.icon size={22}/></div><div className="mt-4 font-heading text-3xl font-extrabold leading-none">{q.isLoading ? '…' : s.value}</div><div className="mt-1 text-sm text-muted-foreground">{s.label}</div></div>)}</div>
    <section className="panel"><h2 className="section-title border-b border-border p-4">{isAdmin ? 'Lịch chăm sóc trong ngày' : 'Lịch được giao cho bạn'}</h2>{q.isLoading ? <div className="p-4"><LoadingBlock/></div> : q.isError ? <div className="p-4"><Notice>Không tải được lịch, bạn thử tải lại trang nhé.</Notice></div> : list.length ? <BookingRows bookings={list} isAdmin={isAdmin} showRevenue={isAdmin}/> : <Empty title="Hôm nay chưa có lịch nào" hint="Tranh thủ nghỉ ngơi hoặc dọn dẹp trạm nhé!"/>}</section>
    <Suspense fallback={<div className="mt-6"><LoadingBlock rows={1}/></div>}><StaffProfile/></Suspense></>;
}
