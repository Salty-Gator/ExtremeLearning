"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";

export type Role = "guest" | "viewer" | "editor" | "admin";

type AuthzState = {
  user: User | null;
  role: Role;
  isAdmin: boolean;
  isDisabled: boolean;
  isLoading: boolean;
};

const AuthzContext = createContext<AuthzState | null>(null);

const ROLE_ORDER: Role[] = ["guest", "viewer", "editor", "admin"];

function isRoleAtLeast(role: Role, min: Role): boolean {
  return ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(min);
}

export function useAuthz(): AuthzState & { isAtLeast: (min: Role) => boolean } {
  const ctx = useContext(AuthzContext);
  if (!ctx) {
    throw new Error("useAuthz must be used within AuthzProvider");
  }
  return {
    ...ctx,
    isAtLeast: (min: Role) => isRoleAtLeast(ctx.role, min),
  };
}

export function AuthzProvider({ children }: { children: React.ReactNode }) {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const db = useMemo(() => getFirebaseDb(), []);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("guest");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);

  useEffect(() => {
    let profileUnsub: Unsubscribe | undefined;
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsLoading(true);

      if (!u) {
        setRole("guest");
        setIsAdmin(false);
        setIsDisabled(false);
        if (profileUnsub) profileUnsub();
        setIsLoading(false);
        return;
      }

      try {
        // Subscribe to role changes on the user profile
        const ref = doc(db, "userProfiles", u.uid);
        profileUnsub = onSnapshot(
          ref,
          (snap) => {
            const data = snap.data() as any | undefined;
            const adminFlag = data?.isAdmin === true;
            const disabledFlag = data?.isDisabled === true;
            setIsAdmin(adminFlag);
            setIsDisabled(disabledFlag);
            const r = adminFlag ? "admin" : ((data?.role as Role) || "viewer");
            setRole(ROLE_ORDER.includes(r) ? r : (adminFlag ? "admin" : "viewer"));
            setIsLoading(false);
          },
          () => {
            setIsAdmin(false);
            setIsDisabled(false);
            setRole("viewer");
            setIsLoading(false);
          },
        );
      } catch {
        setIsAdmin(false);
        setIsDisabled(false);
        setRole("viewer");
        setIsLoading(false);
      }
    });
    return () => {
      if (profileUnsub) profileUnsub();
      unsub();
    };
  }, [auth, db]);

  const value = useMemo(
    () => ({ user, role, isAdmin, isDisabled, isLoading }),
    [user, role, isAdmin, isDisabled, isLoading],
  );

  return <AuthzContext.Provider value={value}>{children}</AuthzContext.Provider>;
}


