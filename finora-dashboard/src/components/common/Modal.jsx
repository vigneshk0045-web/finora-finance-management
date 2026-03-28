export default function Modal({ open, title, onClose, children, width = "540px" }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="ghost-btn" onClick={onClose}>Close</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
