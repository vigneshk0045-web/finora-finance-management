import { NavLink, Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="public-shell">
      <header className="public-header">
        <NavLink to="/" className="brand">Finora</NavLink>
        <nav>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <NavLink to="/login" className="nav-btn">Login</NavLink>
        </nav>
      </header>
      <Outlet />
      <footer className="public-footer">Built for portfolio-grade fintech product storytelling.</footer>
    </div>
  );
}
