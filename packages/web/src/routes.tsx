import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./layouts/app-shell";
import HomePage from "./pages/home";
import PricingPage from "./pages/pricing";
import GalleryPage from "./pages/gallery";
import AboutPage from "./pages/about";
import ContactPage from "./pages/contact";
import TermsPage from "./pages/terms";
import PrivacyPage from "./pages/privacy";
import TeachersPage from "./pages/teachers";
import HelpPage from "./pages/help";
import WhatIsManimPage from "./pages/what-is-manim";
import LoginPage from "./pages/login";
import ProjectsPage from "./pages/videos";
import SourcesIndex from "./pages/sources";
import SourceDetail from "./pages/sources/[id]";
import TargetsPage from "./pages/targets";
import EditorEntryPage from "./pages/editor";
import PlaygroundPage from "./pages/playground";
import ProjectOverviewPage from "./pages/project";
import ProjectEditorPage from "./pages/project/editor";
import SettingsPage from "./pages/settings";
import CredentialsPage from "./pages/credentials";
import BillingPage from "./pages/billing";
import BillingPlansPage from "./pages/billing/plans";
import WorkflowListPage from "./pages/workflow";
import WorkspacePage from "./pages/workspace/[id]";
import NotFoundPage from "./pages/not-found";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/pricing", element: <PricingPage /> },
  { path: "/gallery", element: <GalleryPage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/terms", element: <TermsPage /> },
  { path: "/privacy", element: <PrivacyPage /> },
  { path: "/teachers", element: <TeachersPage /> },
  { path: "/help", element: <HelpPage /> },
  { path: "/what-is-manim", element: <WhatIsManimPage /> },
  { path: "/login", element: <LoginPage /> },
  // Full-screen workflow editor — no AppShell, no left nav.
  { path: "/workflow/:id", element: <ProjectEditorPage /> },
  {
    element: <AppShell />,
    children: [
      { path: "/projects", element: <ProjectsPage /> },
      { path: "/projects/:id", element: <ProjectOverviewPage /> },
      { path: "/workflow", element: <WorkflowListPage /> },
      { path: "/editor", element: <EditorEntryPage /> },
      { path: "/sources", element: <SourcesIndex /> },
      { path: "/sources/:id", element: <SourceDetail /> },
      { path: "/targets", element: <TargetsPage /> },
      { path: "/playground", element: <PlaygroundPage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/credentials", element: <CredentialsPage /> },
      { path: "/billing", element: <BillingPage /> },
      { path: "/billing/plans", element: <BillingPlansPage /> },
      { path: "/workspace/:id", element: <WorkspacePage /> },
      // Catch-all 404 — keep last in this branch so explicit routes match first.
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
