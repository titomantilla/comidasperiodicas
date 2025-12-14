import { useEffect, useMemo, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { restaurantsCol } from "../services/restaurants";

export function useRestaurants(groupId) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(restaurantsCol(groupId), (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRestaurants(rows);
      setLoading(false);
    });

    return () => unsub();
  }, [groupId]);

  const split = useMemo(() => {
    const unvisited = [];
    const visited = [];

    for (const r of restaurants) {
      if (r?.lastVisitAt) visited.push(r);
      else unvisited.push(r);
    }

    // simple ordering
    unvisited.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    visited.sort((a, b) => {
      const ad = a.lastVisitAt?.toDate?.()?.getTime?.() || 0;
      const bd = b.lastVisitAt?.toDate?.()?.getTime?.() || 0;
      return bd - ad;
    });

    return { unvisited, visited };
  }, [restaurants]);

  return { restaurants, ...split, loading };
}
