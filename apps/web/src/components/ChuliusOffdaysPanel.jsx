import { useEffect, useMemo, useRef, useState } from "react";

function atNoon(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}
function addDays(d, days) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, 12, 0, 0, 0);
}
function isBetweenInclusive(day, start, end) {
  return day.getTime() >= start.getTime() && day.getTime() <= end.getTime();
}

function formatDay(d) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(d);
}

function formatRange(start, end) {
  if (start.getTime() === end.getTime()) return formatDay(start);
  return `${formatDay(start)} – ${formatDay(end)}`;
}

function buildUpcomingOffdays({ seedStart, today, count }) {
  const upcoming = [];

  let start = atNoon(seedStart);
  let kind = "single"; // single -> double -> single -> ...

  while (upcoming.length < count) {
    const end = kind === "double" ? addDays(start, 1) : start;

    if (end.getTime() >= today.getTime()) {
      upcoming.push({ start, end, kind });
    }

    start = addDays(end, 7);
    kind = kind === "single" ? "double" : "single";
  }

  return upcoming;
}

export default function ChuliusOffdaysPanel({
  count = 8,
  seedStart = new Date(2025, 11, 14), // 14 Dic 2025
  imageSrc,
  title = "Francos:",
  subtitle = "Proximos",
}) {
  const today = atNoon(new Date());

  const offdays = useMemo(() => {
    return buildUpcomingOffdays({ seedStart, today, count });
  }, [seedStart, today.getFullYear(), today.getMonth(), today.getDate(), count]);

  const defaultImg = `${import.meta.env.BASE_URL}assets/chulius.jpg`;
  const img = imageSrc || defaultImg;

  const scrollerRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function updateArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft < max - 2);
  }

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => updateArrows());
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [offdays.length]);

  function scrollByPage(dir) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(220, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <div className="chulius-panel">
      <div className="chulius-panel-left">
        <img className="chulius-avatar" src={img} alt="Chulius" />
        <div className="chulius-panel-text">
          <div className="chulius-panel-title">{title}</div>
          <div className="chulius-panel-sub">{subtitle}</div>
        </div>
      </div>

      <div className="chulius-carousel">
        <button
          type="button"
          className="carousel-btn"
          onClick={() => scrollByPage(-1)}
          disabled={!canLeft}
          aria-label="Ver francos anteriores"
          title="Anterior"
        >
          ‹
        </button>

        <div className="chulius-offdays" ref={scrollerRef}>
          {offdays.map((o, idx) => {
            const isToday = isBetweenInclusive(today, atNoon(o.start), atNoon(o.end));
            const label = formatRange(o.start, o.end);

            return (
              <div
                key={`${o.start.toISOString()}-${idx}`}
                className={`offday-chip ${o.kind === "double" ? "double" : "single"} ${
                  isToday ? "today" : ""
                }`}
                title={label}
              >
                <div className="offday-chip-top">
                  {isToday ? (
                    <span className="offday-today">HOY</span>
                  ) : (
                    <span className="offday-upcoming">Franco</span>
                  )}
                  <span className="offday-kind">{o.kind === "double" ? "Doble" : "Simple"}</span>
                </div>

                <div className="offday-chip-date">{label}</div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="carousel-btn"
          onClick={() => scrollByPage(1)}
          disabled={!canRight}
          aria-label="Ver más francos"
          title="Siguiente"
        >
          ›
        </button>
      </div>
    </div>
  );
}
