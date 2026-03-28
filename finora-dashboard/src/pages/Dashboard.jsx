import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PiggyBank, ReceiptText, WalletCards, Goal } from "lucide-react";
import api from "../api/client";
import { money, shortDate } from "../utils/format";
import StatCard from "../components/common/StatCard";
import SectionHeader from "../components/common/SectionHeader";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/dashboard/overview").then((r) => setData(r.data));
  }, []);

  if (!data) return <div className="loader-panel"><div className="loader" /></div>;
  const c = data.cards;

  const goToPayAgain = (tx) => {
    if (tx.category !== "Transfer") return;
    const target = tx.counterpartUser?._id || tx.counterpart;
    navigate(`/app/wallet?payAgain=${encodeURIComponent(target)}&amount=${encodeURIComponent(tx.amount)}&note=${encodeURIComponent(`Pay again · ${tx.counterpart || "contact"}`)}`);
  };

  return (
    <div className="page-stack">
      <SectionHeader eyebrow="Overview" title="Your money command center" subtitle="Everything important across cash, spending, investing, and goals." />

      <div className="stats-grid">
        <StatCard title="Net worth" value={money(c.netWorth)} hint="Wallet + portfolio value" icon={<PiggyBank size={16} />} />
        <StatCard title="Wallet balance" value={money(c.walletBalance)} hint="Ready for transfers and investments" icon={<WalletCards size={16} />} />
        <StatCard title="Monthly expenses" value={money(c.monthlyExpenses)} hint="Current month spend" icon={<ReceiptText size={16} />} />
        <StatCard title="Active goals" value={c.activeGoals} hint="Targets currently in progress" icon={<Goal size={16} />} />
      </div>

      <div className="two-col">
        <div className="card">
          <SectionHeader title="Recent transactions" subtitle="Tap transfer titles to open pay-again in Wallet." />
          <div className="list">
            {data.transactions.map((t) => (
              <div className="list-row" key={t._id}>
                <div>
                  {t.category === "Transfer" ? (
                    <button className="link-btn" onClick={() => goToPayAgain(t)}>{t.description}</button>
                  ) : (
                    <strong>{t.description}</strong>
                  )}
                  <span>{shortDate(t.createdAt)} · {t.category}</span>
                </div>
                <div className={t.type === "income" ? "positive" : "negative"}>{t.type === "income" ? "+" : "-"}{money(t.amount)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Goal progress" />
          <div className="goal-stack">
            {data.goalsProgress.map((g) => (
              <div key={g._id}>
                <div className="goal-head"><strong>{g.title}</strong><span>{g.progress}%</span></div>
                <div className="progress"><span style={{ width: `${g.progress}%` }} /></div>
              </div>
            ))}
          </div>
          <SectionHeader title="Latest notifications" />
          <div className="list compact">
            {data.notifications.map((n) => (
              <div className="list-row" key={n._id}>
                <div>
                  <strong>{n.title}</strong>
                  <span>{n.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
