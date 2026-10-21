import { AssessmentCategoriesSection } from "@/features/landing/components/AssessmentCategoriesSection";
import { BenefitsSection } from "@/features/landing/components/BenefitsSection";
import { FAQSection } from "@/features/landing/components/FAQSection";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { HowItWorksSection } from "@/features/landing/components/HowItWorksSection";
import { SampleReportSection } from "@/features/landing/components/SampleReportSection";

export default function MarketingHomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <AssessmentCategoriesSection />
      <BenefitsSection />
      <SampleReportSection />
      <FAQSection />
    </>
  );
}
