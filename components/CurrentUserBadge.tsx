"use client";

import { useEffect, useMemo, useState } from "react";
import { User as HeroUser } from "@heroui/react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { useAuthz } from "@/lib/authz/context";

export default function CurrentUserBadge() {
  const db = useMemo(() => getFirebaseDb(), []);
  const { user } = useAuthz();

  const [displayName, setDisplayName] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "userProfiles", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = (snap.data() as any) || {};
        setDisplayName(String(data?.displayName ?? user.displayName ?? ""));
        setEmail(String(data?.email ?? user.email ?? ""));
      },
      () => {
        setDisplayName(String(user.displayName ?? ""));
        setEmail(String(user.email ?? ""));
      },
    );
    return () => unsub();
  }, [db, user]);

  const initials = useMemo(() => {
    const dn = (displayName || "").trim();
    if (dn) {
      const parts = dn.split(/\s+/).filter(Boolean);
      const a = parts[0]?.[0] ?? "";
      const b = parts[1]?.[0] ?? "";
      return (a + b).toUpperCase();
    }
    const em = (email || "").trim();
    if (em) {
      const base = em.split("@")[0] || "";
      const a = base[0] ?? "";
      const b = base[1] ?? "";
      return (a + b).toUpperCase();
    }
    return "";
  }, [displayName, email]);

  return (
    <HeroUser
      name={displayName || "User"}
      description={email || undefined}
      avatarProps={{ name: initials }}
      className="cursor-pointer"
    />
  );
}


