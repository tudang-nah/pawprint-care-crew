import { Link } from '@tanstack/react-router';
import { PawPrint, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { statusLabel, type BookingStatus } from '@/lib/booking';
import { Skeleton } from '@/components/ui/skeleton';
export function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) { return <label className="field">{label}{children}{error && <span className="text-xs font-medium text-destructive">{error}</span>}</label>; }
export function Notice({ children }: { children: ReactNode }) { return <div role="alert" className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{children}</div>; }
export function PageTitle({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) { return <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="page-heading">{title}</h1>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div>{children}</div>; }
export function StatusBadge({ status }: { status: BookingStatus }) { return <span className={`badge status-${status}`}>{statusLabel[status]}</span>; }
export function Empty({ title, hint, children }: { title: string; hint?: string; children?: ReactNode }) {
  return <div className="flex flex-col items-center gap-3 px-6 py-12 text-center"><div className="relative h-20 w-20"><div className="blob absolute inset-0 bg-peach-soft"/><PawPrint className="absolute left-5 top-5 text-primary" size={40}/></div><div className="font-heading text-lg font-bold">{title}</div>{hint && <p className="max-w-xs text-sm text-muted-foreground">{hint}</p>}{children}</div>;
}
export function LoadingBlock({ rows = 3 }: { rows?: number }) { return <div className="grid gap-3" aria-label="Đang tải">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-20 rounded-2xl"/>)}</div>; }
export function Brand({ to = '/' }: { to?: '/' | '/quan-tri' | '/dat-lich' }) { return <Link to={to} className="flex items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><PawPrint size={22}/></span><span className="font-heading text-xl font-extrabold leading-none">Trạm Chăm Boss</span></Link>; }
export function SignOutIcon() { return <LogOut size={18}/>; }
