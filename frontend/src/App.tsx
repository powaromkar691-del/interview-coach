import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import ClerkAuthProvider from "@/components/auth/ClerkAuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import Home from "@/pages/Home";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import InterviewSetup from "@/pages/InterviewSetup";
import InterviewRoom from "@/pages/InterviewRoom";
import InterviewReport from "@/pages/InterviewReport";
import ResumeAnalyzer from "@/pages/ResumeAnalyzer";
import TechnicalPractice from "@/pages/TechnicalPractice";
import Roadmap from "@/pages/Roadmap";
import History from "@/pages/History";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
function authed(page: ReactNode) {
  return (
    <ProtectedRoute>
      <AppShell>{page}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ClerkAuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/sign-up/*" element={<SignUp />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={authed(<Dashboard />)} />
        <Route path="/interview" element={authed(<InterviewSetup />)} />
        <Route path="/interview/:id" element={authed(<InterviewRoom />)} />
        <Route path="/interview/:id/report" element={authed(<InterviewReport />)} />
        <Route path="/resume" element={authed(<ResumeAnalyzer />)} />
        <Route path="/practice" element={authed(<TechnicalPractice />)} />
        <Route path="/roadmap" element={authed(<Roadmap />)} />
        <Route path="/history" element={authed(<History />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors />
    </ClerkAuthProvider>
  );
}
