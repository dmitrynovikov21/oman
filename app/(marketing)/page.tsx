import TilqaiHero from "@/components/sections/tilqai-hero";
import DevelopmentSection from "@/components/sections/development-section";
import ApplicationsSection from "@/components/sections/applications-section";
import HowWeDeliver from "@/components/sections/how-we-deliver";
import WhyUsSection from "@/components/sections/why-us-section";
import IndustriesSection from "@/components/sections/industries-section";

import FaqSection from "@/components/sections/faq-section";
import AboutSection from "@/components/sections/about-section";
import ContactSection from "@/components/sections/contact-section";
import TilqaiFooter from "@/components/sections/tilqai-footer";

export default function IndexPage() {
  return (
    <>
      <TilqaiHero />
      <DevelopmentSection />
      <ApplicationsSection />
      <HowWeDeliver />
      <WhyUsSection />
      <IndustriesSection />

      <FaqSection />
      <AboutSection />
      <ContactSection />
      <TilqaiFooter />
    </>
  );
}
