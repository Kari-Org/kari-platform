import Image from 'next/image';
import { ArrowRightUp, Wallet } from '@/components/icons';

export function Hero() {
  return (
    <section className="mx-auto grid max-w-container grid-cols-1 items-center gap-10 px-10 pb-20 pt-10 min-[900px]:grid-cols-[1.1fr_.9fr]">
      <div>
        <p className="mb-4 text-sm font-semibold uppercase tracking-[1px] text-[#9a8a00]">Get there with Kari</p>
        <h1 className="kari-h1 m-0">
          <span className="text-brand" style={{ WebkitTextStroke: '1px var(--ink)' }}>
            Seamless Rides,
          </span>
          <br />
          <span className="text-ink">Your Way</span>
        </h1>
        <p className="my-[22px] max-w-[440px] text-[17px] leading-[1.6] text-[#444]">
          Book a ride, drive and earn, or share the journey — Kari makes commuting in Nigeria
          effortless, affordable, and safe.
        </p>
        <div className="mt-[30px] flex items-center gap-3.5">
          <button className="rounded-pill border border-ink bg-white px-[30px] py-[15px] text-base font-semibold text-ink transition hover:shadow-card">
            Let&apos;s go
          </button>
          <button
            aria-label="Get started"
            className="grid h-[52px] w-[52px] place-items-center rounded-full bg-ink text-brand transition active:scale-95"
          >
            <ArrowRightUp size={24} />
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-[-6%_-6%_10%_20%] rounded-full bg-[radial-gradient(circle_at_60%_40%,#FFBB00,#FFF049)] opacity-80 blur-md" />
        <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[#eee]">
          <Image
            src="/assets/photo-person-1.jpg"
            alt="A Kari rider"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 45vw"
            className="object-cover"
          />
        </div>
        <div className="absolute -left-6 bottom-[18px] max-w-[200px] rounded-lg2 bg-surface p-[14px_18px] text-white shadow-lift">
          <div className="mb-1.5 flex items-center gap-2">
            <Wallet size={20} className="text-brand" />
            <span className="text-[15px] font-bold">Save daily</span>
          </div>
          <div className="text-xs text-[#bbb]">Reduced daily cost on rides with subscription</div>
        </div>
      </div>
    </section>
  );
}
