"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useSocketEvent } from "@shared/hooks/useWebSocket";
import { SocketEvent } from "@/services/websocket/socket.events";
import type {
  ChatMessagePayload,
  ChatTypingPayload,
  ChatReadPayload,
} from "@/services/websocket/socket.events";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@shared/components/ui/avatar";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import type {
  ChatConversation,
  ChatMessage,
} from "../types/teacher.types";
import { cn } from "@shared/lib/utils";
import {
  Send,
  ArrowLeft,
  CheckCheck,
  MessageSquare,
  Search,
} from "lucide-react";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { format, isToday, isYesterday } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  return format(date, "HH:mm");
}

function formatConversationTime(isoString?: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd MMM");
}

/** Extract room ID from a message ID that uses the "::" convention. */
function extractRoomId(messageId: string): string {
  return messageId.split("::")[0] ?? messageId;
}

// ─── Message seen indicator ───────────────────────────────────────────────────

interface SeenIndicatorProps {
  isOwn: boolean;
  readAt?: string;
  isOptimistic?: boolean;
}

function SeenIndicator({ isOwn, readAt, isOptimistic }: SeenIndicatorProps) {
  if (!isOwn) return null;

  return (
    <span
      className={cn(
        "flex-shrink-0",
        readAt
          ? "text-[var(--brand-primary)]"
          : "text-[var(--text-muted)]",
      )}
      aria-label={readAt ? "Read" : isOptimistic ? "Sending" : "Sent"}
      title={readAt ? "Read" : isOptimistic ? "Sending…" : "Sent"}
    >
      {isOptimistic ? (
        <span
          className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block"
          aria-hidden="true"
        />
      ) : (
        <CheckCheck className="w-3 h-3" aria-hidden="true" />
      )}
    </span>
  );
}

// ─── Conversation list item ───────────────────────────────────────────────────

interface ConversationItemProps {
  conversation: ChatConversation;
  isActive: boolean;
  onClick: () => void;
}

function ConversationItem({
  conversation: conv,
  isActive,
  onClick,
}: ConversationItemProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left",
        "hover:bg-[var(--bg-surface-hover)] transition-colors duration-[var(--transition-fast)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
        "focus-visible:ring-[var(--border-focus)]",
        isActive && "bg-[var(--brand-primary)]/5",
      )}
      aria-current={isActive ? "true" : undefined}
    >
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarImage
          src={conv.participantAvatarUrl}
          alt={conv.participantName}
        />
        <AvatarFallback className="text-xs font-medium bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]">
          {conv.participantName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {conv.participantName}
          </span>
          <span className="flex-shrink-0 text-xs text-[var(--text-muted)]">
            {formatConversationTime(conv.lastMessageAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <p className="text-xs text-[var(--text-secondary)] truncate">
            {conv.lastMessage ?? "No messages yet"}
          </p>
          <AnimatePresence>
            {conv.unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={cn(
                  "flex-shrink-0 min-w-[20px] h-5 rounded-full px-1",
                  "bg-[var(--brand-primary)] text-white",
                  "text-[10px] font-bold flex items-center justify-center",
                )}
                aria-label={`${conv.unreadCount} unread messages`}
              >
                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Conversation list skeleton ───────────────────────────────────────────────

function ConversationListSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-[var(--border-default)]" aria-busy="true">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-hover)] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-32 rounded bg-[var(--bg-surface-hover)]" />
            <div className="h-3 w-48 rounded bg-[var(--bg-surface-hover)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
}

function MessageBubble({ message, isOwn, showAvatar }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex gap-2 max-w-[80%] sm:max-w-[72%]",
        isOwn ? "ml-auto flex-row-reverse" : "mr-auto",
        message.isOptimistic && "opacity-75",
      )}
    >
      {/* Avatar (other person only) */}
      {!isOwn && (
        <div className="flex-shrink-0 mt-auto">
          {showAvatar ? (
            <Avatar className="w-7 h-7">
              <AvatarImage src={message.senderAvatarUrl} alt={message.senderName} />
              <AvatarFallback className="text-[10px]">
                {message.senderName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-7" aria-hidden="true" />
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "flex flex-col gap-0.5",
          isOwn ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words",
            isOwn
              ? "bg-[var(--brand-primary)] text-white rounded-tr-sm"
              : "bg-[var(--bg-surface-hover)] text-[var(--text-primary)] rounded-tl-sm",
          )}
        >
          {message.content}
        </div>

        {/* Time + read receipt */}
        <div
          className={cn(
            "flex items-center gap-1 px-1",
            isOwn ? "flex-row-reverse" : "",
          )}
        >
          <time
            dateTime={message.sentAt}
            className="text-[10px] text-[var(--text-muted)]"
          >
            {formatMessageTime(message.sentAt)}
          </time>
          <SeenIndicator
            isOwn={isOwn}
            {...(message.readAt !== undefined ? { readAt: message.readAt } : {})}
            {...(message.isOptimistic !== undefined
              ? { isOptimistic: message.isOptimistic }
              : {})}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty conversations state ────────────────────────────────────────────────

function EmptyConversations() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center"
    >
      <div className="w-14 h-14 rounded-full bg-[var(--bg-surface-hover)] flex items-center justify-center">
        <MessageSquare
          className="w-7 h-7 text-[var(--text-muted)]"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          No conversations yet
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Messages from students will appear here.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Select conversation prompt ───────────────────────────────────────────────

function SelectConversationPrompt() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6"
    >
      <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-hover)] flex items-center justify-center">
        <MessageSquare
          className="w-8 h-8 text-[var(--text-muted)]"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Select a conversation
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Choose from the list to start messaging.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main ChatInterface ───────────────────────────────────────────────────────

export function ChatInterface() {
  const { user } = useCurrentUser();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────
  const { data: conversations, isLoading: convLoading } = useQuery<
    ChatConversation[]
  >({
    queryKey: ["chat", "conversations", user?.id],
    queryFn: () =>
      httpClient
        .get<ChatConversation[]>("/chat/conversations")
        .then((r) => r.data),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const { data: messages } = useQuery<ChatMessage[]>({
    queryKey: ["chat", "messages", activeConversationId],
    queryFn: () =>
      httpClient
        .get<ChatMessage[]>(
          `/chat/conversations/${activeConversationId}/messages`,
        )
        .then((r) => r.data),
    enabled: !!activeConversationId,
    staleTime: 0,
    refetchInterval: false,
  });

  // ── WebSocket event handlers ──────────────────────────────────────────

  useSocketEvent(
    SocketEvent.CHAT_MESSAGE,
    useCallback(
      (payload: ChatMessagePayload) => {
        const incomingMsg: ChatMessage = {
          id: payload.id,
          senderId: payload.senderId,
          senderName: payload.senderName,
          content: payload.body,
          sentAt: payload.createdAt,
          ...(payload.senderAvatar !== undefined
            ? { senderAvatarUrl: payload.senderAvatar }
            : {}),
        };

        queryClient.setQueryData<ChatMessage[]>(
          ["chat", "messages", payload.roomId],
          (old) => {
            if (!old) return [incomingMsg];
            // Deduplicate by ID
            const deduplicated = old.filter((m) => m.id !== incomingMsg.id);
            return [...deduplicated, incomingMsg];
          },
        );

        // Update conversation list preview
        void queryClient.invalidateQueries({
          queryKey: ["chat", "conversations", user?.id],
        });

        // Stop typing indicator when message arrives
        setIsTyping(false);
      },
      [queryClient, user?.id],
    ),
  );

  useSocketEvent(
    SocketEvent.CHAT_TYPING,
    useCallback(
      (payload: ChatTypingPayload) => {
        if (payload.roomId !== activeConversationId) return;
        if (payload.userId === user?.id) return;

        setIsTyping(payload.isTyping);

        // Auto-clear after 3s in case STOP event doesn't arrive
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (payload.isTyping) {
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3_000);
        }
      },
      [activeConversationId, user?.id],
    ),
  );

  useSocketEvent(
    SocketEvent.CHAT_READ,
    useCallback(
      (payload: ChatReadPayload) => {
        // Mark all messages in this room as read
        queryClient.setQueryData<ChatMessage[]>(
          ["chat", "messages", payload.roomId],
          (old) =>
            old
              ? old.map((m) =>
                  m.senderId === user?.id
                    ? { ...m, readAt: payload.readAt }
                    : m,
                )
              : old,
        );
      },
      [queryClient, user?.id],
    ),
  );

  // ── Scroll to bottom on new messages ─────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Focus input when conversation changes ─────────────────────────────
  useEffect(() => {
    if (activeConversationId && !isMobile) {
      inputRef.current?.focus();
    }
  }, [activeConversationId, isMobile]);

  // ── Cleanup timeout on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // ── Send message with optimistic update ──────────────────────────────
  const sendMessage = useCallback(async () => {
    const content = messageInput.trim();
    if (!content || !activeConversationId || !user) return;

    const optimisticId = `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      content,
      sentAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Optimistic append
    queryClient.setQueryData<ChatMessage[]>(
      ["chat", "messages", activeConversationId],
      (old) => [...(old ?? []), optimisticMsg],
    );
    setMessageInput("");

    try {
      const sent = await httpClient
        .post<ChatMessage>(
          `/chat/conversations/${activeConversationId}/messages`,
          { content },
        )
        .then((r) => r.data);

      // Replace optimistic with real
      queryClient.setQueryData<ChatMessage[]>(
        ["chat", "messages", activeConversationId],
        (old) =>
          old ? old.map((m) => (m.id === optimisticId ? sent : m)) : [sent],
      );
    } catch {
      // Rollback optimistic message on error
      queryClient.setQueryData<ChatMessage[]>(
        ["chat", "messages", activeConversationId],
        (old) => (old ? old.filter((m) => m.id !== optimisticId) : []),
      );
      // Restore input
      setMessageInput(content);
    }
  }, [messageInput, activeConversationId, user, queryClient]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessageInput(e.target.value);
    },
    [],
  );

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setMessageInput("");
    setIsTyping(false);
  }, []);

  const handleBack = useCallback(() => {
    setActiveConversationId(null);
    setIsTyping(false);
  }, []);

  // ── Filtered conversations ────────────────────────────────────────────
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!searchQuery.trim()) return conversations;
    const lower = searchQuery.toLowerCase();
    return conversations.filter((c) =>
      c.participantName.toLowerCase().includes(lower),
    );
  }, [conversations, searchQuery]);

  const activeConversation = useMemo(
    () => conversations?.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId],
  );

  // ── Layout: show list / messages based on mobile state ────────────────
  const showList = !isMobile || activeConversationId === null;
  const showMessages = !isMobile || activeConversationId !== null;

  return (
    <div
      className={cn(
        "flex rounded-xl border border-[var(--border-default)] overflow-hidden",
        "bg-[var(--bg-surface)] shadow-[var(--shadow-md)]",
        "h-[calc(100dvh-8rem)] sm:h-[calc(100dvh-10rem)]",
      )}
      role="region"
      aria-label="Chat"
    >
      {/* ── Conversation list ─────────────────────────────────────────── */}
      {showList && (
        <motion.div
          initial={isMobile ? { x: 0 } : false}
          className={cn(
            "flex flex-col border-r border-[var(--border-default)]",
            isMobile ? "w-full" : "w-80 flex-shrink-0",
          )}
        >
          {/* List header */}
          <div className="p-4 border-b border-[var(--border-default)] space-y-3">
            <h2 className="font-semibold text-base text-[var(--text-primary)]">
              Messages
            </h2>

            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations…"
                className={cn(
                  "w-full h-9 pl-8 pr-3 rounded-lg border border-[var(--border-default)]",
                  "bg-[var(--bg-surface-secondary)] text-sm text-[var(--text-primary)]",
                  "placeholder:text-[var(--text-muted)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]",
                  "focus:border-[var(--border-focus)] transition-all duration-[var(--transition-fast)]",
                )}
                aria-label="Search conversations"
              />
            </div>
          </div>

          {/* List body */}
          <div
            className="flex-1 overflow-y-auto divide-y divide-[var(--border-default)]"
            role="list"
            aria-label="Conversations"
          >
            {convLoading ? (
              <ConversationListSkeleton />
            ) : filteredConversations.length === 0 ? (
              <EmptyConversations />
            ) : (
              filteredConversations.map((conv) => (
                <div key={conv.id} role="listitem">
                  <ConversationItem
                    conversation={conv}
                    isActive={activeConversationId === conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                  />
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* ── Message area ─────────────────────────────────────────────── */}
      {showMessages && (
        <div className="flex-1 flex flex-col min-w-0">
          {!activeConversationId ? (
            <SelectConversationPrompt />
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-default)] flex-shrink-0">
                {isMobile && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className={cn(
                      "p-2 -ml-1 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center",
                      "hover:bg-[var(--bg-surface-hover)] transition-colors duration-[var(--transition-fast)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]",
                    )}
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
                  </button>
                )}

                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarImage
                    src={activeConversation?.participantAvatarUrl}
                    alt={activeConversation?.participantName ?? ""}
                  />
                  <AvatarFallback className="text-xs">
                    {activeConversation?.participantName
                      ?.slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {activeConversation?.participantName}
                  </p>
                  <AnimatePresence>
                    {isTyping && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-[var(--text-muted)]"
                        aria-live="polite"
                      >
                        Typing…
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Messages scroll area */}
              <div
                className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5"
                role="log"
                aria-label="Chat messages"
                aria-live="polite"
              >
                {(messages ?? []).map((msg, idx) => {
                  const isOwn = msg.senderId === user?.id;
                  const prevMsg = messages?.[idx - 1];
                  const showAvatar =
                    !isOwn &&
                    (prevMsg === undefined ||
                      prevMsg.senderId !== msg.senderId);

                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                    />
                  );
                })}
                <div ref={messagesEndRef} aria-hidden="true" />
              </div>

              {/* Message input */}
              <div className="p-3 sm:p-4 border-t border-[var(--border-default)] flex items-center gap-2 flex-shrink-0">
                <Input
                  ref={inputRef}
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  className="flex-1 min-h-[44px] sm:min-h-[40px]"
                  autoComplete="off"
                  inputMode="text"
                  aria-label="Message input"
                />
                <motion.div whileTap={{ scale: 0.93 }}>
                  <Button
                    type="button"
                    size="icon"
                    onClick={() => void sendMessage()}
                    disabled={!messageInput.trim()}
                    aria-label="Send message"
                    className="min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px]"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </motion.div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
