import Image from 'next/image';
import { KariMark } from '@/components/KariMark';

export function Footer() {
  return (
    <>
      <section className="mx-auto grid max-w-container grid-cols-1 items-center gap-10 px-10 pb-[70px] pt-[50px] min-[900px]:grid-cols-2">
        <div>
          <h2 className="kari-h2 mb-4 text-ink">
            Ready to Ride?
            <br />
            Get Started with Kari Today!
          </h2>
          <p className="mb-6 text-[15px] leading-[1.6] text-[#666]">
            Download Kari today and enjoy stress-free commuting — whether you&apos;re booking a ride
            or earning behind the wheel.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-pill bg-brand px-[22px] py-[13px] text-sm font-semibold text-ink transition hover:bg-gold">
              Get the Kari App
            </button>
            <button className="rounded-pill bg-surface px-[22px] py-[13px] text-sm font-semibold text-white transition hover:opacity-90">
              Drive with Kari
            </button>
          </div>
        </div>
        <div className="flex justify-center">
          <Image
            src="/assets/landing-feature-card.png"
            alt="The Kari app"
            width={230}
            height={470}
            className="h-auto w-[230px] rounded-[28px] border-[6px] border-surface shadow-lift"
          />
        </div>
      </section>

      <footer className="bg-night px-10 py-[60px] text-center text-white">
        <KariMark size={70} className="mx-auto mb-1 text-brand" />
        <div className="font-wordmark font-bold leading-none tracking-[-3px] text-white text-[clamp(56px,12vw,88px)]">
          Kari
        </div>
        <div className="my-[34px] flex justify-center gap-9 text-[13px] text-[#aaa]">
          <a href="#" className="transition hover:text-white">
            PRIVACY
          </a>
          <a href="#" className="transition hover:text-white">
            TERMS
          </a>
          <a href="#" className="transition hover:text-white">
            CONTACT
          </a>
        </div>
        <div className="text-xs text-[#666]">© 2025 Kari · support@kari.com · +234 800-KARI-RIDE</div>
      </footer>
    </>
  );
}
