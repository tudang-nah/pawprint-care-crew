import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, CalendarHeart, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Brand } from './care-shared';
export function useSignOut() {
  const client = useQueryClient(); const navigate = useNavigate();
  return async () => { await client.cancelQueries(); client.clear(); await supabase.auth.signOut(); void navigate({ to: '/auth', replace: true }); };
}
export function CustomerShell({ children }: { children: ReactNode }) {
  const signOut = useSignOut();
  return <div className="min-h-screen bg-background"><header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur"><div className="app-width flex h-16 items-center justify-between gap-3"><Brand to="/dat-lich"/><nav className="flex items-center gap-1"><Link to="/dat-lich" className="side-link hidden sm:flex" activeProps={{ className: 'active' }}><CalendarPlus size={18}/> Đặt lịch</Link><Link to="/lich-cua-toi" className="side-link" activeProps={{ className: 'active' }}><CalendarHeart size={18}/><span className="hidden sm:inline">Lịch của tôi</span></Link><Button variant="ghost" size="icon" aria-label="Đăng xuất" onClick={() => void signOut()}><LogOut/></Button></nav></div></header><main className="app-width page-enter pb-32 pt-6">{children}</main></div>;
}
