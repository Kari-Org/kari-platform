import Image from 'next/image';
import { RideType } from '@kari/types';
import { Bus, CalendarMark } from '@/components/icons';

type Opt = {
  type: RideType;
  label: string;
  desc: string;
  img?: string;
  icon?: 'calendar' | 'bus';
};

// Labels map to the shared RideType enum (not redefined strings).
const OPTIONS: Opt[] = [
  { type: RideType.SOLO, label: 'Solo Ride', desc: 'Need your own ride? Get a car just for you anytime, anywhere.', img: 'illustration-solo' },
  { type: RideType.CARPOOL, label: 'Carpooling', desc: 'Share the cost with others heading the same way.', img: 'illustration-carpool' },
  { type: RideType.SUBSCRIPTION, label: 'Subscription Rides', desc: 'Book regular trips in advance and never miss a commute.', icon: 'calendar' },
  { type: RideType.SHUTTLE, label: 'Shuttle Rides', desc: 'Affordable group transport with fixed stops for your daily commute.', icon: 'bus' },
];

export function RideOptions() {
  return (
    <section className="section-paper">
      <div className="mx-auto max-w-container px-10 py-[70px]">
        <div className="mb-10 inline-block rounded-lg2 border border-line px-6 py-[18px]">
          <div className="font-wordmark text-[22px] font-bold text-ink">Kari</div>
          <div className="text-[22px] font-semibold text-ink">Ride Options</div>
        </div>

        <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
          {OPTIONS.map((o) => (
            <div
              key={o.type}
              className="flex items-center gap-5 rounded-[20px] border border-[#eee] bg-paper-2 p-6"
            >
              <div className="flex-1">
                <h3 className="mb-2 text-[22px] font-bold text-ink">{o.label}</h3>
                <p className="text-sm leading-[1.5] text-[#666]">{o.desc}</p>
              </div>
              <div className="grid h-[110px] w-[150px] flex-none place-items-center rounded-[14px] bg-white">
                {o.img ? (
                  <Image
                    src={`/assets/${o.img}.png`}
                    alt={o.label}
                    width={150}
                    height={110}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : o.icon === 'calendar' ? (
                  <CalendarMark size={56} className="text-amber" />
                ) : (
                  <Bus size={56} className="text-amber" />
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-[#999]">
          No matter where you&apos;re headed, Kari has the right ride for you. Book now and travel
          your way.
        </p>
      </div>
    </section>
  );
}
