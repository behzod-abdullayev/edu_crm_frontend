"use client";
import { useState } from "react";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { StudentProfileForm } from "./StudentProfileForm";
import { ChangePasswordForm } from "@shared/components/ChangePasswordForm";
import { cn } from "@shared/lib/utils";

const TABS = ["Profile", "Password"] as const;
type Tab = typeof TABS[number];

export function StudentProfileClient() {
  const { data: user } = useCurrentUser();
  const [tab, setTab] = useState<Tab>("Profile");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account settings.</p>
      </div>

      <div className="flex border-b border-border gap-4">
        {TABS.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={cn("pb-2 text-sm font-medium border-b-2 transition-colors",
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Profile" && <StudentProfileForm studentId={user?.id ?? ""} />}
      {tab === "Password" && <ChangePasswordForm userId={user?.id ?? ""} role="student" />}
    </div>
  );
}