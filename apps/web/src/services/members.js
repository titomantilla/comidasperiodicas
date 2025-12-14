import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export function memberDoc(groupId, uid) {
  return doc(db, "groups", groupId, "members", uid);
}

export async function getMemberProfile({ groupId, uid }) {
  const snap = await getDoc(memberDoc(groupId, uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
