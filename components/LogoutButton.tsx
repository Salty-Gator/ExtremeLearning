"use client";

import { Button } from "@heroui/button";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";

export default function LogoutButton() {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, [auth]);

  if (!user) return null;
  if (pathname === "/") return null;
  return (
    <Button
      size="sm"
      variant="flat"
      onPress={async () => {
        try {
          await auth?.signOut();
        } finally {
          router.push("/");
        }
      }}
    >
      Log out
    </Button>
  );
}


