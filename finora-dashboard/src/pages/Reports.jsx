import { useEffect, useState } from "react";
import api from "../api/client";
import { money } from "../utils/format";
import SectionHeader from "../components/common/SectionHeader";
import StatCard from "../components/common/StatCard";

export default function Reports() {
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.get("/api/reports/monthly").then((r) => setReport(r.data));
  }, []);

  const download = async (kind) => {
    try {
      const response = await api.get(`/api/reports/export/${kind}`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: response.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fallback = `finora-report.${kind}`;
      const header = response.headers["content-disposition"] || "";
      const match = header.match(/filename="?([^";]+)"?/i);
      link.download = match?.[1] || fallback;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatus(`${kind.toUpperCase()} report downloaded.`);
    } catch (err) {
      setStatus(err.response?.data?.message || `Could not download ${kind.toUpperCase()} report`);
    }
  };

  if (!report) return <div className="loader-panel"><div className="loader" /></div>;

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="Reports"
        title={`Monthly analytics · ${report.month}`}
        subtitle="Use this page for resume-worthy reporting, export files, and monthly review rituals."
        action={
          <div className="btn-row">
            <button className="secondary-btn" onClick={() => download("csv")}>Export CSV</button>
            <button className="primary-btn" onClick={() => download("pdf")}>Export PDF</button>
          </div>
        }
      />
      {status && <div className="status-banner">{status}</div>}
      <div className="stats-grid">
        <StatCard title="Wallet balance" value={money(report.walletBalance)} />
        <StatCard title="Expenses" value={money(report.totalExpenses)} />
        <StatCard title="Portfolio value" value={money(report.portfolioValue)} />
        <StatCard title="Savings rate" value={`${report.savingsRate}%`} />
      </div>
      <div className="card">
        <SectionHeader title="Expense categories" />
        <div className="list">
          {Object.entries(report.categories).map(([key, val]) => (
            <div className="list-row" key={key}>
              <div><strong>{key}</strong></div>
              <div>{money(val)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
