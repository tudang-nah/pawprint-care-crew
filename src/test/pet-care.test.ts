import { describe, expect, it } from 'vitest';
import { available, customerPoints, emptyData, nights, occupies, points, revenue, transition, type Booking } from '@/lib/pet-care';
const booking: Booking = { id: 'b', petId: 'p', customerId: 'c', petName: 'Boss', customerName: 'An', species: 'Chó', serviceName: 'Tắm', kind: 'spa', start: '2026-11-20', end: '2026-11-20', price: 150000, status: 'booked' };
describe('Pet care business rules', () => {
  it('awards one point per 10,000 VND', () => { expect(points(150000)).toBe(15); expect(points(19999)).toBe(1); });
  it('charges boarding by nights, excluding checkout day', () => { expect(nights('2026-11-20', '2026-11-23')).toBe(3); expect(occupies({ ...booking, kind: 'boarding', end: '2026-11-23' }, '2026-11-23')).toBe(false); });
  it('blocks spa booking when daily capacity is full', () => { expect(available({ ...emptyData, bookings: [booking], capacity: { spa: 1, boarding: 10 } }, 'spa', '2026-11-20', '2026-11-20')).toBe(0); });
  it('checks boarding availability on every night', () => { expect(available({ ...emptyData, bookings: [{ ...booking, kind: 'boarding', start: '2026-11-21', end: '2026-11-22' }], capacity: { spa: 8, boarding: 1 } }, 'boarding', '2026-11-20', '2026-11-23')).toBe(0); });
  it('cancelled booking releases capacity', () => { expect(available({ ...emptyData, bookings: [{ ...booking, status: 'cancelled' }], capacity: { spa: 1, boarding: 10 } }, 'spa', '2026-11-20', '2026-11-20')).toBe(1); });
  it('only completed bookings contribute revenue', () => { expect(revenue([booking], '2026-11-20')).toBe(0); expect(revenue([{ ...booking, status: 'completed' }], '2026-11-20')).toBe(150000); });
  it('completing twice never duplicates points', () => { const done = transition(transition(booking, 'caring'), 'completed'); expect(customerPoints([transition(done, 'completed')], 'c')).toBe(15); });
  it('requires start before completion and keeps terminal states final', () => { expect(transition(booking, 'completed').status).toBe('booked'); expect(transition({ ...booking, status: 'cancelled' }, 'caring').status).toBe('cancelled'); });
});