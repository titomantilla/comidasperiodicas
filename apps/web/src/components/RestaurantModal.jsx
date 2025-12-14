export default function RestaurantModal({ open, onClose, title, actions, children }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>

          <div className="modal-header-actions">
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>

            {actions ? <div className="modal-actions-slot">{actions}</div> : null}
          </div>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
