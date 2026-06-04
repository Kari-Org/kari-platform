import Image from 'next/image';
import { ArrowRight, Smartphone } from '@/components/icons';

const STEPS = [
  { n: '1', title: 'Request a ride', desc: 'Enter your destination, set your price or accept fixed pricing.' },
  { n: '2', title: 'Match with a driver', desc: 'View ratings and pick the driver that works for you.' },
  { n: '3', title: 'Enjoy your trip', desc: 'Safe, comfortable and reliable — track every minute.' },
];

export function Steps() {
  return (
    <section className="mx-auto max-w-container px-10 pb-20 pt-10">
      <h2 className="kari-h2 mb-10 text-center text-ink">How it works</h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div
            key={s.n}
            className="relative min-h-[220px] overflow-hidden rounded-xl2 border border-[#2a2a2a] bg-surface p-6 text-white"
          >
            {i === 1 && (
              <>
                <Image src="/assets/app-screen.png" alt="" fill className="object-cover" sizes="380px" />
                <div className="absolute inset-0 bg-gradient-to-b from-surface/50 to-surface/[.92]" />
              </>
            )}
            <div className="relative">
              <div className="mb-[60px] grid h-[38px] w-[38px] place-items-center rounded-full bg-brand font-bold text-ink">
                {s.n}
              </div>
              <div className="mb-2 text-xl font-bold">{s.title}</div>
              <div className="text-[13px] leading-[1.5] text-[#bbb]">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <button className="inline-flex items-center gap-2.5 rounded-pill bg-brand px-[26px] py-[15px] text-[15px] font-semibold text-ink transition hover:bg-gold">
          Download the Kari App <Smartphone size={18} />
        </button>
        <button className="inline-flex items-center gap-2.5 rounded-pill bg-surface px-[26px] py-[15px] text-[15px] font-semibold text-white transition hover:opacity-90">
          Join as a Driver <ArrowRight size={18} className="text-brand" />
        </button>
      </div>
    </section>
  );
}
