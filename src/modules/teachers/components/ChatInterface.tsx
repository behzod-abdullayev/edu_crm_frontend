"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@shared/hooks/useWebSocket";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/components/ui/avatar";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import type { ChatConversation, ChatMessage } from "../types/teacher.types";
import { cn } from "@shared/lib/utils";
import { Send, ArrowLeft, CheckCheck } from "lucide-react";
import { useIsMobile } from "@shared/hooks/useIsMobile";

export function ChatInterface() {
  const { data: user } = useCurrentUser();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convLoading } = useQuery({
    queryKey: ["chat", "conversations", user?.id],
    queryFn: () => httpClient.get<ChatConversation[]>(`/chat/conversations`).then((r) => r.data),
    enabled: !!user?.id,
  });

  const { data: messages } = useQuery({
    queryKey: ["chat", "messages", activeConversation],
    queryFn: () =>
      httpClient
        .get<ChatMessage[]>(`/chat/conversations/${activeConversation}/messages`)
        .then((r) => r.data),
    enabled: !!activeConversation,
    refetchInterval: false,
  });

  // src/modules/teachers/components/ChatInterface.tsx fayli ichida:

useWebSocket({
  events: {
    CHAT_MESSAGE: ((payload: unknown) => {
      const msg = payload as ChatMessage;
      queryClient.setQueryData<ChatMessage[]>(
        ["chat", "messages", msg.id.split("::")[0]],
        (old) => (old ? [...old.filter((m) => m.id !== msg.id), msg] : [msg]),
      );
      void queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      setIsTyping(false);
    }) as () => void, // <-- Mana bu yerga kasting qo'shildi
    
    CHAT_TYPING: () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    },
    
    CHAT_READ: ((payload: unknown) => {
      const p = payload as { conversationId: string };
      void queryClient.invalidateQueries({ queryKey: ["chat", "messages", p.conversationId] });
    }) as () => void, // <-- Mana bu yerga ham kasting qo'shildi
  },
});

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !activeConversation || !user) return;

    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      content: messageInput.trim(),
      sentAt: new Date().toISOString(),
      isOptimistic: true,
    };

    queryClient.setQueryData<ChatMessage[]>(["chat", "messages", activeConversation], (old) => [
      ...(old ?? []),
      optimisticMsg,
    ]);
    setMessageInput("");

    try {
      const sent = await httpClient
        .post<ChatMessage>(`/chat/conversations/${activeConversation}/messages`, {
          content: optimisticMsg.content,
        })
        .then((r) => r.data);
      queryClient.setQueryData<ChatMessage[]>(["chat", "messages", activeConversation], (old) =>
        old ? old.map((m) => (m.id === optimisticId ? sent : m)) : [sent],
      );
    } catch {
      queryClient.setQueryData<ChatMessage[]>(["chat", "messages", activeConversation], (old) =>
        old ? old.filter((m) => m.id !== optimisticId) : [],
      );
    }
  }, [messageInput, activeConversation, user, queryClient]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (typingTimeout) clearTimeout(typingTimeout);
    const t = setTimeout(() => {}, 2000);
    setTypingTimeout(t);
  };

  const activeConv = conversations?.find((c) => c.id === activeConversation);
  const showList = !isMobile || !activeConversation;
  const showMessages = !isMobile || !!activeConversation;

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl border border-border overflow-hidden bg-card">
      {/* Conversation List */}
      {showList && (
        <div className={cn("flex flex-col", isMobile ? "w-full" : "w-80 border-r border-border flex-shrink-0")}>
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-base">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convLoading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : (conversations ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No conversations yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {(conversations ?? []).map((conv: ChatConversation) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveConversation(conv.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors",
                      activeConversation === conv.id && "bg-primary/5",
                    )}
                  >
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={conv.participantAvatarUrl} alt={conv.participantName} />
                      <AvatarFallback>{conv.participantName.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium text-sm truncate">{conv.participantName}</span>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold animate-in zoom-in-50 duration-200">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage ?? "No messages yet"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Area */}
      {showMessages && (
        <div className="flex-1 flex flex-col min-w-0">
          {!activeConversation ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select a conversation to start messaging
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                {isMobile && (
                  <button type="button" onClick={() => setActiveConversation(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <Avatar className="w-9 h-9">
                  <AvatarImage src={activeConv?.participantAvatarUrl} />
                  <AvatarFallback>{activeConv?.participantName?.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{activeConv?.participantName}</p>
                  {isTyping && <p className="text-xs text-muted-foreground animate-pulse">Typing…</p>}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(messages ?? []).map((msg: ChatMessage) => {
                  const isOwn = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2 max-w-[80%] animate-in fade-in slide-in-from-bottom-1 duration-200",
                        isOwn ? "ml-auto flex-row-reverse" : "mr-auto",
                      )}
                    >
                      {!isOwn && (
                        <Avatar className="w-7 h-7 flex-shrink-0 mt-1">
                          <AvatarImage src={msg.senderAvatarUrl} />
                          <AvatarFallback className="text-xs">{msg.senderName.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn("space-y-0.5", isOwn ? "items-end" : "items-start", "flex flex-col")}>
                        <div
                          className={cn(
                            "px-3 py-2 rounded-2xl text-sm leading-relaxed",
                            isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm",
                            msg.isOptimistic && "opacity-70",
                          )}
                        >
                          {msg.content}
                        </div>
                        <div className={cn("flex items-center gap-1", isOwn ? "flex-row-reverse" : "")}>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.sentAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isOwn && msg.readAt && <CheckCheck className="w-3 h-3 text-primary" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border flex items-center gap-2">
                <Input
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  className="flex-1"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => void sendMessage()}
                  disabled={!messageInput.trim()}
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
