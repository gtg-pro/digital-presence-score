import { AssessmentCategoriesSection } from "@/features/landing/components/AssessmentCategoriesSection";
import { BenefitsSection } from "@/features/landing/components/BenefitsSection";
import { FAQSection } from "@/features/landing/components/FAQSection";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { HowItWorksSection } from "@/features/landing/components/HowItWorksSection";
import { LandingSectionsShell } from "@/features/landing/components/LandingSectionsShell";
import { ReadyToBuildSection } from "@/features/landing/components/ReadyToBuildSection";
import { SampleReportSection } from "@/features/landing/components/SampleReportSection";

export default function MarketingHomePage() {
  return (
    <>
      <HeroSection />
      <LandingSectionsShell>
        <HowItWorksSection />
        <AssessmentCategoriesSection />
        <SampleReportSection />
        <BenefitsSection />
        <FAQSection />
      </LandingSectionsShell>
      <ReadyToBuildSection />
    </>
  );
}

