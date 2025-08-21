"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Button } from "@heroui/button";
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
        if (!snap.exists()) {
          await setDoc(profileRef, {
            userProfileId: u.uid,
            email: u.email || null,
            displayName: u.displayName || null,
            photoURL: u.photoURL || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(profileRef, { updatedAt: serverTimestamp() }, { merge: true });
        }
      } catch {}
      onOpenChange(false);
      router.push("/chat");
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
        if (!snap.exists()) {
          await setDoc(profileRef, {
            userProfileId: u.uid,
            email: u.email || null,
            displayName: u.displayName || null,
            photoURL: u.photoURL || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(profileRef, { updatedAt: serverTimestamp() }, { merge: true });
        }
      } catch {}
      onOpenChange(false);
      router.push("/chat");
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
            <ModalHeader className="flex flex-col gap-1">Sign in</ModalHeader>
            <ModalBody className="gap-3">
              {error && <div className="text-danger text-sm">{error}</div>}
              <Button color="primary" variant="solid" onPress={handleGoogle} isLoading={isLoading}>
                Continue with Google
              </Button>
              <div className="text-tiny text-default-500">or use email</div>
              <Input
                label="Email"
                value={email}
                onValueChange={setEmail}
                type="email"
                classNames={{ inputWrapper: "bg-default-100" }}
              />
              <Input
                label="Password"
                value={password}
                onValueChange={setPassword}
                type="password"
                onKeyDown={onPasswordKeyDown}
                classNames={{ inputWrapper: "bg-default-100" }}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button color="secondary" onPress={handleEmail} isLoading={isLoading}>
                Sign in
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


