function safeText(v) {
  return typeof v === "string" ? v : "";
}

function formatRating(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  // 1 decimal si no es entero
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function ratingTone(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return "good"; // fallback
  if (n < 6) return "bad";
  if (n < 7) return "ok";
  return "good";
}

export default function RestaurantCard({ r, onClick }) {
  const visited = Boolean(r?.lastVisitAt);
  const rating = formatRating(r?.lastRating);
  const tone = visited ? ratingTone(r?.lastRating) : "";

  return (
    <button className="r-card" onClick={onClick} type="button">
      <div className="r-card-title">{safeText(r.name) || "(no name)"}</div>

      <div className="r-card-meta">
        <span>{safeText(r.restaurantType)}</span>
        <span>{safeText(r.neighborhood)}</span>
        <span>{safeText(r.city)}</span>
      </div>

      <div className="r-card-footer">
        <div
          className={[
            "r-badge",
            visited ? "is-visited" : "is-unvisited",
            visited ? `tone-${tone}` : "",
          ].join(" ")}
        >
          {visited ? "Visited" : "Not visited"}
        </div>

        {visited && rating ? (
          <div className="r-rating" aria-label={`Rating ${rating}`}>
            <span className="r-rating-star">★</span>
            <span className="r-rating-value">{rating}</span>
          </div>
        ) : null}
      </div>
    </button>
  );
}
