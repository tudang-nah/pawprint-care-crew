import { describe, expect, it } from 'vitest';
import { validateChange } from '@/lib/care-validation';
import { emptyData, type CareData, type Booking } from '@/lib/pet-care';
const b: Booking = { id: 'b', petId: 'p', customerId: 'c', petName: 'Boss', customerName: 'An', species: 'Chó', serviceName: 'Tắm', kind: 'spa', start: '2026-11-20', end: '2026-11-20', price: 150000, status: 'booked' };
const data: CareData = { ...emptyData, customers: [{ id: 'c', name: 'An', phone: '0900000000' }], pets: [{ id: 'p', customerId: 'c', name: 'Boss', species: 'Chó', breed: '', weight: 5, notes: '' }], services: [{ id: 's', name: 'Tắm', kind: 'spa', price: 150000 }] };
describe('Shared team save validation', () => {
  it('rejects forged service price instead of the configured 150,000 VND', () => { expect(() => validateChange(data, { ...data, bookings: [{ ...b, price: 1 }] })).toThrow(); });
  it('blocks saving a booking when spa capacity is zero', () => { expect(() => validateChange(data, { ...data, capacity: { spa: 0, boarding: 10 }, bookings: [b] })).toThrow(); });
  it('rejects client-side completion before starting care', () => { expect(() => validateChange({ ...data, bookings: [b] }, { ...data, bookings: [{ ...b, status: 'completed' }] })).toThrow(); });
  it('preserves completed booking history when a customer is removed', () => { const old = { ...data, bookings: [{ ...b, status: 'completed' as const }] }; expect(validateChange(old, { ...old, customers: [], pets: [] }).bookings[0]?.price).toBe(150000); });
});