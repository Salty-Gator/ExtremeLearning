"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthz, type Role } from "./context";

type AuthGateProps = {
  minRole?: Role;
  fallback?: ReactNode;
  redirectTo?: string;
  children: ReactNode;
};

export default function AuthGate({ minRole = "viewer", fallback = null, redirectTo, children }: AuthGateProps) {
  const { isLoading, isAtLeast, isDisabled } = useAuthz();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = !isLoading && !isDisabled && isAtLeast(minRole);

  useEffect(() => {
    if (!isLoading && !allowed && redirectTo) {
      const next = `${redirectTo}?next=${encodeURIComponent(pathname || "/")}`;
      router.replace(next);
    }
  }, [allowed, isLoading, redirectTo, router, pathname]);

  if (isLoading) return null;
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}


