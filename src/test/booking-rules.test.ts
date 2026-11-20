import { describe, expect, it } from 'vitest';
import { canChange, daySlots, priceFor, money } from '@/lib/booking';
const spa = { id: 's1', base_price: 200000 };
const rules = [
  { service_id: 's1', species: 'Chó', min_kg: 0, max_kg: 5, price: 250000 },
  { service_id: 's1', species: 'Chó', min_kg: 5, max_kg: 10, price: 350000 },
  { service_id: 's1', species: 'Chó', min_kg: 10, max_kg: null, price: 450000 },
];
describe('bảng giá theo loài và cân nặng', () => {
  it('chó dưới 5kg', () => expect(priceFor(spa, rules, 'Chó', 4)).toBe(250000));
  it('chó 5–10kg', () => expect(priceFor(spa, rules, 'Chó', 5)).toBe(350000));
  it('chó trên 10kg', () => expect(priceFor(spa, rules, 'Chó', 30)).toBe(450000));
  it('không có quy tắc thì dùng giá gốc', () => expect(priceFor(spa, rules, 'Mèo', 4)).toBe(200000));
  it('định dạng VNĐ', () => expect(money(350000)).toBe('350.000đ'));
});
describe('huỷ/đổi lịch trước 12 giờ', () => {
  const now = new Date('2026-12-01T00:00:00+07:00');
  it('còn 12 giờ thì được đổi', () => expect(canChange('2026-12-01T12:00:00+07:00', now)).toBe(true));
  it('còn 11 giờ thì không', () => expect(canChange('2026-12-01T11:00:00+07:00', now)).toBe(false));
});
describe('công suất khung giờ', () => {
  it('khung đã đủ chỗ thì hết', () => {
    const slots = daySlots('2026-12-02', 9, 11, 3, [{ start_at: '2026-12-02T02:00:00+00:00', used: 3 }], new Date('2026-12-01T00:00:00Z'));
    expect(slots.map(s => s.left)).toEqual([0, 3]);
  });
});
