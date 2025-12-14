import { useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar";
import RestaurantGrid from "../components/RestaurantGrid";
import RestaurantModal from "../components/RestaurantModal";
import VisitForm from "../components/VisitForm";
import RestaurantForm from "../components/RestaurantForm";
import { GROUP_ID } from "../firebase";
import { useAuth } from "../auth/useAuth";
import { useRestaurants } from "../hooks/useRestaurants";
import {
  addVisit,
  updateRestaurant,
  deleteRestaurant,
  updateLastVisit,
} from "../services/restaurants";
import { getMemberProfile } from "../services/members";

function formatTs(ts) {
  try {
    const d = ts?.toDate?.() ?? (ts instanceof Date ? ts : null);
    if (!d) return "";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

function pickCreatedBy(r) {
  return r?.createdByUsername || r?.createdByEmail || r?.createdByUid || r?.createdBy || "";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { unvisited, visited, loading } = useRestaurants(GROUP_ID);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("details"); // details | visit | edit | editVisit
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState("");

  const isVisited = Boolean(selected?.lastVisitAt);
  const title = useMemo(() => selected?.name || "Restaurant", [selected]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user?.uid) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      try {
        const p = await getMemberProfile({ groupId: GROUP_ID, uid: user.uid });
        if (cancelled) return;

        setProfile(
          p || {
            username: user.email || "Admin",
            avatar: "",
            email: user.email || "",
          }
        );
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleVisit(payload) {
    if (!selected) return;
    setActionErr("");
    setBusy(true);
    try {
      await addVisit({ groupId: GROUP_ID, restaurantId: selected.id, user, visit: payload });

      // update optimista del modal
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              lastVisitAt: payload.visitedAt || prev.lastVisitAt,
              lastRating: Number(payload.rating),
              lastComeBack: Boolean(payload.comeBack),
              lastVisitNotes: payload.notes || "",
            }
          : prev
      );

      setMode("details");
    } catch (e) {
      setActionErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit(form) {
    if (!selected) return;
    setActionErr("");
    setBusy(true);
    try {
      await updateRestaurant({
        groupId: GROUP_ID,
        restaurantId: selected.id,
        patch: {
          name: form.name,
          restaurantType: form.restaurantType,
          neighborhood: form.neighborhood,
          googleMapsUrl: form.googleMapsUrl,
          websiteUrl: form.websiteUrl,
          notes: form.notes,
        },
      });

      setSelected((prev) => (prev ? { ...prev, ...form } : prev));
      setMode("details");
    } catch (e) {
      setActionErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleEditVisit(payload) {
    if (!selected) return;
    setActionErr("");
    setBusy(true);
    try {
      await updateLastVisit({
        groupId: GROUP_ID,
        restaurantId: selected.id,
        user,
        patch: {
          rating: payload.rating,
          comeBack: payload.comeBack,
          notes: payload.notes,
          visitedAt: payload.visitedAt,
        },
      });

      // update optimista
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              lastVisitAt: payload.visitedAt || prev.lastVisitAt,
              lastRating: Number(payload.rating),
              lastComeBack: Boolean(payload.comeBack),
              lastVisitNotes: payload.notes || "",
            }
          : prev
      );

      setMode("details");
    } catch (e) {
      setActionErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;

    const ok = window.confirm(
      `¿Eliminar "${selected.name || "este restaurante"}"?\n\nEsto también elimina sus visitas.`
    );
    if (!ok) return;

    setActionErr("");
    setBusy(true);
    try {
      await deleteRestaurant({ groupId: GROUP_ID, restaurantId: selected.id });
      setSelected(null);
      setMode("details");
    } catch (e) {
      setActionErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <TopBar profile={profileLoading ? null : profile} />

      <div className="content">
        <h2 className="page-title">Listado de Lugares</h2>

        {loading ? <div className="muted">Cargando...</div> : null}

        <section className="section">
          <h3>Por Visitar</h3>
          <RestaurantGrid
            items={unvisited}
            onSelect={(r) => {
              setSelected(r);
              setMode("details");
              setActionErr("");
            }}
          />
        </section>

        <section className="section">
          <h3>Visitados</h3>
          <RestaurantGrid
            items={visited}
            onSelect={(r) => {
              setSelected(r);
              setMode("details");
              setActionErr("");
            }}
          />
        </section>
      </div>

      <RestaurantModal
        open={Boolean(selected)}
        onClose={() => {
          if (busy) return;
          setSelected(null);
          setMode("details");
          setActionErr("");
        }}
        title={title}
        actions={
          selected ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="btn-secondary"
              style={{
                background: "#7f1d1d",
                borderColor: "rgba(255,255,255,0.15)",
                color: "white",
                opacity: busy ? 0.7 : 1,
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Deleting..." : "Delete"}
            </button>
          ) : null
        }
      >
        {!selected ? null : (
          <>
            {actionErr ? (
              <div className="error" style={{ marginBottom: 12 }}>
                {actionErr}
              </div>
            ) : null}

            {mode === "details" ? (
              <div className="details">
                <div className="details-row">
                  <div>
                    <b>Tipo:</b> {selected.restaurantType || ""}
                  </div>
                  <div>
                    <b>Barrio / Localidad:</b> {selected.neighborhood || ""}
                  </div>
                </div>

                <div className="details-row">
                  <div>
                    <b>Maps:</b>{" "}
                    {selected.googleMapsUrl ? (
                      <a href={selected.googleMapsUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    ) : (
                      ""
                    )}
                  </div>

                  <div>
                    <b>Web / Socials:</b>{" "}
                    {selected.websiteUrl ? (
                      <a href={selected.websiteUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    ) : (
                      ""
                    )}
                  </div>
                </div>

                <div className="details-row">
                  <div>
                    <b>Cargado por:</b> {pickCreatedBy(selected)}
                  </div>
                  <div>
                    <b>Creado:</b> {formatTs(selected.createdAt)}
                  </div>
                </div>

                {isVisited ? (
                  <div className="details-row">
                    <div>
                      <b>Última visita:</b> {formatTs(selected.lastVisitAt)}
                    </div>
                    <div>
                      <b>Rating:</b> {selected.lastRating ?? ""}
                    </div>
                    <div>
                      <b>Volvería:</b> {selected.lastComeBack ? "Sí" : "No"}
                    </div>
                  </div>
                ) : (
                  <div className="muted">Por visitar</div>
                )}

                {selected.lastVisitNotes ? (
                  <div className="notes">
                    <b>Notas visita:</b> {selected.lastVisitNotes}
                  </div>
                ) : null}

                {selected.notes ? (
                  <div className="notes">
                    <b>Notas:</b> {selected.notes}
                  </div>
                ) : null}

                <div className="modal-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn-secondary" onClick={() => setMode("edit")} disabled={busy}>
                    Edit restaurant
                  </button>

                  {isVisited ? (
                    <button className="btn-secondary" onClick={() => setMode("editVisit")} disabled={busy}>
                      Edit last visit
                    </button>
                  ) : null}

                  <button className="btn-primary" onClick={() => setMode("visit")} disabled={busy}>
                    {isVisited ? "Add visit" : "Visit"}
                  </button>
                </div>
              </div>
            ) : null}

            {mode === "visit" ? (
              <>
                <h4>Add visit</h4>
                <VisitForm onSubmit={handleVisit} disabled={busy} submitLabel={busy ? "Saving..." : "Save visit"} />
              </>
            ) : null}

            {mode === "editVisit" ? (
              <>
                <h4>Edit last visit</h4>
                <VisitForm
                  initial={{
                    rating: selected.lastRating ?? "",
                    comeBack: Boolean(selected.lastComeBack),
                    notes: selected.lastVisitNotes || "",
                    visitedAt: selected.lastVisitAt || null,
                  }}
                  onSubmit={handleEditVisit}
                  disabled={busy}
                  submitLabel={busy ? "Saving..." : "Save changes"}
                />
              </>
            ) : null}

            {mode === "edit" ? (
              <>
                <h4>Edit restaurant</h4>
                <RestaurantForm
                  initial={selected}
                  submitLabel={busy ? "Saving..." : "Save changes"}
                  onSubmit={handleEdit}
                  disabled={busy}
                />
              </>
            ) : null}
          </>
        )}
      </RestaurantModal>
    </div>
  );
}
