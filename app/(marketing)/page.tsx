import TilqaiHero from "@/components/sections/tilqai-hero";
import RealityHookSection from "@/components/sections/reality-hook-section";
import DevelopmentSection from "@/components/sections/development-section";
import ApplicationsSection from "@/components/sections/applications-section";
import HowWeDeliver from "@/components/sections/how-we-deliver";
import WhyUsSection from "@/components/sections/why-us-section";
import IndustriesSection from "@/components/sections/industries-section";
import ROICalculatorSection from "@/components/sections/roi-calculator-section";
import BlogSection from "@/components/sections/blog-section";

import FaqSection from "@/components/sections/faq-section";
import AboutSection from "@/components/sections/about-section";
import ContactSection from "@/components/sections/contact-section";
import TilqaiFooter from "@/components/sections/tilqai-footer";

export default function IndexPage() {
  return (
    <>
      <TilqaiHero />
      <RealityHookSection />
      <DevelopmentSection />
      <ApplicationsSection />
      <HowWeDeliver />
      <WhyUsSection />
      <IndustriesSection />
      <ROICalculatorSection />
      <BlogSection />

      <FaqSection />
      <AboutSection />
      <ContactSection />
      <TilqaiFooter />
    </>
  );
}

