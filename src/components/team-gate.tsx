import { useEffect, useState, Suspense, type ReactNode } from 'react';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AuthPanel, PendingAccess, SharedCareProvider, accessOptions } from './care-access';
function Approved({ children }: { children: ReactNode }) { const { data: access } = useSuspenseQuery(accessOptions); return access ? <SharedCareProvider>{children}</SharedCareProvider> : <PendingAccess/>; }
export function TeamGate({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const client = useQueryClient();
  useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => { if (alive) setSignedIn(Boolean(data.user)); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT' && event !== 'USER_UPDATED') return;
      if (event === 'SIGNED_OUT') { client.clear(); setSignedIn(false); }
      else { setSignedIn(Boolean(session)); void client.invalidateQueries(); }
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [client]);
  if (signedIn === null) return <div className="app-width py-20 text-center text-muted-foreground">Đang kết nối với trạm…</div>;
  if (!signedIn) return <AuthPanel/>;
  return <Suspense fallback={<div className="app-width py-20 text-center text-muted-foreground">Đang đọc dữ liệu nhóm…</div>}><Approved>{children}</Approved></Suspense>;
}