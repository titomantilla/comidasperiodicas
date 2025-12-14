import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { GROUP_ID } from "../firebase";
import { getMemberProfile } from "../services/members";

export default function TopBar({ profile: profileProp }) {
  const { logout, user } = useAuth();
  const loc = useLocation();

  const [profileState, setProfileState] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Si te pasan profile (ej Dashboard), uso ese. Si no, uso el que cargo acá.
  const profile = profileProp ?? profileState;

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      // Si ya vino por prop, no hago nada.
      if (profileProp) return;

      if (!user?.uid) {
        setProfileState(null);
        return;
      }

      setLoadingProfile(true);
      try {
        const p = await getMemberProfile({ groupId: GROUP_ID, uid: user.uid });
        if (cancelled) return;

        // Si no existe members/{uid}, queda null y cae al fallback (email/Admin)
        setProfileState(p);
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, profileProp]);

  const base = import.meta.env.BASE_URL || "/";

  const username = useMemo(() => {
    const u = profile?.username?.trim();
    if (u) return u;
    const email = user?.email?.trim();
    if (email) return email;
    return "Admin";
  }, [profile?.username, user?.email]);

  const avatarUrl = useMemo(() => {
    const file = profile?.avatar?.trim();
    if (!file) return null;
    return `${base}avatars/${file}`;
  }, [profile?.avatar, base]);

  return (
    <div className="topbar">
      <div className="topbar-inner">
        <Link className="brand" to="/dashboard">
          Comidas Periódicas
        </Link>

        <div className="topbar-actions">
          <div className="topbar-profile">
            {avatarUrl ? (
              <img className="topbar-avatar" src={avatarUrl} alt={username} />
            ) : (
              <div className="topbar-avatar-fallback" aria-hidden="true" />
            )}
            <div className="topbar-username">
              {loadingProfile ? "…" : username}
            </div>
          </div>

          <Link
            className={`btn-link ${loc.pathname === "/restaurants/new" ? "active" : ""}`}
            to="/restaurants/new"
          >
            + Agregar Lugar
          </Link>

          <button className="btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
