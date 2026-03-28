import { Bell, ChartColumn, CircleDollarSign, Goal, LayoutDashboard, LogOut, PiggyBank, ReceiptText, Settings } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const links = [
  ["Dashboard", "/app/dashboard", LayoutDashboard],
  ["Wallet", "/app/wallet", CircleDollarSign],
  ["Expenses", "/app/expenses", ReceiptText],
  ["Investments", "/app/investments", PiggyBank],
  ["Goals", "/app/goals", Goal],
  ["Reports", "/app/reports", ChartColumn],
  ["Notifications", "/app/notifications", Bell],
  ["Profile", "/app/profile", Settings],
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand cardless">Finora</div>
          <p className="sidebar-copy">Personal finance operating system</p>
        </div>
        <nav className="sidebar-nav">
          {links.map(([label, href, Icon]) => (
            <NavLink key={href} to={href} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <button className="secondary-btn full" onClick={() => { logout(); navigate('/login'); }}><LogOut size={16} /> Sign out</button>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <div className="eyebrow">Welcome back</div>
            <h1>{user?.name || 'Finora user'}</h1>
          </div>
          <div className="user-chip">
            <div className="avatar">{(user?.name || 'F').slice(0, 1)}</div>
            <div>
              <strong>{user?.email}</strong>
              <span>{user?.preferences?.riskProfile || 'Moderate'} risk profile</span>
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
