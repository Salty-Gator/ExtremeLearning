"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/button";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import LoginModal from "@/components/LoginModal";

export default function HomeLoginButton() {
  const pathname = usePathname();
  const auth = useMemo(() => getFirebaseAuth(), []);
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, [auth]);

  if (pathname !== "/") return null;
  if (user) return null;

  return (
    <>
      <Button size="sm" color="secondary" variant="solid" onPress={() => setOpen(true)}>
        Log in
      </Button>
      <LoginModal isOpen={open} onOpenChange={setOpen} />
    </>
  );
}


