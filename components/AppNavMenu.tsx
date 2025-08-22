"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { useAuthz } from "@/lib/authz/context";
import ProfileModal from "@/components/ProfileModal";

type AppNavMenuProps = {
  trigger: React.ReactNode;
  requireAuth?: boolean; // if true, hide menu when user is not authenticated
};

export default function AppNavMenu({ trigger, requireAuth = true }: AppNavMenuProps) {
  const router = useRouter();
  const { isAdmin, user } = useAuthz();
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  if (requireAuth && !user) return null;

  return (
    <>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <div role="button" tabIndex={0} className="outline-none">
            {trigger}
          </div>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Navigation menu"
          onAction={(key) => {
            const action = String(key);
            if (action === "__profile__") {
              setProfileOpen(true);
              return;
            }
            router.push(action);
          }}
        >
          <DropdownItem key="__profile__">Profile</DropdownItem>
          <DropdownItem key="/chat">Chat</DropdownItem>
          {isAdmin ? (
            <>
              <DropdownItem key="/admin">Admin Panel</DropdownItem>
              <DropdownItem key="/vector-storage">Vector Storage</DropdownItem>
            </>
          ) : null}
        </DropdownMenu>
      </Dropdown>
      <ProfileModal isOpen={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}


