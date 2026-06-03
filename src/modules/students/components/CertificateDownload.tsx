"use client";

import { useState } from "react";
import { Download, Award } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { httpClient } from "@/services/api/axios.instance";
import { useToast } from "@shared/hooks/useToast";
import { cn } from "@shared/lib/utils";

export interface CertificateDto {
  id: string;
  courseName: string;
  courseId: string;
  fileKey: string;
  issueDate: string;
}

interface CertificateDownloadProps {
  certificate: CertificateDto;
  className?: string;
}

export function CertificateDownload({ certificate, className }: CertificateDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await httpClient.get<{ url: string }>(`/files/${certificate.fileKey}/signed-url`);
      const url = res.data.url;
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${certificate.courseName?.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Failed to download certificate");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card overflow-hidden",
        "hover:border-amber-400/60 hover:shadow-lg transition-all duration-300",
        "animate-in fade-in slide-in-from-bottom-2 duration-400",
        className
      )}
    >
      <div className="relative h-36 bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-50 flex flex-col items-center justify-center gap-2 border-b border-amber-200/60">
        <div className="w-14 h-14 rounded-full bg-amber-400/20 flex items-center justify-center">
          <Award className="w-8 h-8 text-amber-600" />
        </div>
        <div className="text-center">
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Certificate of Completion</p>
        </div>
        <div className="absolute inset-x-4 bottom-3 h-px bg-amber-300/40" />
        <div className="absolute inset-x-8 bottom-5 h-px bg-amber-300/20" />
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm line-clamp-2 leading-snug text-foreground">
            {certificate.courseName}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Issued {new Date(certificate.issueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          size="sm"
          className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
        >
          {isDownloading ? (
            <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isDownloading ? "Downloading…" : "Download PDF"}
        </Button>
      </div>
    </div>
  );
}