import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui'
import { AppShell } from '@/components/layout/AppShell'
import { useApp } from '@/store/AppStore'
import LandingPage from '@/pages/LandingPage'
import OnboardingPage from '@/pages/OnboardingPage'
import TodayPage from '@/pages/TodayPage'
import DashboardPage from '@/pages/DashboardPage'
import RoadmapPage from '@/pages/RoadmapPage'
import WeekDetailPage from '@/pages/WeekDetailPage'
import ProjectsPage from '@/pages/ProjectsPage'
import ProjectDetailPage from '@/pages/ProjectDetailPage'
import LearnPage from '@/pages/LearnPage'
import LearnModulePage from '@/pages/LearnModulePage'
import PracticePage from '@/pages/PracticePage'
import InterviewsPage from '@/pages/InterviewsPage'
import MockInterviewPage from '@/pages/MockInterviewPage'
import SystemDesignPage from '@/pages/SystemDesignPage'
import SystemDesignExercisePage from '@/pages/SystemDesignExercisePage'
import GoodfellowPage from '@/pages/GoodfellowPage'
import EvidencePage from '@/pages/EvidencePage'
import ApplicationsPage from '@/pages/ApplicationsPage'
import ReadinessPage from '@/pages/ReadinessPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import ResourcesPage from '@/pages/ResourcesPage'
import SettingsPage from '@/pages/SettingsPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ResumePage from '@/pages/ResumePage'

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { state, ready } = useApp()
  if (!ready) return null
  if (!state.profile?.onboardingComplete) return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  return (
    <TooltipProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route
          element={
            <RequireOnboarding>
              <AppShell />
            </RequireOnboarding>
          }
        >
          <Route path="/today" element={<TodayPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/roadmap/week/:weekNumber" element={<WeekDetailPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:moduleId" element={<LearnModulePage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/practice/:track" element={<PracticePage />} />
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route path="/interviews/mock/:mockId" element={<MockInterviewPage />} />
          <Route path="/system-design" element={<SystemDesignPage />} />
          <Route path="/system-design/:exerciseId" element={<SystemDesignExercisePage />} />
          <Route path="/goodfellow" element={<GoodfellowPage />} />
          <Route path="/evidence" element={<EvidencePage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/readiness" element={<ReadinessPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  )
}
