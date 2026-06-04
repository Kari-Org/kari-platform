import { Faq } from '@/components/sections/Faq';
import { Footer } from '@/components/sections/Footer';
import { Hero } from '@/components/sections/Hero';
import { Nav } from '@/components/sections/Nav';
import { RideOptions } from '@/components/sections/RideOptions';
import { Steps } from '@/components/sections/Steps';
import { Testimonials } from '@/components/sections/Testimonials';
import { Why } from '@/components/sections/Why';

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <Why />
      <Steps />
      <RideOptions />
      <Testimonials />
      <Faq />
      <Footer />
    </>
  );
}
