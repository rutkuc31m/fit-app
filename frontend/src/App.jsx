import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth.jsx";
import TopBar from "./components/TopBar";
import NavBar from "./components/NavBar";
import Login from "./pages/Login";
import Training from "./pages/Training";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import Recipes from "./pages/Recipes";
import Checkin from "./pages/Checkin";
import Today from "./pages/Today";
import PushPrompt from "./components/PushPrompt";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page mono text-mute">…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      {user && <TopBar />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/"         element={<Protected><Today /></Protected>} />
        <Route path="/recipes"  element={<Protected><Recipes /></Protected>} />
        <Route path="/training" element={<Protected><Training /></Protected>} />
        <Route path="/progress" element={<Protected><Progress /></Protected>} />
        <Route path="/checkin"  element={<Protected><Checkin /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <NavBar />}
      {user && <PushPrompt />}
    </>
  );
}
