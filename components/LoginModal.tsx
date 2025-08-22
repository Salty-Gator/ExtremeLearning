"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { getFirebaseDb } from "@/lib/firebase/client";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  type UserCredential,
} from "firebase/auth";

type LoginModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function LoginModal({ isOpen, onOpenChange }: LoginModalProps) {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred: UserCredential = await signInWithPopup(auth, provider);
      const u = cred.user;
      try {
        const profileRef = doc(db, "userProfiles", u.uid);
        const snap = await getDoc(profileRef);
        const [firstName, ...rest] = (u.displayName || "").trim().split(" ");
        const lastName = rest.join(" ") || null;
        if (!snap.exists()) {
          await setDoc(profileRef, {
            userProfileId: u.uid,
            email: u.email || null,
            displayName: u.displayName || null,
            firstName: firstName || null,
            lastName: lastName,
            photoURL: u.photoURL || null,
            role: "viewer",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          });
        } else {
          await setDoc(
            profileRef,
            {
              updatedAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              ...(snap.data()?.firstName ? {} : { firstName: firstName || null }),
              ...(snap.data()?.lastName ? {} : { lastName }),
            },
            { merge: true },
          );
        }
      } catch {}
      try {
        const latest = await getDoc(doc(db, "userProfiles", u.uid));
        const data = latest.data() as any | undefined;
        const isAdmin = data?.isAdmin === true;
        onOpenChange(false);
        router.push(isAdmin ? "/admin" : "/chat");
      } catch {
        onOpenChange(false);
        router.push("/chat");
      }
    } catch (e: any) {
      setError(e?.message || "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  }, [auth, onOpenChange]);

  const handleEmail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const u = cred.user;
      try {
        const profileRef = doc(db, "userProfiles", u.uid);
        const snap = await getDoc(profileRef);
        const [firstName, ...rest] = (u.displayName || "").trim().split(" ");
        const lastName = rest.join(" ") || null;
        if (!snap.exists()) {
          await setDoc(profileRef, {
            userProfileId: u.uid,
            email: u.email || null,
            displayName: u.displayName || null,
            firstName: firstName || null,
            lastName: lastName,
            photoURL: u.photoURL || null,
            role: "viewer",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          });
        } else {
          await setDoc(
            profileRef,
            {
              updatedAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              ...(snap.data()?.firstName ? {} : { firstName: firstName || null }),
              ...(snap.data()?.lastName ? {} : { lastName }),
            },
            { merge: true },
          );
        }
      } catch {}
      try {
        const latest = await getDoc(doc(db, "userProfiles", u.uid));
        const data = latest.data() as any | undefined;
        const isAdmin = data?.isAdmin === true;
        onOpenChange(false);
        router.push(isAdmin ? "/admin" : "/chat");
      } catch {
        onOpenChange(false);
        router.push("/chat");
      }
    } catch (e: any) {
      setError(e?.message || "Email sign-in failed");
    } finally {
      setIsLoading(false);
    }
  }, [auth, db, email, password, onOpenChange, router]);

  const onPasswordKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!isLoading) {
          void handleEmail();
        }
      }
    },
    [handleEmail, isLoading],
  );

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 items-center text-center">Sign In</ModalHeader>
            <ModalBody className="gap-3">
              {error && <div className="text-danger text-sm">{error}</div>}
              <Input
                id="login-email"
                name="email"
                label="Email"
                value={email}
                onValueChange={setEmail}
                type="email"
                autoComplete="email"
                classNames={{ inputWrapper: "bg-default-100", label: "text-secondary font-medium" }}
              />
              <Input
                id="login-password"
                name="current-password"
                label="Password"
                value={password}
                onValueChange={setPassword}
                type="password"
                onKeyDown={onPasswordKeyDown}
                autoComplete="current-password"
                classNames={{ inputWrapper: "bg-default-100", label: "text-secondary font-medium" }}
              />
              <Button color="secondary" onPress={handleEmail} isLoading={isLoading}>
                Sign in
              </Button>
              <div className="my-1 flex items-center gap-2">
                <div className="flex-1 border-t border-default-200" />
                <span className="px-2 text-tiny text-default-500">Or continue with</span>
                <div className="flex-1 border-t border-default-200" />
              </div>
              <Button
                color="default"
                variant="flat"
                isDisabled
                aria-disabled="true"
                className="opacity-60 cursor-not-allowed"
              >
                Continue with Google
              </Button>
              <div className="text-center text-tiny text-secondary mt-1">
                Don&apos;t have an account? <Link href="#" className="text-tiny font-normal">Sign up</Link>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


