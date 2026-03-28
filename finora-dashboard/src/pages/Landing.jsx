import { Link } from "react-router-dom";
import { ArrowRight, BadgeIndianRupee, ChartPie, ShieldCheck, Target } from "lucide-react";

const features = [
  ["Unified finance dashboard", "Track wallet, expenses, investments, reports, and goals from one product.", ChartPie],
  ["Smart money automation", "Wallet syncs with expenses and investment entries automatically.", BadgeIndianRupee],
  ["Goal-based planning", "Visual progress tracking for emergency fund, retirement, and more.", Target],
  ["Secure portfolio architecture", "Token-based authentication and protected finance workflows.", ShieldCheck],
];

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero card">
        <div>
          <div className="eyebrow">Resume-ready MERN fintech platform</div>
          <h1>Build financial clarity with a premium personal finance workspace.</h1>
          <p>Finora combines wallet management, spending control, investing, goals, analytics, and support workflows in one polished experience.</p>
          <div className="hero-actions">
            <Link className="primary-btn" to="/register">Start with demo flow <ArrowRight size={16} /></Link>
            <Link className="secondary-btn" to="/login">Use seeded demo</Link>
          </div>
          <div className="hero-note">Demo login after seeding: user1@gmail.com / finora123</div>
        </div>
        <div className="hero-panel">
          <div className="hero-metric"><span>Net Worth</span><strong>₹9.2L</strong></div>
          <div className="hero-grid">
            <div><small>Wallet</small><strong>₹12,000</strong></div>
            <div><small>Expenses</small><strong>On track</strong></div>
            <div><small>Investments</small><strong>5 holdings</strong></div>
            <div><small>Goals</small><strong>3 active</strong></div>
          </div>
        </div>
      </section>
      <section className="feature-grid">
        {features.map(([title, desc, Icon]) => (
          <article className="card feature-card" key={title}><div className="icon-badge"><Icon size={18} /></div><h3>{title}</h3><p>{desc}</p></article>
        ))}
      </section>
    </div>
  );
}
