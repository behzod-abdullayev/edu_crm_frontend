"use client";

import { useState } from "react";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useTeacherGroups } from "@/modules/teachers/hooks/useTeacher";
import { StudentAnalyticsChart } from "./StudentAnalyticsChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import dynamic from "next/dynamic";

const AnalyticsCharts = dynamic(() => import("./TeacherAnalyticsCharts"), { ssr: false });

export function TeacherAnalyticsClient() {
  const { data: user } = useCurrentUser();
  const { data: groups } = useTeacherGroups(user?.id ?? "");
  const [groupId, setGroupId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split("T")[0] ?? "";
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0] ?? "");

  // Resolve the optional groupId — pass undefined when "all" is selected so
  // exactOptionalPropertyTypes is satisfied (no explicit undefined value in JSX prop).
  const selectedGroupId = groupId !== "all" ? groupId : undefined;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Performance and engagement insights.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1.5">
          <Label>Group</Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {(groups ?? []).map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>From</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Label>To</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Use spread to avoid passing undefined as an explicit prop value,
          which would violate exactOptionalPropertyTypes */}
      {selectedGroupId !== undefined ? (
        <StudentAnalyticsChart groupId={selectedGroupId} />
      ) : (
        <StudentAnalyticsChart />
      )}

      <AnalyticsCharts
        teacherId={user?.id ?? ""}
        {...(selectedGroupId !== undefined ? { groupId: selectedGroupId } : {})}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </div>
  );
}
