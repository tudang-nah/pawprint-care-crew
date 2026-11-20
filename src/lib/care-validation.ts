import { z } from 'zod';
import { available, emptyData, nights, transition, type CareData } from './pet-care';
const id = z.string().min(1).max(100);
const text = z.string().trim().min(1).max(200);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => Number.isFinite(Date.parse(v)));
export const careSchema = z.object({
  customers: z.array(z.object({ id, name: text, phone: text })).max(10000),
  pets: z.array(z.object({ id, customerId: id, name: text, species: text, breed: z.string().max(200), weight: z.number().min(0).max(1000), notes: z.string().max(2000) })).max(20000),
  services: z.array(z.object({ id, name: text, kind: z.enum(['spa', 'boarding']), price: z.number().int().min(0).max(100000000) })).max(1000),
  bookings: z.array(z.object({ id, petId: id, customerId: id, petName: text, customerName: text, species: text, serviceName: text, kind: z.enum(['spa', 'boarding']), start: day, end: day, price: z.number().int().min(0).max(1000000000), status: z.enum(['booked', 'caring', 'completed', 'cancelled']) })).max(50000),
  capacity: z.object({ spa: z.number().int().min(0).max(10000), boarding: z.number().int().min(0).max(10000) }),
});
export function validateChange(previous: CareData, next: CareData) {
  for (const old of previous.bookings) {
    const changed = next.bookings.find(b => b.id === old.id);
    if (!changed || JSON.stringify({ ...changed, status: old.status }) !== JSON.stringify(old)) throw new Error('Không thể thay đổi hoặc xoá thông tin lịch đã lưu.');
    if (transition(old, changed.status).status !== changed.status) throw new Error('Trạng thái lịch không hợp lệ.');
  }
  const checked = { ...next, bookings: [...previous.bookings.map(old => next.bookings.find(b => b.id === old.id) ?? old)] };
  for (const booking of next.bookings.filter(b => !previous.bookings.some(old => old.id === b.id))) {
    const pet = next.pets.find(p => p.id === booking.petId);
    const customer = next.customers.find(c => c.id === pet?.customerId);
    const service = next.services.find(s => s.name === booking.serviceName && s.kind === booking.kind);
    if (!pet || !customer || !service || booking.status !== 'booked' || booking.customerId !== customer.id || booking.petName !== pet.name || booking.customerName !== customer.name || booking.species !== pet.species) throw new Error('Thông tin đặt lịch không hợp lệ.');
    const duration = booking.kind === 'spa' ? 1 : nights(booking.start, booking.end);
    if (duration <= 0 || booking.price !== service.price * duration) throw new Error('Ngày hoặc giá đặt lịch không hợp lệ.');
    if (available(checked, booking.kind, booking.start, booking.end) <= 0) throw new Error('Đã hết chỗ. Lịch chưa được lưu.');
    checked.bookings.push(booking);
  }
  for (const pet of next.pets) if (!next.customers.some(c => c.id === pet.customerId)) throw new Error('Thú cưng phải thuộc một khách hàng.');
  for (const rows of [next.customers, next.pets, next.services, next.bookings]) if (new Set(rows.map(r => r.id)).size !== rows.length) throw new Error('Thông tin bị trùng.');
  return next;
}
export { emptyData };