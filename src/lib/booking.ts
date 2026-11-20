export type Species = 'Chó' | 'Mèo' | 'Khác';
export type BookingStatus = 'pending' | 'confirmed' | 'caring' | 'completed' | 'cancelled';
export const SPECIES: Species[] = ['Chó', 'Mèo', 'Khác'];
export const statusLabel: Record<BookingStatus, string> = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', caring: 'Đang chăm', completed: 'Hoàn thành', cancelled: 'Đã huỷ' };
export const nextStatus: Record<BookingStatus, BookingStatus[]> = { pending: ['confirmed', 'cancelled'], confirmed: ['caring', 'cancelled'], caring: ['completed', 'cancelled'], completed: [], cancelled: [] };
export interface PriceRule { service_id: string; species: string; min_kg: number; max_kg: number | null; price: number }
export function priceFor(service: { id: string; base_price: number }, rules: PriceRule[], species: string, weight: number) {
  const match = rules.filter(r => r.service_id === service.id && r.species === species && weight >= Number(r.min_kg) && (r.max_kg == null || weight < Number(r.max_kg))).sort((a, b) => Number(b.min_kg) - Number(a.min_kg))[0];
  return match ? match.price : service.base_price;
}
export const money = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + 'đ';
const TZ = 'Asia/Ho_Chi_Minh';
export function vnDay(d: Date = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }
export function addDays(day: string, n: number) { const d = new Date(day + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function slotIso(day: string, hour: number) { return `${day}T${String(hour).padStart(2, '0')}:00:00+07:00`; }
export function sameSlot(a: string, b: string) { return Date.parse(a) === Date.parse(b); }
/** Each hourly slot of a day with how many seats remain; past slots count as unavailable. */
export function daySlots(day: string, open: number, close: number, capacity: number, used: { start_at: string; used: number }[], now: Date = new Date()) {
  const out: { hour: number; iso: string; left: number; past: boolean }[] = [];
  for (let h = open; h < close; h++) {
    const iso = slotIso(day, h);
    const taken = used.filter(u => sameSlot(u.start_at, iso)).reduce((s, u) => s + u.used, 0);
    out.push({ hour: h, iso, left: Math.max(0, capacity - taken), past: Date.parse(iso) <= now.getTime() });
  }
  return out;
}
/** Customers may cancel or reschedule only when the visit is at least `hours` away. */
export function canChange(startAt: string, now: Date = new Date(), hours = 12) { return Date.parse(startAt) - now.getTime() >= hours * 3600000; }
export const timeLabel = (iso: string) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(new Date(iso));
export const dateLabel = (iso: string) => new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }).format(new Date(iso));
export const dayLabel = (day: string) => new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(new Date(day + 'T00:00:00Z'));
export function bookingDay(iso: string) { return vnDay(new Date(iso)); }
