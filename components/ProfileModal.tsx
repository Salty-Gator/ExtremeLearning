"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { useAuthz } from "@/lib/authz/context";
import { updateProfile } from "firebase/auth";

type ProfileModalProps = {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export default function ProfileModal({ isOpen, onOpenChange }: ProfileModalProps) {
	const db = useMemo(() => getFirebaseDb(), []);
	const { user } = useAuthz();

	const [loading, setLoading] = useState<boolean>(false);
	const [saving, setSaving] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const [email, setEmail] = useState<string>("");
	const [firstName, setFirstName] = useState<string>("");
	const [lastName, setLastName] = useState<string>("");
	const [displayName, setDisplayName] = useState<string>("");

	useEffect(() => {
		if (!isOpen) return;
		if (!user) return;
		let active = true;
		const load = async () => {
			setLoading(true);
			setError(null);
			setSuccess(null);
			try {
				const ref = doc(db, "userProfiles", user.uid);
				const snap = await getDoc(ref);
				const data = snap.exists() ? (snap.data() as any) : {};
				if (!active) return;
				setEmail(String(data?.email ?? user.email ?? ""));
				setFirstName(String(data?.firstName ?? ""));
				setLastName(String(data?.lastName ?? ""));
				setDisplayName(String(data?.displayName ?? user.displayName ?? ""));
			} catch (e: any) {
				if (!active) return;
				setError(e?.message || "Failed to load profile");
			} finally {
				if (active) setLoading(false);
			}
		};
		void load();
		return () => {
			active = false;
		};
	}, [db, isOpen, user]);

	const onSave = useCallback(async () => {
		if (!user) return;
		setSaving(true);
		setError(null);
		setSuccess(null);
		try {
			const trimmedFirst = firstName.trim();
			const trimmedLast = lastName.trim();
			const trimmedDisplay = displayName.trim();
			await setDoc(
				doc(db, "userProfiles", user.uid),
				{
					firstName: trimmedFirst || null,
					lastName: trimmedLast || null,
					displayName: trimmedDisplay || null,
					updatedAt: serverTimestamp(),
				},
				{ merge: true },
			);
			try {
				if (trimmedDisplay) {
					await updateProfile(user, { displayName: trimmedDisplay });
				}
			} catch {}
			setSuccess("Profile updated");
			setTimeout(() => onOpenChange(false), 600);
		} catch (e: any) {
			setError(e?.message || "Failed to save profile");
		} finally {
			setSaving(false);
		}
	}, [db, user, firstName, lastName, displayName, onOpenChange]);

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
			<ModalContent>
				{() => (
					<>
						<ModalHeader className="flex flex-col gap-1 items-center text-center">Profile</ModalHeader>
						<ModalBody className="gap-3">
							{error && <div className="text-danger text-sm">{error}</div>}
							{success && <div className="text-success text-sm">{success}</div>}
							<Input
								label="Email"
								value={email}
								isReadOnly
								type="email"
								classNames={{ inputWrapper: "bg-default-100", label: "text-secondary font-medium" }}
							/>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<Input
									label="First name"
									value={firstName}
									onValueChange={setFirstName}
									autoComplete="given-name"
									isDisabled={loading}
									classNames={{ inputWrapper: "bg-default-100", label: "text-secondary font-medium" }}
								/>
								<Input
									label="Last name"
									value={lastName}
									onValueChange={setLastName}
									autoComplete="family-name"
									isDisabled={loading}
									classNames={{ inputWrapper: "bg-default-100", label: "text-secondary font-medium" }}
								/>
							</div>
							<Input
								label="Display name"
								value={displayName}
								onValueChange={setDisplayName}
								autoComplete="nickname"
								isDisabled={loading}
								classNames={{ inputWrapper: "bg-default-100", label: "text-secondary font-medium" }}
							/>
						</ModalBody>
						<ModalFooter>
							<Button variant="flat" onPress={() => onOpenChange(false)} isDisabled={saving}>Cancel</Button>
							<Button color="secondary" onPress={onSave} isLoading={saving}>
								Save
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}


