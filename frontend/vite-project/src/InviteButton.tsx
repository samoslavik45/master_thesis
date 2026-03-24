import React, { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface InviteButtonProps {
  groupId: number;
}

const InviteButton: React.FC<InviteButtonProps> = ({ groupId }) => {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultOpen, setResultOpen] = useState(false);
  const [resultStatus, setResultStatus] = useState<"success" | "error">("success");
  const [resultMessage, setResultMessage] = useState("");

  const handleOpen = () => {
    setUsername("");
    setError(null);
    setOpen(true);
  };

  const handleSendInvite = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setOpen(false);
      setResultStatus("error");
      setResultMessage("You must be logged in to send invites.");
      setResultOpen(true);
      return;
    }

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8000/api/groups/${groupId}/send_invite/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: username.trim() }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "There was an issue sending the invite.");
      }

      setOpen(false);
      setResultStatus("success");
      setResultMessage(data?.message || "Invite sent successfully.");
      setResultOpen(true);
    } catch (error) {
      console.error("Error:", error);
      setOpen(false);
      setResultStatus("error");
      setResultMessage(
        error instanceof Error ? error.message : "Something went wrong!"
      );
      setResultOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="
          rounded-full flex items-center gap-2
          border-[hsl(var(--primary))]/40
          bg-[hsl(var(--primary))]/10
          text-[hsl(var(--primary))]
          hover:bg-[hsl(var(--primary))]/15
          shadow-sm
        "
        onClick={handleOpen}
      >
        <Send className="w-4 h-4" />
        Send Invite
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
              Send invite
            </DialogTitle>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Enter the username of the person you want to invite to this group.
            </p>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. john_doe"
                className="
                  h-10 rounded-xl
                  border border-[hsl(var(--border))]
                  bg-[hsl(var(--accent))]
                  text-sm
                  shadow-sm
                  focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-0
                "
              />
            </div>

            {error && (
              <p className="text-sm text-[hsl(var(--destructive))]">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
            >
              Cancel
            </Button>

            <Button
              onClick={handleSendInvite}
              disabled={submitting}
              className="
                rounded-xl bg-[hsl(var(--primary))]
                text-[hsl(var(--primary-foreground))]
                hover:brightness-110 px-5
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
              {resultStatus === "success" ? "Invite sent" : "Invite failed"}
            </DialogTitle>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {resultMessage}
            </p>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              onClick={() => setResultOpen(false)}
              className="rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110 px-6"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InviteButton;