import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { money, shortDate } from "../utils/format";
import Modal from "../components/common/Modal";
import SectionHeader from "../components/common/SectionHeader";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [topupOpen, setTopupOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [topAmount, setTopAmount] = useState("");
  const [transfer, setTransfer] = useState({ receiverId: "", amount: "", note: "" });
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const load = () =>
    Promise.all([
      api.get("/api/wallet/balance"),
      api.get("/api/wallet/transactions", { params: { q: search } }),
      api.get("/api/users/contacts"),
    ]).then(([b, t, c]) => {
      setBalance(b.data.balance);
      setTransactions(t.data);
      setContacts(c.data);
    });

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      api.get("/api/wallet/transactions", { params: { q: search } }).then((r) => setTransactions(r.data));
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    const payAgain = params.get("payAgain");
    if (!payAgain || contacts.length === 0) return;
    const note = params.get("note") || "Pay again";
    const amount = params.get("amount") || "";
    const matched = contacts.find((c) => c._id === payAgain || c.name === payAgain);
    if (!matched) return;
    setTransfer({ receiverId: matched._id, amount, note });
    setTransferOpen(true);
    setStatus(`Ready to pay ${matched.name} again.`);
    params.delete("payAgain");
    params.delete("amount");
    params.delete("note");
    setParams(params, { replace: true });
  }, [params, contacts, setParams]);

  const contactOptions = useMemo(
    () => contacts.map((c) => <option key={c._id} value={c._id}>{c.name}</option>),
    [contacts]
  );

  const openPayAgain = (tx) => {
    if (tx.category !== "Transfer") return;
    const matched = contacts.find((c) => c._id === tx.counterpartUser?._id || c.name === tx.counterpart);
    if (!matched) {
      setStatus("Contact not found for pay again.");
      navigate("/app/wallet");
      return;
    }
    setTransfer({ receiverId: matched._id, amount: String(tx.amount), note: `Pay again · ${tx.counterpart}` });
    setTransferOpen(true);
  };

  const topUp = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/wallet/topup", { amount: Number(topAmount), description: "Manual top up" });
      setStatus("Wallet topped up successfully.");
      setTopAmount("");
      setTopupOpen(false);
      load();
    } catch (err) {
      setStatus(err.response?.data?.message || "Could not top up");
    }
  };

  const send = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/wallet/transfer", { ...transfer, amount: Number(transfer.amount) });
      setStatus("Transfer completed successfully.");
      setTransfer({ receiverId: "", amount: "", note: "" });
      setTransferOpen(false);
      load();
    } catch (err) {
      setStatus(err.response?.data?.message || "Transfer failed");
    }
  };

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="Wallet"
        title="Cash flow and payment control"
        subtitle="Top up, send money, inspect every wallet movement, and use pay-again shortcuts from transfers."
        action={
          <div className="btn-row">
            <button className="secondary-btn" onClick={() => setTopupOpen(true)}>Top up</button>
            <button className="primary-btn" onClick={() => setTransferOpen(true)}>Send money</button>
          </div>
        }
      />

      <div className="hero-wallet card">
        <div>
          <span className="eyebrow">Available balance</span>
          <h2>{money(balance)}</h2>
          <p>Wallet stays in sync with new expense and investment entries.</p>
        </div>
        <div className="wallet-metrics">
          <div><small>Contacts</small><strong>{contacts.length}</strong></div>
          <div><small>Transactions</small><strong>{transactions.length}</strong></div>
        </div>
      </div>

      {status && <div className="status-banner">{status}</div>}

      <div className="two-col">
        <div className="card">
          <SectionHeader title="Recent transactions" action={<input className="search-input" placeholder="Search description" value={search} onChange={(e) => setSearch(e.target.value)} />} />
          <div className="list">
            {transactions.map((t) => (
              <div className="list-row" key={t._id}>
                <div>
                  {t.category === "Transfer" ? (
                    <button className="link-btn" onClick={() => openPayAgain(t)}>{t.description}</button>
                  ) : (
                    <strong>{t.description}</strong>
                  )}
                  <span>{shortDate(t.createdAt)} · {t.category}{t.category === "Transfer" ? " · Tap title for pay again" : ""}</span>
                </div>
                <div className={t.type === "income" ? "positive" : "negative"}>{t.type === "income" ? "+" : "-"}{money(t.amount)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Contacts" subtitle="Use these for wallet transfers." />
          <div className="contact-list">
            {contacts.map((c) => (
              <div className="contact-item" key={c._id}>
                <div className="avatar small">{c.name[0]}</div>
                <div>
                  <strong>{c.name}</strong>
                  <span>{c.email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={topupOpen} title="Top up wallet" onClose={() => setTopupOpen(false)}>
        <form className="form-grid" onSubmit={topUp}>
          <input placeholder="Amount" value={topAmount} onChange={(e) => setTopAmount(e.target.value)} />
          <button className="primary-btn full">Add funds</button>
        </form>
      </Modal>

      <Modal open={transferOpen} title="Send money" onClose={() => setTransferOpen(false)}>
        <form className="form-grid" onSubmit={send}>
          <select value={transfer.receiverId} onChange={(e) => setTransfer({ ...transfer, receiverId: e.target.value })}>
            <option value="">Choose contact</option>
            {contactOptions}
          </select>
          <input placeholder="Amount" value={transfer.amount} onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })} />
          <input className="full-span" placeholder="Note" value={transfer.note} onChange={(e) => setTransfer({ ...transfer, note: e.target.value })} />
          <button className="primary-btn full">Complete transfer</button>
        </form>
      </Modal>
    </div>
  );
}
