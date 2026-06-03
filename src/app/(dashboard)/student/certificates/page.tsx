import type { Metadata } from "next";
import { StudentCertificatesClient } from "@/modules/students/components/StudentCertificatesClient";

export const metadata: Metadata = {
  title: "Certificates | EduCRM",
  robots: { index: false, follow: false },
};

export default function StudentCertificatesPage() {
  return <StudentCertificatesClient />;
}
