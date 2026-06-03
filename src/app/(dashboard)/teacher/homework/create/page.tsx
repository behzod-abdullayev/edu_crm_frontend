import type { Metadata } from "next";
import { HomeworkCreator } from "@/modules/teachers/components/HomeworkCreator";

export const metadata: Metadata = {
  title: "Create Homework | EduCRM",
  robots: { index: false, follow: false },
};

export default function TeacherHomeworkCreatePage() {
  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Homework</h1>
        <p className="text-muted-foreground text-sm mt-1">Assign a new homework task to a group.</p>
      </div>
      <HomeworkCreator />
    </div>
  );
}
