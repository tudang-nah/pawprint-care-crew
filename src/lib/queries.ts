import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PriceRule } from './booking';
export type Role = 'admin' | 'staff' | 'customer';
export async function fetchRole(): Promise<Role | null> { const { data, error } = await supabase.rpc('my_role'); if (error) throw error; return (data as Role | null) ?? null; }
export const roleOptions = queryOptions({ queryKey: ['role'], queryFn: fetchRole, staleTime: 60000 });
export const catalogOptions = queryOptions({ queryKey: ['catalog'], queryFn: async () => {
  const [s, r, x, st] = await Promise.all([supabase.from('services').select('*').order('created_at'), supabase.from('price_rules').select('*').order('min_kg'), supabase.from('surcharges').select('*').order('name'), supabase.from('settings').select('*').maybeSingle()]);
  const err = s.error ?? r.error ?? x.error ?? st.error; if (err) throw err;
  return { services: s.data ?? [], rules: (r.data ?? []) as PriceRule[], surcharges: x.data ?? [], settings: st.data ?? { id: true, slot_capacity: 3, open_hour: 8, close_hour: 18, cancel_hours: 12 } };
} });
export const bookingSelect = '*, booking_items(*)';
export const mineOptions = queryOptions({ queryKey: ['mine'], queryFn: async () => {
  const { data: u } = await supabase.auth.getUser(); if (!u.user) throw new Error('Vui lòng đăng nhập.');
  const { data: customer, error } = await supabase.from('customers').select('*').eq('user_id', u.user.id).maybeSingle(); if (error) throw error;
  if (!customer) return { customer: null, pets: [], bookings: [] };
  const [p, b] = await Promise.all([supabase.from('pets').select('*').eq('customer_id', customer.id).order('created_at'), supabase.from('bookings').select(bookingSelect).eq('customer_id', customer.id).order('start_at', { ascending: false })]);
  if (p.error ?? b.error) throw p.error ?? b.error;
  return { customer, pets: p.data ?? [], bookings: b.data ?? [] };
} });
export const bookingsOptions = (from: string, to: string) => queryOptions({ queryKey: ['bookings', from, to], queryFn: async () => {
  const { data, error } = await supabase.from('bookings').select(bookingSelect).gte('start_at', `${from}T00:00:00+07:00`).lt('start_at', `${to}T00:00:00+07:00`).order('start_at'); if (error) throw error; return data ?? [];
} });
export const customersOptions = queryOptions({ queryKey: ['customers'], queryFn: async () => {
  const { data, error } = await supabase.from('customers').select('*, pets(*), bookings(id, start_at, status, total, pet_name, booking_items(name))').order('created_at', { ascending: false }); if (error) throw error; return data ?? [];
} });
export const teamOptions = queryOptions({ queryKey: ['team'], queryFn: async () => { const { data, error } = await supabase.rpc('list_team'); if (error) throw error; return data ?? []; } });
export const slotUsageOptions = (from: string, to: string) => queryOptions({ queryKey: ['slots', from, to], queryFn: async () => { const { data, error } = await supabase.rpc('slot_usage', { _from: from, _to: to }); if (error) throw error; return data ?? []; }, refetchInterval: 20000 });
export function friendly(e: unknown) { const m = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: string }).message) : ''; return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(m) ? m : 'Có lỗi xảy ra, vui lòng thử lại.'; }
