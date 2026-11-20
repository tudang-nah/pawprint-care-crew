export type ServiceKind = 'spa' | 'boarding';
export type Status = 'booked' | 'caring' | 'completed' | 'cancelled';
export interface Customer { id: string; name: string; phone: string }
export interface Pet { id: string; customerId: string; name: string; species: string; breed: string; weight: number; notes: string }
export interface Service { id: string; name: string; kind: ServiceKind; price: number }
export interface Booking { id: string; petId: string; customerId: string; petName: string; customerName: string; species: string; serviceName: string; kind: ServiceKind; start: string; end: string; price: number; status: Status }
export interface CareData { customers: Customer[]; pets: Pet[]; services: Service[]; bookings: Booking[]; capacity: { spa: number; boarding: number } }
export const emptyData: CareData = { customers: [], pets: [], services: [], bookings: [], capacity: { spa: 8, boarding: 10 } };
export function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export function nights(start: string, end: string) { return Math.round((Date.parse(end) - Date.parse(start)) / 86400000); }
export function points(price: number) { return Math.floor(price / 10000); }
export function occupies(booking: Booking, date: string) { return booking.status !== 'cancelled' && (booking.kind === 'spa' ? booking.start === date : booking.start <= date && date < booking.end); }
export function usage(bookings: Booking[], kind: ServiceKind, date: string) { return bookings.filter(b => b.kind === kind && occupies(b, date)).length; }
export function bookingDates(kind: ServiceKind, start: string, end: string) {
  if (kind === 'spa') return [start];
  const count = nights(start, end);
  if (!Number.isFinite(count) || count <= 0) return [];
  return Array.from({ length: count }, (_, i) => new Date(Date.parse(start) + i * 86400000).toISOString().slice(0, 10));
}
export function available(data: CareData, kind: ServiceKind, start: string, end: string) {
  const dates = bookingDates(kind, start, end);
  return dates.length ? Math.max(0, Math.min(...dates.map(date => data.capacity[kind] - usage(data.bookings, kind, date)))) : 0;
}
export function revenue(bookings: Booking[], date: string) { return bookings.filter(b => b.status === 'completed' && (b.kind === 'spa' ? b.start : b.end) === date).reduce((sum, b) => sum + b.price, 0); }
export function customerPoints(bookings: Booking[], customerId: string) { return bookings.filter(b => b.customerId === customerId && b.status === 'completed').reduce((sum, b) => sum + points(b.price), 0); }
export function transition(booking: Booking, status: Status): Booking {
  if (booking.status === 'completed' || booking.status === 'cancelled') return booking;
  if (status === 'caring' && booking.status !== 'booked') return booking;
  if (status === 'completed' && booking.status !== 'caring') return booking;
  return { ...booking, status };
}
export const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
export const dateLabel = (date: string) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z'));