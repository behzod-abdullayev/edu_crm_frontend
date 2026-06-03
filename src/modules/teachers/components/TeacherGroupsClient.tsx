"use client";

import { useState } from "react";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useTeacherGroups } from "@/modules/teachers/hooks/useTeacher";
import { GroupDashboard } from "./GroupDashboard";
import { Button } from "@shared/components/ui/button";
import type { GroupDto } from "@generated/models";

const STATUS_OPTS = ["all", "active", "archived"] as const;
type StatusOpt = (typeof STATUS_OPTS)[number];

export function TeacherGroupsClient() {
  const { data: user } = useCurrentUser();
  const [status, setStatus] = useState<StatusOpt>("active");
  const { data: groups, isLoading } = useTeacherGroups(user?.id ?? "", status);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Groups</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {groups?.length ?? 0} group{groups?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-1.5">
          {STATUS_OPTS.map((s) => (
            <Button
              key={s}
              variant={status === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (groups ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">No groups found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(groups ?? []).map((g: GroupDto) => (
            <GroupDashboard key={g.id} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}
