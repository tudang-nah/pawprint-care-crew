import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CalendarDays, CalendarRange, Users, Tags, LogOut, Moon, Sun } from 'lucide-react';
import { roleOptions } from '@/lib/queries';
import { Brand } from '@/components/care-shared';
import { useSignOut } from '@/components/customer-shell';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/_authenticated/quan-tri')({
  beforeLoad: async ({ context }) => { const role = await context.queryClient.ensureQueryData(roleOptions); if (role !== 'admin' && role !== 'staff') throw redirect({ to: '/dat-lich' }); return { role }; },
  head: () => ({ meta: [{ title: 'Quản trị · Trạm Chăm Boss' }, { name: 'description', content: 'Khu quản lý lịch, khách hàng, dịch vụ và doanh thu của Trạm Chăm Boss.' }, { property: 'og:title', content: 'Quản trị · Trạm Chăm Boss' }, { property: 'og:description', content: 'Quản lý trạm chăm sóc thú cưng.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' }] }),
  component: AdminLayout,
});
const links = [
  { to: '/quan-tri', label: 'Hôm nay', icon: CalendarDays, admin: false, exact: true },
  { to: '/quan-tri/lich', label: 'Lịch', icon: CalendarRange, admin: false, exact: false },
  { to: '/quan-tri/khach-hang', label: 'Khách hàng', icon: Users, admin: false, exact: false },
  { to: '/quan-tri/dich-vu', label: 'Dịch vụ & Đơn giá', icon: Tags, admin: false, exact: false },
] as const;
function AdminLayout() {
  const { role } = Route.useRouteContext(); const signOut = useSignOut(); const [dark, setDark] = useState(false);
  useEffect(() => { const v = localStorage.getItem('tcb-dark'); setDark(v === '1' || (v === null && window.matchMedia('(prefers-color-scheme: dark)').matches)); }, []);
  function toggle() { localStorage.setItem('tcb-dark', dark ? '0' : '1'); setDark(!dark); }
  const visible = links.filter(l => !l.admin || role === 'admin');
  return <div className={dark ? 'dark' : ''}><div className="min-h-screen bg-background text-foreground lg:flex">
    <aside className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r"><div className="flex items-center justify-between p-4 lg:p-5"><Brand to="/quan-tri"/><div className="flex gap-1 lg:hidden"><Button variant="ghost" size="icon" aria-label="Đổi giao diện sáng/tối" onClick={toggle}>{dark ? <Sun/> : <Moon/>}</Button><Button variant="ghost" size="icon" aria-label="Đăng xuất" onClick={() => void signOut()}><LogOut/></Button></div></div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:px-4">{visible.map(l => <Link key={l.to} to={l.to} activeOptions={{ exact: l.exact }} className="side-link" activeProps={{ className: 'active' }}><l.icon size={18}/>{l.label}</Link>)}</nav>
      <div className="hidden gap-1 border-t border-sidebar-border p-4 lg:grid"><div className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{role === 'admin' ? 'Admin' : 'Cộng sự'}</div><button className="side-link" onClick={toggle}>{dark ? <Sun size={18}/> : <Moon size={18}/>} {dark ? 'Giao diện sáng' : 'Giao diện tối'}</button><button className="side-link" onClick={() => void signOut()}><LogOut size={18}/> Đăng xuất</button></div></aside>
    <main className="page-enter min-w-0 flex-1 p-4 sm:p-8"><Outlet/></main></div></div>;
}
