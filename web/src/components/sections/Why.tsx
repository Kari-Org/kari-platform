import type { ReactNode } from 'react';
import { MedalStar, Routing, ShieldCheck, type IconProps } from '@/components/icons';

const FEATURES: { title: string; desc: string; Icon: (p: IconProps) => ReactNode }[] = [
  {
    title: 'Safety First',
    desc: 'Verified drivers, live trip-sharing and emergency contacts on every ride.',
    Icon: ShieldCheck,
  },
  {
    title: 'Earn Rewards',
    desc: 'Drive on your terms and cash out earnings whenever you want.',
    Icon: MedalStar,
  },
  {
    title: 'Multiple Ride Options',
    desc: 'Solo, carpool, shuttle or subscription — pick what fits your day.',
    Icon: Routing,
  },
];

export function Why() {
  return (
    <section className="section-paper">
      <div className="mx-auto max-w-container px-10 py-[70px]">
        <h2 className="kari-hero mb-[50px] text-center text-ink">Why Choose Kari?</h2>
        <div className="grid grid-cols-1 items-center gap-10 min-[900px]:grid-cols-2">
          <div>
            <h3 className="mb-3.5 text-[30px] font-bold tracking-[-.3px] text-ink">
              Fair &amp; Flexible Pricing
            </h3>
            <p className="mb-[26px] text-base leading-[1.6] text-[#555]">
              You have the option to negotiate ride fares directly with the driver — clarity and
              consistency on pricing, so you always pay the fair option that suits your needs and
              budget.
            </p>
            <div className="flex flex-col gap-3">
              {FEATURES.map(({ title, desc, Icon }) => (
                <div
                  key={title}
                  className="flex items-center gap-3.5 rounded-lg2 border border-[#ececec] p-3.5 shadow-[0_6px_20px_rgba(0,0,0,.04)]"
                >
                  <div className="grid h-[46px] w-[46px] flex-none place-items-center rounded-card bg-surface text-brand">
                    <Icon size={22} />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-ink">{title}</div>
                    <div className="mt-0.5 text-[13px] text-[#777]">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-square overflow-hidden rounded-xl2 bg-[conic-gradient(from_200deg_at_60%_40%,#000_0deg,#FFF049_120deg,#FFBB00_220deg,#121212_360deg)]" />
        </div>
      </div>
    </section>
  );
}
