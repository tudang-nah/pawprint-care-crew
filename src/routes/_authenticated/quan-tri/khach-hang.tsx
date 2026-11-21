import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, Phone } from 'lucide-react';
import { Empty, LoadingBlock, Notice, PageTitle, StatusBadge } from '@/components/care-shared';
import { SpeciesIcon } from '@/components/booking-parts';
import { customersOptions } from '@/lib/queries';
import { dateLabel, money } from '@/lib/booking';
export const Route = createFileRoute('/_authenticated/quan-tri/khach-hang')({ component: Customers });
function Customers() {
  const { role } = Route.useRouteContext(); const isAdmin = role === 'admin';
  const q = useQuery(customersOptions); const [term, setTerm] = useState(''); const [species, setSpecies] = useState(''); const [open, setOpen] = useState('');
  const t = term.trim().toLowerCase();
  const list = (q.data ?? []).filter(c => (!t || c.name.toLowerCase().includes(t) || c.phone.includes(t) || c.pets.some(p => p.name.toLowerCase().includes(t))) && (!species || c.pets.some(p => p.species === species)));
  return <><PageTitle title="Khách hàng" subtitle={isAdmin ? `${q.data?.length ?? 0} khách hàng` : 'Khách có lịch được giao cho bạn.'}/>
    <div className="mb-4 flex flex-wrap gap-2"><label className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-3.5 text-muted-foreground" size={18}/><input className="search-input pl-10" placeholder="Tìm tên khách, số điện thoại, tên bé…" value={term} onChange={e => setTerm(e.target.value)}/></label><select className="search-input w-auto" value={species} onChange={e => setSpecies(e.target.value)} aria-label="Lọc theo loài"><option value="">Tất cả loài</option><option>Chó</option><option>Mèo</option><option>Khác</option></select></div>
    {q.isLoading ? <LoadingBlock/> : q.isError ? <Notice>Không tải được danh sách khách.</Notice> : !list.length ? <div className="panel"><Empty title="Chưa tìm thấy khách nào" hint="Thử từ khoá khác nhé."/></div> :
    <div className="grid gap-3">{list.map(c => { const done = c.bookings.filter(b => b.status === 'completed'); const spent = done.reduce((s, b) => s + b.total, 0); const isOpen = open === c.id; return <div key={c.id} className="panel">
      <button className="flex w-full flex-wrap items-center gap-4 p-4 text-left" onClick={() => setOpen(isOpen ? '' : c.id)} aria-expanded={isOpen}><div className="grid h-11 w-11 place-items-center rounded-full bg-peach-soft font-heading text-lg font-bold text-primary">{c.name.charAt(0).toUpperCase()}</div><div className="min-w-[140px] flex-1"><div className="font-semibold">{c.name}</div><div className="flex items-center gap-1 text-sm text-muted-foreground"><Phone size={12}/> {c.phone || '—'}</div></div><div className="flex flex-wrap gap-1">{c.pets.map(p => <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold"><SpeciesIcon species={p.species} size={13}/>{p.name}</span>)}</div><div className="text-right"><div className="text-xs text-muted-foreground">{c.bookings.length} lịch</div>{isAdmin && <div className="font-bold text-primary">{money(spent)}</div>}</div></button>
      {isOpen && <div className="grid gap-4 border-t border-border p-4 md:grid-cols-2"><div><h3 className="mb-2 font-heading font-bold">Thú cưng</h3>{c.pets.map(p => <div key={p.id} className="mb-2 rounded-2xl bg-muted p-3 text-sm"><b>{p.name}</b> · {p.species}{p.breed && ` · ${p.breed}`} · {Number(p.weight)}kg{p.notes && <div className="mt-1 text-muted-foreground">{p.notes}</div>}</div>)}</div><div><h3 className="mb-2 font-heading font-bold">Lịch sử dịch vụ</h3>{c.bookings.length ? [...c.bookings].sort((a, b) => b.start_at.localeCompare(a.start_at)).map(b => <div key={b.id} className="flex items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0"><div><div className="font-semibold">{dateLabel(b.start_at)} · {b.pet_name}</div><div className="text-muted-foreground">{b.booking_items.map(i => i.name).join(', ')}</div></div><div className="text-right"><StatusBadge status={b.status}/>{isAdmin && <div className="mt-1 font-semibold">{money(b.total)}</div>}</div></div>) : <p className="text-sm text-muted-foreground">Chưa có lịch.</p>}</div></div>}
    </div>; })}</div>}</>;
}
