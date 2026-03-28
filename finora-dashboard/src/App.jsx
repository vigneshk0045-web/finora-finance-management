import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "./components/layout/PublicLayout";
import AppLayout from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import Expenses from "./pages/Expenses";
import Investments from "./pages/Investments";
import Goals from "./pages/Goals";
import Reports from "./pages/Reports";
import NotificationsPage from "./pages/NotificationsPage";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/common/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/app/dashboard" element={<Dashboard />} />
        <Route path="/app/wallet" element={<Wallet />} />
        <Route path="/app/expenses" element={<Expenses />} />
        <Route path="/app/investments" element={<Investments />} />
        <Route path="/app/goals" element={<Goals />} />
        <Route path="/app/reports" element={<Reports />} />
        <Route path="/app/notifications" element={<NotificationsPage />} />
        <Route path="/app/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
