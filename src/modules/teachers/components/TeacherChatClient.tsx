"use client";
import { ChatInterface } from "./ChatInterface";
import { useFeatureFlag } from "@shared/hooks/useFeatureFlag";

export function TeacherChatClient() {
  const chatEnabled = useFeatureFlag("chat");
  if (!chatEnabled) return <div className="py-20 text-center text-muted-foreground text-sm">Chat is not enabled.</div>;
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-muted-foreground text-sm mt-1">Chat with your students.</p>
      </div>
      <ChatInterface />
    </div>
  );
}
