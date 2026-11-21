import { createFileRoute, Link } from '@tanstack/react-router';
import { CalendarHeart, Sparkles, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/care-shared';
import hero from '@/assets/pet-welcome.asset.json';
export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Trạm Chăm Boss · Spa và chăm sóc thú cưng' }, { name: 'description', content: 'Đặt lịch tắm, spa, cắt tỉa cho chó mèo chỉ trong vài chạm.' }, { property: 'og:title', content: 'Trạm Chăm Boss · Spa và chăm sóc thú cưng' }, { property: 'og:description', content: 'Đặt lịch chăm sóc cho bé nhanh, giá rõ ràng.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Landing,
});
function Landing() {
  return <div className="hero min-h-screen"><header className="app-width flex h-16 items-center justify-between"><Brand/><Button asChild variant="outline" className="rounded-2xl"><Link to="/auth">Đăng nhập</Link></Button></header>
    <section className="app-width grid items-center gap-8 py-10 md:grid-cols-2"><div className="page-enter"><span className="badge status-caring mb-4"><Sparkles size={12}/> Yêu thương mỗi ngày</span><h1 className="font-heading text-4xl font-extrabold leading-tight sm:text-5xl">Boss thơm tho, sen yên tâm</h1><p className="mt-4 text-lg text-muted-foreground">Tắm, spa, cắt tỉa cho chó mèo. Đặt lịch trong một phút, giá tính sẵn theo cân nặng của bé.</p><Button asChild size="lg" className="mt-6 h-14 rounded-2xl px-8 text-base"><Link to="/dat-lich"><CalendarHeart/> Đặt lịch ngay</Link></Button></div><img src={hero.url} alt="Thú cưng vui vẻ tại Trạm Chăm Boss" className="blob aspect-square w-full object-cover shadow-xl"/></section>
    <section className="app-width grid gap-4 pb-16 sm:grid-cols-3">{['Chọn bé', 'Chọn dịch vụ & giờ', 'Đến trạm thôi!'].map((t, i) => <div key={t} className="panel lift p-5"><div className="icon-tile mb-3"><PawPrint/></div><div className="font-heading text-lg font-bold">{i + 1}. {t}</div></div>)}</section></div>;
}
