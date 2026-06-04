import Image from 'next/image';

const QUOTE =
  '"Kari has completely transformed the way I travel around the city. The app is incredibly user-friendly, making it easy to book rides on the go. I love how quickly I can find a driver, and the real-time tracking gives me peace of mind. I can\'t imagine my daily commute without Kari!"';

export function Testimonials() {
  return (
    <section className="mx-auto max-w-container px-10 py-[70px]">
      {/* Pidgin headline — verbatim brand device, do not translate. */}
      <h2 className="kari-h2 mb-9 text-center text-ink">Wetin Una Dey Talk?</h2>
      <div className="mx-auto flex max-w-[880px] flex-col items-center gap-6 rounded-xl2 border border-dashed border-[#d8d8d8] p-8 md:flex-row">
        <div className="relative h-[130px] w-[110px] flex-none overflow-hidden rounded-lg2 bg-[#eee]">
          <Image
            src="/assets/photo-testimonial.jpg"
            alt="Liam Hawthorne"
            fill
            sizes="110px"
            className="object-cover"
          />
        </div>
        <div>
          <p className="mb-4 text-[17px] italic leading-[1.6] text-[#333]">{QUOTE}</p>
          <div className="text-[15px] font-bold text-ink">Liam Hawthorne</div>
          <div className="text-[13px] text-[#888]">Daily rider · Lagos</div>
        </div>
      </div>
    </section>
  );
}
