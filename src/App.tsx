import { Suspense, lazy } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import routes from "tempo-routes";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load pages
const LoginPage = lazy(() => import("./pages/LoginPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));
const StudyLinksPage = lazy(() => import("./pages/StudyLinksPage"));
const StudyFilesPage = lazy(() => import("./pages/StudyFilesPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const DirectChatPage = lazy(() => import("./pages/DirectChatPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminPanelPage = lazy(() => import("./pages/AdminPanelPage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const QuestionsPage = lazy(() => import("./pages/QuestionsPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const PostsPage = lazy(() => import("./pages/PostsPage"));
const SubjectsPage = lazy(() => import("./pages/SubjectsPage"));
const ImportantResourcesPage = lazy(
  () => import("./pages/ImportantResourcesPage"),
);
// Happy Time tab removed as requested
// Only Leader and Co-Leader can edit tasks
const TodoPage = lazy(() => import("./pages/TodoPage"));
const TeamsPage = lazy(() => import("./pages/TeamsPage"));
const TeamChatPage = lazy(() => import("./pages/TeamChatPage"));
const GamingPage = lazy(() => import("./pages/GamingPage"));
const LinkHandler = lazy(() => import("./components/LinkHandler"));

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }
        >
          <>
            <Routes>
              <Route path="/" element={<Navigate to="/calendar" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <CalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes"
                element={
                  <ProtectedRoute>
                    <NotesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/study-links"
                element={
                  <ProtectedRoute>
                    <StudyLinksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/study-files"
                element={
                  <ProtectedRoute>
                    <StudyFilesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/questions"
                element={
                  <ProtectedRoute>
                    <QuizPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/direct-chat"
                element={
                  <ProtectedRoute>
                    <DirectChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/posts"
                element={
                  <ProtectedRoute>
                    <PostsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/important"
                element={
                  <ProtectedRoute>
                    <ImportantResourcesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/teams"
                element={
                  <ProtectedRoute>
                    <TeamsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team-chat/:teamId"
                element={
                  <ProtectedRoute>
                    <TeamChatPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/todo"
                element={
                  <ProtectedRoute>
                    <TodoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gaming"
                element={
                  <ProtectedRoute>
                    <GamingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="Admin">
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/adminpanel" element={<AdminPanelPage />} />
              <Route path="/link/:encodedUrl" element={<LinkHandler />} />
              {/* Add more routes for other features */}
              {/* Add Tempo routes */}
              {import.meta.env.VITE_TEMPO === "true" && (
                <Route path="/tempobook/*" />
              )}
            </Routes>
          </>
        </Suspense>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
