"use client";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import { CertificateDownload } from "./CertificateDownload";
import { useFeatureFlag } from "@shared/hooks/useFeatureFlag";
import type { CertificateDto } from "./CertificateDownload";

export function StudentCertificatesClient() {
  const { data: user } = useCurrentUser();
  const certsEnabled = useFeatureFlag("certificates");

  const { data: certs, isLoading } = useQuery({
    queryKey: ["students", user?.id, "certificates"],
    queryFn: async () => {
      const res = await httpClient.get<CertificateDto[]>(`/students/${user?.id}/certificates`);
      return res.data;
    },
    enabled: !!user?.id && certsEnabled,
  });

  if (!certsEnabled) {
    return <div className="py-20 text-center text-muted-foreground text-sm">Certificates are not enabled.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Certificates</h1>
        <p className="text-muted-foreground text-sm mt-1">{(certs ?? []).length} certificate{(certs ?? []).length !== 1 ? "s" : ""} earned.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (certs ?? []).length === 0 ? (
        <div className="py-20 text-center space-y-2">
          <p className="text-muted-foreground font-medium">No certificates yet</p>
          <p className="text-sm text-muted-foreground">Complete a course to earn your first certificate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(certs ?? []).map((cert: CertificateDto) => <CertificateDownload key={cert.id} certificate={cert} />)}
        </div>
      )}
    </div>
  );
}