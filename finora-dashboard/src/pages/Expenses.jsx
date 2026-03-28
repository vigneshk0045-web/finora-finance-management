import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Pencil, Trash2 } from "lucide-react";
import api from "../api/client";
import { money, shortDate } from "../utils/format";
import Modal from "../components/common/Modal";
import SectionHeader from "../components/common/SectionHeader";
import StatCard from "../components/common/StatCard";

const initialForm = { title: "", merchant: "", category: "Food & Dining", amount: "" };

export default function Expenses() {
  const [summary, setSummary] = useState(null);
  const [budget, setBudget] = useState(null);
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [open, setOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [limit, setLimit] = useState("12000");
  const [status, setStatus] = useState("");

  const load = () =>
    Promise.all([
      api.get("/api/expenses/summary"),
      api.get("/api/expenses/budget"),
      api.get("/api/expenses/monthly"),
      api.get("/api/expenses/categories"),
      api.get("/api/expenses/recent", { params: { limit: 20 } }),
    ]).then(([s, b, m, c, r]) => {
      setSummary(s.data);
      setBudget(b.data);
      setSeries(m.data);
      setCategories(c.data.data);
      setRecent(r.data);
      setLimit(String(b.data.limit));
    });

  useEffect(() => {
    load();
  }, []);

  const clearModal = () => {
    setEditingId("");
    setForm(initialForm);
    setOpen(false);
  };

  const addOrUpdate = async (e) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount) };
    try {
      if (editingId) {
        await api.put(`/api/expenses/${editingId}`, payload);
        setStatus("Expense updated and wallet adjusted.");
      } else {
        await api.post("/api/expenses", payload);
        setStatus("Expense added and wallet synced.");
      }
      clearModal();
      load();
    } catch (err) {
      setStatus(err.response?.data?.message || "Could not save expense");
    }
  };

  const beginEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      merchant: item.merchant || "",
      category: item.category || "Food & Dining",
      amount: String(item.amount ?? ""),
    });
    setOpen(true);
  };

  const removeExpense = async (item) => {
    const ok = window.confirm(`Delete ${item.title}? This will restore ${money(item.amount)} to the wallet.`);
    if (!ok) return;
    try {
      await api.delete(`/api/expenses/${item._id}`);
      setStatus("Expense deleted and wallet restored.");
      load();
    } catch (err) {
      setStatus(err.response?.data?.message || "Could not delete expense");
    }
  };

  const saveBudget = async (e) => {
    e.preventDefault();
    try {
      await api.put("/api/expenses/budget", { limit: Number(limit) });
      setStatus("Budget updated.");
      setBudgetOpen(false);
      load();
    } catch (err) {
      setStatus(err.response?.data?.message || "Could not update budget");
    }
  };

  const chartData = useMemo(() => series, [series]);

  if (!summary) return <div className="loader-panel"><div className="loader" /></div>;

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="Expenses"
        title="Stay ahead of spending"
        subtitle="Track categories, monthly trend, edit/delete entries, and watch real-time budget health."
        action={
          <div className="btn-row">
            <button className="secondary-btn" onClick={() => setBudgetOpen(true)}>Set budget</button>
            <button
              className="primary-btn"
              onClick={() => {
                setEditingId("");
                setForm(initialForm);
                setOpen(true);
              }}
            >
              Add expense
            </button>
          </div>
        }
      />

      <div className="stats-grid">
        <StatCard title="This month" value={money(summary.total)} hint={`Budget ${money(summary.limit)}`} />
        <StatCard title="Remaining" value={money(summary.remaining)} hint={summary.status} positive={summary.status !== "Over Budget"} />
        <StatCard title="Over by" value={money(summary.overBy)} hint="Budget alert trigger" positive={summary.overBy === 0} />
      </div>

      {status && <div className="status-banner">{status}</div>}

      <div className="two-col">
        <div className="card">
          <SectionHeader title="6-month trend" />
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Category breakdown" />
          <div className="list">
            {categories.map((c) => (
              <div className="list-row" key={c.category}>
                <div>
                  <strong>{c.category}</strong>
                  <span>{c.pctOfBudget}% of budget</span>
                </div>
                <div>{money(c.total)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <SectionHeader title="Recent expenses" subtitle={`Monthly budget: ${money(budget?.limit || 0)}`} />
        <div className="list">
          {recent.map((item) => (
            <div className="list-row" key={item._id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.category} · {shortDate(item.occurredAt)}</span>
              </div>
              <div className="row-actions">
                <div className="negative">-{money(item.amount)}</div>
                <button className="icon-btn" onClick={() => beginEdit(item)} aria-label={`Edit ${item.title}`}>
                  <Pencil size={16} />
                </button>
                <button className="icon-btn danger" onClick={() => removeExpense(item)} aria-label={`Delete ${item.title}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={open} title={editingId ? "Edit expense" : "Add expense"} onClose={clearModal}>
        <form className="form-grid" onSubmit={addOrUpdate}>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Merchant" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option>Food & Dining</option>
            <option>Travel</option>
            <option>Bills & Utilities</option>
            <option>Shopping</option>
            <option>Entertainment</option>
          </select>
          <input placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <button className="primary-btn full" type="submit">{editingId ? "Save changes" : "Save expense"}</button>
        </form>
      </Modal>

      <Modal open={budgetOpen} title="Set monthly budget" onClose={() => setBudgetOpen(false)}>
        <form className="form-grid" onSubmit={saveBudget}>
          <input placeholder="Budget limit" value={limit} onChange={(e) => setLimit(e.target.value)} />
          <button className="primary-btn full">Update budget</button>
        </form>
      </Modal>
    </div>
  );
}
