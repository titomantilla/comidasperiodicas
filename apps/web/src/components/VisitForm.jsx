import { useEffect, useMemo, useState } from "react";

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

function bool(v) {
  return Boolean(v);
}

function safeStr(v) {
  return typeof v === "string" ? v : "";
}

function toDateInput(value) {
  const d = value?.toDate?.() ?? (value instanceof Date ? value : null);
  if (!d) return "";
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function VisitForm({
  initial,
  onSubmit,
  disabled = false,
  submitLabel = "Save visit",
  showVisitedAt = true,
}) {
  const init = useMemo(
    () => ({
      rating: num(initial?.rating),
      comeBack: bool(initial?.comeBack),
      notes: safeStr(initial?.notes),
      visitedAt: toDateInput(initial?.visitedAt),
    }),
    [initial]
  );

  const [form, setForm] = useState(init);

  useEffect(() => setForm(init), [init]);

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (disabled) return;

    const payload = {
      rating: Number(form.rating),
      comeBack: Boolean(form.comeBack),
      notes: form.notes || "",
      visitedAt: form.visitedAt ? new Date(`${form.visitedAt}T12:00:00`) : null,
    };

    await onSubmit?.(payload);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {showVisitedAt ? (
        <label>
          Visited at
          <input
            type="date"
            value={form.visitedAt}
            onChange={(e) => setField("visitedAt", e.target.value)}
            disabled={disabled}
          />
        </label>
      ) : null}

      <label>
        Rating (1–10)
        <input
          type="number"
          min={1}
          max={10}
          value={form.rating}
          onChange={(e) => setField("rating", e.target.value)}
          disabled={disabled}
          required
        />
      </label>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={form.comeBack}
          onChange={(e) => setField("comeBack", e.target.checked)}
          disabled={disabled}
        />
        Would come back
      </label>

      <label>
        Notes
        <textarea
          rows={4}
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          disabled={disabled}
        />
      </label>

      <button className="btn-primary" type="submit" disabled={disabled}>
        {submitLabel}
      </button>
    </form>
  );
}
