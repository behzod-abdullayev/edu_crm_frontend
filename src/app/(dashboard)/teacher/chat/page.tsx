import type { Metadata } from "next";
import { TeacherChatClient } from "@/modules/teachers/components/TeacherChatClient";

export const metadata: Metadata = {
  title: "Chat | EduCRM",
  robots: { index: false, follow: false },
};

export default function TeacherChatPage() {
  return <TeacherChatClient />;
}
