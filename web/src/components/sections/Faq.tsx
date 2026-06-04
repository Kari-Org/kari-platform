'use client';

import { useState } from 'react';
import { MinusSquare, PlusSquare } from '@/components/icons';

const QUESTIONS = [
  'How do I book a ride?',
  'Can I schedule a ride in advance?',
  'Is Kari safe?',
  'What documents do I need to sign up as a driver?',
  'How does Kari ensure rider and driver safety?',
  'Can I drive with Kari part-time?',
];

const ANSWER =
  'Open the Kari app, enter your destination, choose a ride tier and either accept the standard fare or negotiate your own price with a nearby driver.';

export function Faq() {
  const [open, setOpen] = useState(0); // first open by default; one at a time

  return (
    <section className="section-paper">
      <div className="mx-auto grid max-w-container grid-cols-1 gap-[50px] px-10 py-[70px] min-[900px]:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="kari-h2 mb-[18px] text-ink">
            Any Questions?
            <br />
            We got you
          </h2>
          <p className="text-[15px] leading-[1.6] text-[#666]">
            Whether you&apos;re a rider looking for a smooth experience or a driver ready to earn on
            your terms, our FAQs cover everything you need to know — from safety and payments to
            ride options and support.
          </p>
          <p className="mt-[18px] text-sm font-semibold text-ink">
            Got more questions? Reach out to our Support Team →
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {QUESTIONS.map((q, i) => {
            const isOpen = open === i;
            return (
              <div
                key={q}
                className={`rounded-card border px-[18px] py-4 transition-colors ${
                  isOpen ? 'border-ink' : 'border-line'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <span className="text-[15px] font-medium text-ink">{q}</span>
                  {isOpen ? (
                    <MinusSquare size={20} className="flex-none text-ink" />
                  ) : (
                    <PlusSquare size={20} className="flex-none text-ink" />
                  )}
                </button>
                {isOpen && <p className="mt-3 text-sm leading-[1.55] text-[#777]">{ANSWER}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
