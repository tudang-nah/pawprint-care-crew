import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cat, Dog, PawPrint } from 'lucide-react';
import { vi } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { LoadingBlock, Notice } from './care-shared';
import { slotUsageOptions } from '@/lib/queries';
import { addDays, daySlots, vnDay } from '@/lib/booking';
export function SpeciesIcon({ species, size = 22 }: { species: string; size?: number }) { return species === 'Mèo' ? <Cat size={size}/> : species === 'Chó' ? <Dog size={size}/> : <PawPrint size={size}/>; }
export function SlotStep({ day, setDay, slot, setSlot, settings }: { day: string; setDay: (d: string) => void; slot: string; setSlot: (s: string) => void; settings: { slot_capacity: number; open_hour: number; close_hour: number } }) {
  const today = vnDay(); const usage = useQuery(slotUsageOptions(day, day));
  const slots = useMemo(() => daySlots(day, settings.open_hour, settings.close_hour, settings.slot_capacity, usage.data ?? []), [day, settings, usage.data]);
  return <><h1 className="page-heading mb-5">Chọn ngày và giờ hẹn</h1><div className="grid gap-5 md:grid-cols-[auto_1fr]"><div className="panel w-fit justify-self-center p-2"><Calendar mode="single" locale={vi} selected={new Date(day + 'T12:00:00')} onSelect={d => d && setDay(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)} disabled={d => { const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; return s < today || s > addDays(today, 60); }} className="bg-transparent [--cell-size:2.6rem]"/></div>
    <div><div className="mb-3 font-semibold">Khung giờ còn trống</div>{usage.isLoading ? <LoadingBlock rows={2}/> : usage.isError ? <Notice>Không tải được khung giờ, bạn thử lại nhé.</Notice> : <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{slots.map(s => { const off = s.past || s.left === 0; return <button key={s.iso} type="button" disabled={off} aria-pressed={slot === s.iso} onClick={() => setSlot(s.iso)} className="choice py-3 text-center"><div className="font-heading text-lg font-bold">{String(s.hour).padStart(2, '0')}:00</div><div className="text-xs text-muted-foreground">{s.past ? 'Đã qua' : s.left === 0 ? 'Đã kín' : `Còn ${s.left} chỗ`}</div></button>; })}</div>}</div></div></>;
}
