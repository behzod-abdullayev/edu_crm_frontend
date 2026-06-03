import type { Metadata } from "next";
import { LessonUploader } from "@/modules/teachers/components/LessonUploader";

export const metadata: Metadata = {
  title: "Upload Lesson | EduCRM",
  robots: { index: false, follow: false },
};

export default function TeacherLessonUploadPage() {
  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload Lesson</h1>
        <p className="text-muted-foreground text-sm mt-1">Add a new lesson to a group.</p>
      </div>
      <LessonUploader />
    </div>
  );
}
