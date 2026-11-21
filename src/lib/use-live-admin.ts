import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Admin/cộng sự tự cập nhật khi khách thêm bé, đặt hoặc đổi lịch (không cần tải lại trang).
// Realtime vẫn tuân theo RLS nên mỗi người chỉ nhận thay đổi của dữ liệu mình được xem.
export function useLiveAdmin() {
  const client = useQueryClient();
  useEffect(() => {
    const refresh = () => {
      void client.invalidateQueries({ queryKey: ['customers'] });
      void client.invalidateQueries({ queryKey: ['bookings'] });
      void client.invalidateQueries({ queryKey: ['slots'] });
    };
    const channel = supabase.channel('admin-live');
    for (const table of ['customers', 'pets', 'bookings', 'booking_items']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, refresh);
    }
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [client]);
}
