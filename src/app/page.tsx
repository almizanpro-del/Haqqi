"use client";

import { useAppStore } from "@/lib/i18n/store";
import { Header } from "@/components/haqqi/header";
import { Footer } from "@/components/haqqi/footer";
import { HomeView } from "@/components/views/home-view";
import { IntakeView } from "@/components/views/intake-view";
import { CalculatorView } from "@/components/views/calculator-view";
import { WorkflowView } from "@/components/views/workflow-view";
import { DraftingView } from "@/components/views/drafting-view";
import { ReviewQueueView } from "@/components/views/review-queue-view";
import { LegalContentView } from "@/components/views/legal-content-view";
import { EvidenceView } from "@/components/views/evidence-view";
import { StoriesView } from "@/components/views/stories-view";
import { ComplaintsView } from "@/components/views/complaints-view";
import { CorruptionView } from "@/components/views/corruption-view";
import { LawyersView } from "@/components/views/lawyers-view";
import { EngagementView } from "@/components/views/engagement-view";
import { CourtView } from "@/components/views/court-view";
import { ForumView } from "@/components/views/forum-view";
import { RagSearchView } from "@/components/views/rag-search-view";
import { RegulatorView } from "@/components/views/regulator-view";
import { NotificationsView } from "@/components/views/notifications-view";
import { ModerationView } from "@/components/views/moderation-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { SettingsView } from "@/components/views/settings-view";
import { InboxView } from "@/components/views/inbox-view";
import { PrivacyView } from "@/components/views/privacy-view";
import { DocumentsView } from "@/components/views/documents-view";
import { MobileBottomNav } from "@/components/haqqi/mobile-bottom-nav";
import { OnboardingTour } from "@/components/haqqi/onboarding-tour";
import { ConsentGate } from "@/components/haqqi/consent-gate";

export default function Home() {
  const view = useAppStore((s) => s.view);

  if (view === "home") {
    return <HomeView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 pb-24 lg:pb-8">
        {view === "dashboard" && <DashboardView />}
        {view === "intake" && <IntakeView />}
        {view === "calculator" && <CalculatorView />}
        {view === "workflow" && <WorkflowView />}
        {view === "drafting" && <DraftingView />}
        {view === "review" && <ReviewQueueView />}
        {view === "legalContent" && <LegalContentView />}
        {view === "evidence" && <EvidenceView />}
        {view === "stories" && <StoriesView />}
        {view === "complaints" && <ComplaintsView />}
        {view === "corruption" && <CorruptionView />}
        {view === "lawyers" && <LawyersView />}
        {view === "engagement" && <EngagementView />}
        {view === "court" && <CourtView />}
        {view === "forum" && <ForumView />}
        {view === "rag" && <RagSearchView />}
        {view === "regulator" && <RegulatorView />}
        {view === "notifications" && <NotificationsView />}
        {view === "moderation" && <ModerationView />}
        {view === "settings" && <SettingsView />}
        {view === "inbox" && <InboxView />}
        {view === "privacy" && <PrivacyView />}
        {view === "documents" && <DocumentsView />}
      </main>
      <Footer />
      <MobileBottomNav />
      <OnboardingTour />
      <ConsentGate />
    </div>
  );
}
