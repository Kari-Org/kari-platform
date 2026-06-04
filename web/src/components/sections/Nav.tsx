import { KariMark } from '@/components/KariMark';

const LINKS = ['Home', 'About us', 'Contact', 'How it works', 'FAQs'];

export function Nav() {
  return (
    <header className="mx-auto flex max-w-container items-center justify-between px-10 py-[22px]">
      <div className="flex items-center gap-2">
        <KariMark size={30} className="text-ink" />
        <span className="font-wordmark text-[22px] font-bold tracking-[-.5px] text-ink">Kari</span>
      </div>

      <nav className="hidden items-center gap-1.5 rounded-pill bg-surface p-[8px_10px] min-[900px]:flex">
        {LINKS.map((l, i) => (
          <a
            key={l}
            href="#"
            className={
              i === 0
                ? 'rounded-pill bg-brand px-4 py-[9px] text-sm font-semibold text-ink'
                : 'rounded-pill px-4 py-[9px] text-sm font-normal text-[#cfcfcf] transition hover:text-white'
            }
          >
            {l}
          </a>
        ))}
      </nav>

      <button className="rounded-pill bg-brand px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold">
        Sign up
      </button>
    </header>
  );
}
