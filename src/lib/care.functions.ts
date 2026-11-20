import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { careSchema, validateChange } from './care-validation';
import type { Json } from '@/integrations/supabase/types';
export const saveCare = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ data: careSchema, version: z.number().int().min(0) }).parse(input)).handler(async ({ data, context }) => {
  const { data: access, error: accessError } = await context.supabase.rpc('care_has_access');
  if (accessError || !access) throw new Error('Bạn chưa được duyệt vào nhóm.');
  const { data: current, error } = await context.supabase.rpc('care_read');
  const state = current?.[0];
  if (error || !state) throw new Error('Không thể đọc dữ liệu nhóm.');
  if (state.version !== data.version) throw new Error('Dữ liệu vừa thay đổi. Vui lòng tải lại rồi thử lại.');
  const next = validateChange(careSchema.parse(state.data), data.data);
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: version, error: saveError } = await supabaseAdmin.rpc('care_save', { next_data: next as unknown as Json, expected_version: data.version });
  if (saveError) throw new Error(saveError.message);
  return { data: next, version: version ?? data.version + 1 };
});