import { createContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, GROUP_ID } from "../firebase";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [adminOk, setAdminOk] = useState(false);
  const [adminStatus, setAdminStatus] = useState("Checking auth...");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);
      setAdminOk(false);

      if (!u) {
        setAdminStatus("Signed out");
        setChecking(false);
        return;
      }

      try {
        setAdminStatus("Checking admin membership...");
        const ref = doc(db, "groups", GROUP_ID, "members", u.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setAdminStatus("Not authorized (no member record).");
          await signOut(auth);
          setChecking(false);
          return;
        }

        const role = snap.data()?.role;
        if (role !== "admin") {
          setAdminStatus("Not authorized (not admin).");
          await signOut(auth);
          setChecking(false);
          return;
        }

        setAdminOk(true);
        setAdminStatus("OK");
      } catch (e) {
        setAdminStatus(e?.message || "Auth check error");
        await signOut(auth);
      } finally {
        setChecking(false);
      }
    });

    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({
      user,
      checking,
      adminOk,
      adminStatus,
      logout: () => signOut(auth),
    }),
    [user, checking, adminOk, adminStatus]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
