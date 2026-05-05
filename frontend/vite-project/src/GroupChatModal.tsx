import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Trash2, Reply, AtSign, Hash, X } from "lucide-react";
import {
  GroupChatArticleRef,
  GroupMemberLite,
  GroupMessage,
} from "./types";

interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  groupName?: string;
  members: GroupMemberLite[];
  articles: GroupChatArticleRef[];
}

type SuggestMode = "user" | "article" | null;

const GroupChatModal: React.FC<GroupChatModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  members,
  articles,
}) => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);

  const [selectedArticle, setSelectedArticle] = useState<GroupChatArticleRef | null>(null);
  const [mentionedUsers, setMentionedUsers] = useState<GroupMemberLite[]>([]);

  const [suggestMode, setSuggestMode] = useState<SuggestMode>(null);
  const [suggestQuery, setSuggestQuery] = useState("");
  const [triggerStart, setTriggerStart] = useState<number | null>(null);

  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [suppressSuggestUntilNextTrigger, setSuppressSuggestUntilNextTrigger] = useState(false);
  const previousMessageRef = useRef("");

  const token = localStorage.getItem("accessToken");

  const fetchMessages = async () => {
    try {
      setLoading(true);

      const response = await fetch(`http://localhost:8000/api/groups/${groupId}/messages/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch group messages.");
      }

      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching group messages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      previousMessageRef.current = "";
    } else {
      setReplyTo(null);
      setSelectedArticle(null);
      setMentionedUsers([]);
      setNewMessage("");
      setSuggestMode(null);
      setSuggestQuery("");
      setTriggerStart(null);
      setActiveSuggestionIndex(0);
      setSuppressSuggestUntilNextTrigger(false);
      previousMessageRef.current = "";
    }
  }, [isOpen, groupId]);

  const topLevelMessages = useMemo(
    () => messages.filter((m) => !m.parent_id),
    [messages]
  );

  const getReplies = (messageId: number) =>
  messages.filter((m) => m.parent_id && Number(m.parent_id) === messageId);

  const formatDateTime = (value: string) => {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const handleMessageChange = (value: string) => {
    const previousValue = previousMessageRef.current;
    const isDeleting = value.length < previousValue.length;

    setNewMessage(value);

    if (isDeleting && triggerStart !== null) {
      const tail = value.slice(triggerStart);
      if (!tail.startsWith("@") && !tail.startsWith("#")) {
        setSuggestMode(null);
        setSuggestQuery("");
        setTriggerStart(null);
        setActiveSuggestionIndex(0);
        setSuppressSuggestUntilNextTrigger(false);
        previousMessageRef.current = value;
        return;
      }

      setSuggestMode(null);
      setSuggestQuery("");
      setActiveSuggestionIndex(0);
      setSuppressSuggestUntilNextTrigger(true);
      previousMessageRef.current = value;
      return;
    }

    const match = value.match(/([@#])([a-zA-Z0-9_\- ]*)$/);

    if (!match) {
      setSuggestMode(null);
      setSuggestQuery("");
      setTriggerStart(null);
      setActiveSuggestionIndex(0);
      setSuppressSuggestUntilNextTrigger(false);
      previousMessageRef.current = value;
      return;
    }

    const trigger = match[1];
    const query = match[2] ?? "";
    const startIndex = value.length - match[0].length;

    if (suppressSuggestUntilNextTrigger && !isDeleting) {
      setSuppressSuggestUntilNextTrigger(false);
    }

    if (suppressSuggestUntilNextTrigger) {
      setSuggestMode(null);
      setSuggestQuery("");
      setTriggerStart(startIndex);
      setActiveSuggestionIndex(0);
      previousMessageRef.current = value;
      return;
    }

    setSuggestMode(trigger === "@" ? "user" : "article");
    setSuggestQuery(query.trimStart());
    setTriggerStart(startIndex);
    setActiveSuggestionIndex(0);

    previousMessageRef.current = value;
  };

  const userSuggestions = members.filter((member) =>
    member.username.toLowerCase().includes(suggestQuery.toLowerCase()) ||
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(suggestQuery.toLowerCase())
  );

  const articleSuggestions = articles.filter((article) =>
    article.title.toLowerCase().includes(suggestQuery.toLowerCase())
  );

  const insertUserMention = (member: GroupMemberLite) => {
    if (triggerStart === null) return;

    const before = newMessage.slice(0, triggerStart);
    const mentionText = `@${member.username} `;
    const nextValue = before + mentionText;

    setNewMessage(nextValue);

    setMentionedUsers((prev) =>
      prev.some((u) => u.id === member.id) ? prev : [...prev, member]
    );

    setSuggestMode(null);
    setSuggestQuery("");
    setTriggerStart(null);
    setActiveSuggestionIndex(0);
    setSuppressSuggestUntilNextTrigger(false);
    previousMessageRef.current = nextValue;
  };

  const insertArticleReference = (article: GroupChatArticleRef) => {
    if (triggerStart === null) return;

    const before = newMessage.slice(0, triggerStart);
    const articleText = `#${article.title} `;
    const nextValue = before + articleText;

    setNewMessage(nextValue);
    setSelectedArticle(article);

    setSuggestMode(null);
    setSuggestQuery("");
    setTriggerStart(null);
    setActiveSuggestionIndex(0);
    setSuppressSuggestUntilNextTrigger(false);
    previousMessageRef.current = nextValue;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSubmitting(true);

      const payload: Record<string, any> = {
        content: newMessage.trim(),
        mentioned_user_ids: mentionedUsers.map((u) => u.id),
      };

      if (selectedArticle) payload.article_id = selectedArticle.id;
      if (replyTo) payload.parent_id = replyTo.id;

      const response = await fetch(`http://localhost:8000/api/groups/${groupId}/messages/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to send message.");
      }

      await response.json();

      setNewMessage("");
      setReplyTo(null);
      setMentionedUsers([]);
      setSelectedArticle(null);
      setSuggestMode(null);
      setSuggestQuery("");
      setTriggerStart(null);

      await fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/groups/${groupId}/messages/${messageId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete message.");
      }

      await fetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const removeMentionedUser = (memberId: number) => {
    const memberToRemove = mentionedUsers.find((m) => m.id === memberId);
    if (!memberToRemove) return;

    const escapedUsername = memberToRemove.username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const mentionRegex = new RegExp(`(^|\\s)@${escapedUsername}(?=\\s|$)`, "g");

    const nextValue = newMessage
      .replace(mentionRegex, " ")
      .replace(/\s{2,}/g, " ")
      .trimStart();

    setMentionedUsers((prev) => prev.filter((m) => m.id !== memberId));
    setNewMessage(nextValue);
    previousMessageRef.current = nextValue;
  };

  const renderMessage = (message: GroupMessage, isReply = false) => (
    <div
      key={message.id}
      className={[
        "rounded-xl border shadow-sm transition-colors",
        isReply
          ? "ml-6 bg-[hsl(var(--muted))]/60 border-[hsl(var(--border))] px-3 py-2.5"
          : "bg-[hsl(var(--card))] border-[hsl(var(--border))] px-3 py-3 hover:bg-[hsl(var(--muted))]/55",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary))/0.12] text-[hsl(var(--primary))] text-[11px] font-semibold">
              {message.author_name?.slice(0, 1).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[hsl(var(--foreground))] leading-none">
                {message.author_name}
              </p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                {formatDateTime(message.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.article_title && (
              <Badge
                variant="outline"
                className="rounded-full border-[hsl(var(--primary))/0.35] bg-[hsl(var(--primary))/0.08] text-[hsl(var(--primary))]"
              >
                #{message.article_title}
              </Badge>
            )}

            {message.mentioned_usernames?.map((username) => (
              <Badge
                key={username}
                variant="secondary"
                className="rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]"
              >
                @{username}
              </Badge>
            ))}
          </div>

          {message.parent_preview && (
            <div className="mt-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/70 px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
              Replying to: {message.parent_preview}
            </div>
          )}

          <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-5 text-[hsl(var(--foreground))]">
            {message.content}
          </p>
        </div>

        {!isReply && (
          <div className="flex shrink-0 flex-col items-end gap-2">
            {message.can_delete && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-[hsl(var(--destructive))]/40 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10"
                onClick={() => handleDeleteMessage(message.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setReplyTo(message)}
            >
              <Reply className="w-4 h-4 mr-1" />
              Reply
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const currentSuggestions =
  suggestMode === "user"
    ? userSuggestions.slice(0, 8)
    : suggestMode === "article"
    ? articleSuggestions.slice(0, 8)
    : [];

const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (!showSuggestionBox) return;

  if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
    e.preventDefault();
    setActiveSuggestionIndex((prev) =>
      prev >= currentSuggestions.length - 1 ? 0 : prev + 1
    );
    return;
  }

  if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
    e.preventDefault();
    setActiveSuggestionIndex((prev) =>
      prev <= 0 ? currentSuggestions.length - 1 : prev - 1
    );
    return;
  }

  if (e.key === "Enter") {
    e.preventDefault();

    const selected = currentSuggestions[activeSuggestionIndex];
    if (!selected) return;

    if (suggestMode === "user") {
      insertUserMention(selected as GroupMemberLite);
    } else if (suggestMode === "article") {
      insertArticleReference(selected as GroupChatArticleRef);
    }
    return;
  }

  if (e.key === "Escape") {
    e.preventDefault();
    setSuggestMode(null);
    setSuggestQuery("");
    setTriggerStart(null);
    setActiveSuggestionIndex(0);
  }
};

  const showSuggestionBox =
    (suggestMode === "user" && userSuggestions.length > 0) ||
    (suggestMode === "article" && articleSuggestions.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="
          w-[min(96vw,1100px)]
          max-w-[1100px]
          h-[88vh]
          max-h-[88vh]
          p-0 overflow-hidden
          rounded-[26px]
          border border-[hsl(var(--border))]
          bg-[hsl(var(--card))]/95
          shadow-[0_24px_80px_rgba(0,0,0,0.22)]
          backdrop-blur-xl
        "
      >
        <div className="flex h-full flex-col overflow-hidden">
          <DialogHeader className="shrink-0 px-5 py-2 border-b border-[hsl(var(--border))] bg-[linear-gradient(to_right,hsl(var(--card)),hsl(var(--muted))/0.65)]">
            <DialogTitle className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[hsl(var(--primary))/0.12] text-[hsl(var(--primary))] border border-[hsl(var(--primary))/0.2]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span>Group Discussion</span>
                {groupName && (
                  <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">— {groupName}</span>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col px-5 py-3 overflow-hidden">
            {replyTo && (
              <div className="shrink-0 mb-3 flex items-start justify-between gap-3 rounded-2xl border border-[hsl(var(--primary))/0.25] bg-[hsl(var(--primary))/0.06] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                    Replying to
                  </p>
                  <p className="mt-1 truncate text-sm text-[hsl(var(--foreground))]">
                    {replyTo.author_name}: {replyTo.content}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setReplyTo(null)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}

            {selectedArticle && (
              <div className="shrink-0 mb-3 flex items-start justify-between gap-3 rounded-2xl border border-[hsl(var(--primary))/0.25] bg-[hsl(var(--primary))/0.06] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                    Referenced article
                  </p>
                  <p className="mt-1 truncate text-sm text-[hsl(var(--foreground))]">
                    #{selectedArticle.title}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setSelectedArticle(null)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))/0.35]">
              <ScrollArea className="h-full w-full px-3 py-3">
                {loading ? (
                  <div className="py-10 text-sm text-[hsl(var(--muted-foreground))]">
                    Loading messages...
                  </div>
                ) : topLevelMessages.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary))/0.1] text-[hsl(var(--primary))]">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                      No messages yet
                    </p>
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                      Start the discussion with your group.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-2">
                    {topLevelMessages.map((message) => (
                      <div key={message.id} className="space-y-2">
                        {renderMessage(message)}
                        {getReplies(message.id).map((reply) => renderMessage(reply, true))}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <Separator className="shrink-0" />

          <div className="relative shrink-0 px-5 py-2 bg-[hsl(var(--card))]">
            <div className="mb-1.5 flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="inline-flex items-center gap-1">
                <AtSign className="w-3 h-3" />
                mention user
              </span>
              <span className="inline-flex items-center gap-1">
                <Hash className="w-3 h-3" />
                reference article
              </span>
            </div>

            {!!mentionedUsers.length && (
              <div className="mb-2 flex flex-wrap gap-2">
                {mentionedUsers.map((member) => (
                  <Badge
                    key={member.id}
                    variant="secondary"
                    className="rounded-full flex items-center gap-1.5 pr-1 bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]"
                  >
                    <span>@{member.username}</span>
                    <button
                      type="button"
                      onClick={() => removeMentionedUser(member.id)}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10"
                      aria-label={`Remove mention ${member.username}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <Textarea
              value={newMessage}
              onChange={(e) => handleMessageChange(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Write a message... Use @username or #article title"
              className="
                min-h-[72px] max-h-[72px]
                rounded-2xl border-[hsl(var(--border))]
                bg-[hsl(var(--accent))]/55
                resize-none
                pr-28
                text-sm leading-6
              "
            />

            {showSuggestionBox && (
              <div className="absolute bottom-[108px] left-5 z-50 w-[min(420px,calc(100%-40px))] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl">
                <div className="px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                  {suggestMode === "user" ? "Mention user" : "Reference article"}
                </div>

                <div className="max-h-56 overflow-y-auto p-2">
                  {suggestMode === "user" &&
                    userSuggestions.slice(0, 8).map((member, index) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => insertUserMention(member)}
                        className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                          activeSuggestionIndex === index
                            ? "bg-[hsl(var(--muted))]"
                            : "hover:bg-[hsl(var(--muted))]"
                        }`}
                      >
                        <div className="text-sm font-medium text-[hsl(var(--foreground))]">
                          @{member.username}
                        </div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {member.first_name} {member.last_name}
                        </div>
                      </button>
                    ))}

                  {suggestMode === "article" &&
                    articleSuggestions.slice(0, 8).map((article, index) => (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => insertArticleReference(article)}
                        className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                          activeSuggestionIndex === index
                            ? "bg-[hsl(var(--muted))]"
                            : "hover:bg-[hsl(var(--muted))]"
                        }`}
                      >
                        <div className="text-sm font-medium text-[hsl(var(--foreground))] line-clamp-2">
                          #{article.title}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="mt-1.5 flex justify-end">
              <Button
                onClick={handleSendMessage}
                disabled={submitting || !newMessage.trim()}
                size="sm"
                className="rounded-full px-4 text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {submitting ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupChatModal;
