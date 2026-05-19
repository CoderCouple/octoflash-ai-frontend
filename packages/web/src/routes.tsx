import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./layouts/app-shell";
import LoginPage from "./pages/login";
import VideosPage from "./pages/videos";
import ChannelsIndex from "./pages/channels";
import ChannelDetail from "./pages/channels/[id]";
import EditorIndex from "./pages/editor";
import EditorTemplates from "./pages/editor/templates";
import WorkspacePage from "./pages/workspace/[id]";
import NotFoundPage from "./pages/not-found";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/videos" replace /> },
  { path: "/login", element: <LoginPage /> },
  {
    element: <AppShell />,
    children: [
      { path: "/videos", element: <VideosPage /> },
      { path: "/channels", element: <ChannelsIndex /> },
      { path: "/channels/:id", element: <ChannelDetail /> },
      { path: "/editor", element: <EditorIndex /> },
      { path: "/editor/templates", element: <EditorTemplates /> },
      { path: "/workspace/:id", element: <WorkspacePage /> },
      // Catch-all 404 — keep last in this branch so explicit routes match first.
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
