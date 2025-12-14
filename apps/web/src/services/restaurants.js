import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
  query,
  limit,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { getMemberProfile } from "./members";

export function restaurantsCol(groupId) {
  return collection(db, "groups", groupId, "restaurants");
}

export function restaurantDoc(groupId, restaurantId) {
  return doc(db, "groups", groupId, "restaurants", restaurantId);
}

function normalizeDateToTimestamp(value) {
  // acepta Date | Timestamp | null
  if (!value) return null;
  if (value?.toDate) return value; // Firestore Timestamp
  if (value instanceof Date) return Timestamp.fromDate(value);
  return null;
}

export async function createRestaurant({ groupId, user, data }) {
  let createdByUsername = "";
  try {
    const profile = await getMemberProfile({ groupId, uid: user.uid });
    createdByUsername = profile?.username?.trim?.() || "";
  } catch {
    // ignore
  }

  const payload = {
    name: data.name?.trim() || "",
    restaurantType: data.restaurantType?.trim() || "",
    neighborhood: data.neighborhood?.trim() || "",
    googleMapsUrl: data.googleMapsUrl?.trim() || "",
    websiteUrl: data.websiteUrl?.trim() || "",
    notes: data.notes?.trim() || "",

    createdAt: serverTimestamp(),
    createdByUid: user.uid,
    createdByEmail: user.email || "",
    createdByUsername,

    // compat (si en algún lado usabas createdBy)
    createdBy: user.uid,

    // snapshot última visita
    lastVisitId: null,
    lastVisitAt: null,
    lastRating: null,
    lastComeBack: null,
    lastVisitNotes: null,

    updatedAt: serverTimestamp(),
  };

  return addDoc(restaurantsCol(groupId), payload);
}

export async function updateRestaurant({ groupId, restaurantId, patch }) {
  const ref = restaurantDoc(groupId, restaurantId);
  return updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function addVisit({ groupId, restaurantId, user, visit }) {
  const visitsCol = collection(db, "groups", groupId, "restaurants", restaurantId, "visits");

  // si vino fecha, la respetamos; si no, serverTimestamp()
  const providedTs = normalizeDateToTimestamp(visit?.visitedAt) || normalizeDateToTimestamp(visit?.visitAt);
  const visitedAtValue = providedTs || serverTimestamp();

  const notes = visit.notes?.trim() || "";

  const visitPayload = {
    // nombre “oficial”
    visitedAt: visitedAtValue,
    // alias por compat si ya tenías visitAt en algún lado
    visitAt: visitedAtValue,

    rating: Number(visit.rating),
    comeBack: Boolean(visit.comeBack),

    // guardo ambos para que en consola no te confunda si tenías "comment"
    notes,
    comment: notes,

    restaurantId,

    createdAt: serverTimestamp(),
    createdBy: user.uid,
  };

  const visitRef = await addDoc(visitsCol, visitPayload);

  // snapshot en restaurant para filtrar/mostrar rápido
  await updateRestaurant({
    groupId,
    restaurantId,
    patch: {
      lastVisitId: visitRef.id,
      lastVisitAt: visitedAtValue,
      lastRating: Number(visit.rating),
      lastComeBack: Boolean(visit.comeBack),
      lastVisitNotes: notes,
    },
  });
}

async function findLatestVisitRef({ groupId, restaurantId }) {
  const visitsCol = collection(db, "groups", groupId, "restaurants", restaurantId, "visits");

  // 1) intento visitedAt desc
  try {
    const q1 = query(visitsCol, orderBy("visitedAt", "desc"), limit(1));
    const s1 = await getDocs(q1);
    if (!s1.empty) return s1.docs[0].ref;
  } catch {
    // ignore
  }

  // 2) fallback visitAt desc
  try {
    const q2 = query(visitsCol, orderBy("visitAt", "desc"), limit(1));
    const s2 = await getDocs(q2);
    if (!s2.empty) return s2.docs[0].ref;
  } catch {
    // ignore
  }

  // 3) fallback createdAt desc (debería existir en lo creado por la app)
  const q3 = query(visitsCol, orderBy("createdAt", "desc"), limit(1));
  const s3 = await getDocs(q3);
  if (!s3.empty) return s3.docs[0].ref;

  return null;
}

/**
 * Edita la ÚLTIMA visita: actualiza el doc de la visita y mantiene el snapshot del restaurante consistente.
 */
export async function updateLastVisit({ groupId, restaurantId, user, patch }) {
  const restRef = restaurantDoc(groupId, restaurantId);
  const restSnap = await getDoc(restRef);
  if (!restSnap.exists()) throw new Error("Restaurant no existe.");

  const rest = restSnap.data();
  const lastVisitId = rest?.lastVisitId;

  let visitRef = null;

  if (lastVisitId) {
    visitRef = doc(db, "groups", groupId, "restaurants", restaurantId, "visits", lastVisitId);
  } else {
    visitRef = await findLatestVisitRef({ groupId, restaurantId });
  }

  if (!visitRef) throw new Error("No se encontró una visita para editar.");

  const visitedAtTs = normalizeDateToTimestamp(patch?.visitedAt);
  const notes = typeof patch.notes !== "undefined" ? String(patch.notes || "").trim() : undefined;

  const visitUpdate = {
    ...(typeof patch.rating !== "undefined" ? { rating: Number(patch.rating) } : {}),
    ...(typeof patch.comeBack !== "undefined" ? { comeBack: Boolean(patch.comeBack) } : {}),
    ...(typeof notes !== "undefined" ? { notes, comment: notes } : {}),
    ...(visitedAtTs ? { visitedAt: visitedAtTs, visitAt: visitedAtTs } : {}),
    updatedAt: serverTimestamp(),
    updatedBy: user?.uid || null,
  };

  await updateDoc(visitRef, visitUpdate);

  const restaurantPatch = {
    ...(typeof patch.rating !== "undefined" ? { lastRating: Number(patch.rating) } : {}),
    ...(typeof patch.comeBack !== "undefined" ? { lastComeBack: Boolean(patch.comeBack) } : {}),
    ...(typeof notes !== "undefined" ? { lastVisitNotes: notes } : {}),
    ...(visitedAtTs ? { lastVisitAt: visitedAtTs } : {}),
    updatedAt: serverTimestamp(),
  };

  // si antes no estaba seteado lastVisitId, lo guardamos ahora
  if (!lastVisitId) restaurantPatch.lastVisitId = visitRef.id;

  await updateDoc(restRef, restaurantPatch);
}

/**
 * Deletes a restaurant and ALL its visits.
 * Firestore no borra subcolecciones automáticamente.
 */
export async function deleteRestaurant({ groupId, restaurantId }) {
  const visitsCol = collection(db, "groups", groupId, "restaurants", restaurantId, "visits");

  while (true) {
    const q = query(visitsCol, limit(500));
    const snap = await getDocs(q);
    if (snap.empty) break;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  await deleteDoc(restaurantDoc(groupId, restaurantId));
}
