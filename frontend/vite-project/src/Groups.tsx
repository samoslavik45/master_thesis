import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* shadcn/ui */
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Mail, Bell } from "lucide-react";

import GroupDetail from "./GroupDetail";

interface Group {
  id: number;
  name: string;
  members: number[];
}

interface Invite {
  id: number;
  group_name: string;
  sender_name: string;
}

interface GroupNotification {
  id: number;
  notification_type: "mention";
  is_read: boolean;
  created_at: string;
  group_name: string;
  sender_name: string;
  message_content: string;
}


const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);

  /* --- NEW GROUP DIALOG STATE --- */
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);
  const [createGroupSubmitting, setCreateGroupSubmitting] = useState(false);
  const [groupResultOpen, setGroupResultOpen] = useState(false);
  const [groupResultStatus, setGroupResultStatus] = useState<"success" | "error">("success");
  const [groupResultMessage, setGroupResultMessage] = useState("");

  /* --- INVITES DIALOG STATE --- */
  const [invitesDialogOpen, setInvitesDialogOpen] = useState(false);
  const [invitesResultOpen, setInvitesResultOpen] = useState(false);
  const [invitesResultStatus, setInvitesResultStatus] = useState<"success" | "error" | "info">("info");
  const [invitesResultMessage, setInvitesResultMessage] = useState("");

  /* --- NOTIFICATIONS DIALOG STATE --- */
  const [notifications, setNotifications] = useState<GroupNotification[]>([]);
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);
  const [notificationsResultOpen, setNotificationsResultOpen] = useState(false);
  const [notificationsResultStatus, setNotificationsResultStatus] = useState<"success" | "error" | "info">("info");
  const [notificationsResultMessage, setNotificationsResultMessage] = useState("");
  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;

  /* ------------ AUTH CHECK ------------ */
  const redirectToLogin = () => navigate("/login");

  const checkTokenValidity = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const valid = checkTokenValidity();
    setIsLoggedIn(valid);

    if (!valid) {
      // nie je prihlásený → končíme loading, ukážeme login card
      setLoading(false);
      return;
    }

    // token je OK → načítame groups + invites
    Promise.all([fetchGroups(), fetchInvites(), fetchNotifications()])
      .catch((err) => {
        console.error("Error while loading groups/invites:", err);
        setIsLoggedIn(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!checkTokenValidity()) {
        setIsLoggedIn(false);
        clearInterval(interval);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  /* ------------ LOAD GROUPS + INVITES ------------ */
  const fetchGroups = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/api/groups/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      console.error("Error loading groups:", err);
    }
  };

  const fetchInvites = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/api/invites/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setInvites(data);
    } catch (err) {
      console.error("Error loading invites:", err);
    }
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/api/group-notifications/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  const handleShowNotifications = () => {
    setNotificationsDialogOpen(true);
  };

  const handleDismissNotification = async (id: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setNotificationsDialogOpen(false);
      setNotificationsResultStatus("error");
      setNotificationsResultMessage("You must be logged in to update notifications.");
      setNotificationsResultOpen(true);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8000/api/group-notifications/${id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete notification");
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
      setNotificationsDialogOpen(false);
      setNotificationsResultStatus("error");
      setNotificationsResultMessage("Failed to remove notification. Please try again.");
      setNotificationsResultOpen(true);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchGroups();
      fetchInvites();
      fetchNotifications();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (groups.length > 0 && selectedGroupId === null) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  /* ------------ INVITE MODAL (shadcn) ------------ */
  const handleShowInvites = () => {
    if (invites.length === 0) {
      setInvitesResultStatus("info");
      setInvitesResultMessage("You currently have no invites.");
      setInvitesResultOpen(true);
      return;
    }
    setInvitesDialogOpen(true);
  };

  const handleAcceptInvite = async (id: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setInvitesDialogOpen(false);
      setInvitesResultStatus("error");
      setInvitesResultMessage("You must be logged in to accept invites.");
      setInvitesResultOpen(true);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8000/api/invites/accept/${id}/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to accept invite");
      }

      setInvitesResultStatus("success");
      setInvitesResultMessage("You joined the group.");
      await fetchGroups();
      await fetchInvites();
    } catch (err) {
      console.error("Error accepting invite:", err);
      setInvitesResultStatus("error");
      setInvitesResultMessage("Failed to accept invite. Please try again.");
    } finally {
      setInvitesDialogOpen(false);
      setInvitesResultOpen(true);
    }
  };

  const handleRejectInvite = async (id: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setInvitesDialogOpen(false);
      setInvitesResultStatus("error");
      setInvitesResultMessage("You must be logged in to reject invites.");
      setInvitesResultOpen(true);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8000/api/invites/reject/${id}/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to reject invite");
      }

      setInvitesResultStatus("success");
      setInvitesResultMessage("Invite declined.");
      await fetchInvites();
    } catch (err) {
      console.error("Error rejecting invite:", err);
      setInvitesResultStatus("error");
      setInvitesResultMessage("Failed to reject invite. Please try again.");
    } finally {
      setInvitesDialogOpen(false);
      setInvitesResultOpen(true);
    }
  };

  /* ------------ CREATE GROUP (shadcn) ------------ */
  const handleOpenCreateGroup = () => {
    setNewGroupName("");
    setCreateGroupError(null);
    setCreateGroupOpen(true);
  };

const handleConfirmCreateGroup = async () => {
  const name = newGroupName.trim();
  if (!name) {
    setCreateGroupError("Group name is required.");
    return;
  }

  const token = localStorage.getItem("accessToken");
  if (!token) {
    setCreateGroupOpen(false);
    setGroupResultStatus("error");
    setGroupResultMessage("You must be logged in to create a group.");
    setGroupResultOpen(true);
    return;
  }

  setCreateGroupSubmitting(true);
  setCreateGroupError(null);

  try {
    const res = await fetch("http://localhost:8000/api/groups/create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      // 🎯 špeciálne ošetríme chybu z backendu pre duplicitný názov
      if (body?.name && Array.isArray(body.name) && body.name.length > 0) {
        setCreateGroupError(body.name[0]); // "Group with this name already exists."
        return; // dialog ostane otvorený, hláška sa zobrazí pod inputom
      }

      // generická chyba (napr. iný problém)
      const msg =
        body?.detail ||
        body?.error ||
        "Failed to create group. Please try again.";

      setGroupResultStatus("error");
      setGroupResultMessage(msg);
      setCreateGroupOpen(false);
      setGroupResultOpen(true);
      return;
    }

    // ✅ úspech
    setGroupResultStatus("success");
    setGroupResultMessage("Group has been created successfully.");
    await fetchGroups();
    setCreateGroupOpen(false);
    setGroupResultOpen(true);
  } catch (err) {
    console.error("Error creating group:", err);
    setGroupResultStatus("error");
    setGroupResultMessage("Unexpected error occurred. Please try again.");
    setCreateGroupOpen(false);
    setGroupResultOpen(true);
  } finally {
    setCreateGroupSubmitting(false);
  }
};


  /* ------------ UI RENDER ------------ */
  if (!isLoggedIn) {
    return (
      <div className="w-full flex justify-center mt-20">
        <Card className="p-6 shadow-xl bg-card max-w-md text-center">
          <h2 className="text-2xl font-semibold mb-3">Groups</h2>
          <p className="text-muted-foreground">You must be logged in.</p>
          <Button onClick={redirectToLogin} className="mt-4">
            Login
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full flex justify-center mt-20">
        {/* prázdne pozadie / prípadný skeleton */}
      </div>
    );
  }

  return (
    <>
      {!isLoggedIn ? (
        <div className="w-full flex justify-center mt-20">
          <Card className="p-6 shadow-xl bg-card max-w-md text-center">
            <h2 className="text-2xl font-semibold mb-3">Groups</h2>
            <p className="text-muted-foreground">You must be logged in.</p>
            <Button onClick={redirectToLogin} className="mt-4">
              Login
            </Button>
          </Card>
        </div>
      ) : (
        <div
          className="
            w-full
            max-w-7xl
            mx-auto
            pt-10
            grid
            grid-cols-12
            gap-6
            px-6
            min-h-[calc(100vh-90px)]
            overflow-hidden
          "
        >
          {/* ---------- LEFT SIDEBAR: GROUP LIST ---------- */}
          <Card className="col-span-4 bg-card/70 backdrop-blur-xl border rounded-2xl shadow-xl flex flex-col">
            <CardHeader>
              <h2 className="text-xl font-semibold text-foreground">Your Groups</h2>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  className="h-10 rounded-xl flex items-center gap-2 px-3 text-sm shrink-0"
                  onClick={handleOpenCreateGroup}
                >
                  <Plus className="w-4 h-4" />
                  New Group
                </Button>

                <Button
                  variant="outline"
                  className="
                    h-10 rounded-xl flex items-center gap-2 px-3 text-sm shrink-0
                    border-[hsl(var(--primary))/55]
                    bg-[hsl(var(--primary))/8]
                    text-[hsl(var(--primary))]
                    hover:bg-[hsl(var(--primary))/14]
                    transition-colors
                  "
                  onClick={handleShowInvites}
                >
                  <Mail className="w-4 h-4" />
                  <span>Invites</span>

                  {invites.length > 0 && (
                    <span
                      className="
                        inline-flex items-center justify-center
                        min-w-[1.25rem] h-5 px-1
                        rounded-full
                        bg-[hsl(var(--primary))]
                        text-[hsl(var(--primary-foreground))]
                        text-[0.68rem] font-semibold
                      "
                    >
                      {invites.length}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="
                    h-10 rounded-xl flex items-center gap-2 px-3 text-sm shrink-0
                    border-[hsl(var(--primary))/55]
                    bg-[hsl(var(--primary))/8]
                    text-[hsl(var(--primary))]
                    hover:bg-[hsl(var(--primary))/14]
                    transition-colors
                  "
                  onClick={handleShowNotifications}
                >
                  <Bell className="w-4 h-4" />

                  {unreadNotificationsCount > 0 && (
                    <span
                      className="
                        inline-flex items-center justify-center
                        min-w-[1.25rem] h-5 px-1
                        rounded-full
                        bg-[hsl(var(--primary))]
                        text-[hsl(var(--primary-foreground))]
                        text-[0.68rem] font-semibold
                      "
                    >
                      {unreadNotificationsCount}
                    </span>
                  )}
                </Button>

              </div>
            </CardHeader>

            {/* ⭐ FIXED HEIGHT + SCROLL ⭐ */}
            <div className="flex-1">
              <ScrollArea className="h-[calc(100vh-230px)] pr-2">
                {groups.length === 0 ? (
                  <p className="text-muted-foreground text-sm mt-6">
                    You are not part of any group.
                  </p>
                ) : (
                  <div className="space-y-3 pb-4">
                    {groups.map((g) => (
                      <div
                        key={g.id}
                        onClick={() => setSelectedGroupId(g.id)}
                        className={`
                          p-4 rounded-xl cursor-pointer transition border
                          ${
                            selectedGroupId === g.id
                              ? "bg-primary/10 border-primary"
                              : "bg-accent hover:bg-accent/70"
                          }
                        `}
                      >
                        <div className="font-semibold">{g.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {g.members.length} members
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </Card>

          {/* ---------- RIGHT SIDE: GROUP DETAIL ---------- */}
          <div className="col-span-8">
            <div className="h-[75vh] overflow-y-auto pr-4">
              {selectedGroupId ? (
                <GroupDetail
                  groupId={selectedGroupId}
                  onBack={() => setSelectedGroupId(null)}
                  updateGroups={fetchGroups}
                />
              ) : (
                <Card className="p-10 text-center bg-card/60 backdrop-blur-xl border rounded-2xl shadow-xl">
                  <p className="text-muted-foreground text-lg">
                    Select a group to see details.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- CREATE GROUP DIALOG ---------- */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
              Create new group
            </DialogTitle>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Choose a name for your new group.
            </p>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name"
              className="
                h-10 rounded-xl
                border border-[hsl(var(--border))]
                bg-[hsl(var(--accent))]
                text-sm
                shadow-sm
                focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-0
              "
            />
            {createGroupError && (
              <p className="text-sm text-[hsl(var(--destructive))]">
                {createGroupError}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setCreateGroupOpen(false)}
              className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
            >
              Cancel
            </Button>

            <Button
              onClick={handleConfirmCreateGroup}
              disabled={createGroupSubmitting}
              className="
                rounded-xl bg-[hsl(var(--primary))]
                text-[hsl(var(--primary-foreground))]
                hover:brightness-110 px-5
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              Create group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- CREATE GROUP RESULT DIALOG ---------- */}
      <Dialog open={groupResultOpen} onOpenChange={setGroupResultOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
              {groupResultStatus === "success" ? "Group created" : "Action failed"}
            </DialogTitle>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {groupResultMessage}
            </p>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              onClick={() => setGroupResultOpen(false)}
              className="rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110 px-6"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- INVITES LIST DIALOG ---------- */}
      <Dialog open={invitesDialogOpen} onOpenChange={setInvitesDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
              Group invites
            </DialogTitle>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Accept or reject invitations to join groups.
            </p>
          </DialogHeader>

          <div className="space-y-3 pt-2 max-h-[320px] overflow-y-auto pr-1">
            {invites.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                You currently have no invites.
              </p>
            ) : (
              invites.map((invite) => (
                <Card
                  key={invite.id}
                  className="border-[hsl(var(--border))] bg-[hsl(var(--accent))] rounded-xl p-4"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      {invite.group_name}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      Invited by <span className="font-medium">{invite.sender_name}</span>
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="
                        rounded-xl px-3 py-1.5 text-xs font-medium
                        border-[hsl(var(--border))]
                        bg-[hsl(var(--background))]
                        text-[hsl(var(--foreground))]
                        hover:bg-[hsl(var(--muted))]
                      "
                      onClick={() => handleRejectInvite(invite.id)}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="
                        rounded-xl px-3 py-1.5 text-xs font-medium
                        bg-[hsl(var(--primary))]
                        text-[hsl(var(--primary-foreground))]
                        hover:brightness-110
                      "
                      onClick={() => handleAcceptInvite(invite.id)}
                    >
                      Accept
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setInvitesDialogOpen(false)}
              className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- INVITES RESULT DIALOG ---------- */}
      <Dialog open={invitesResultOpen} onOpenChange={setInvitesResultOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
              {invitesResultStatus === "success"
                ? "Invite updated"
                : invitesResultStatus === "error"
                ? "Action failed"
                : "No invites"}
            </DialogTitle>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {invitesResultMessage}
            </p>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              onClick={() => setInvitesResultOpen(false)}
              className="rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110 px-6"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- NOTIFICATIONS LIST DIALOG ---------- */}
      <Dialog open={notificationsDialogOpen} onOpenChange={setNotificationsDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
              Notifications
            </DialogTitle>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Mentions from group discussions.
            </p>
          </DialogHeader>

          <div className="space-y-3 pt-2 max-h-[360px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                You currently have no notifications.
              </p>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className="rounded-xl p-4 border-[hsl(var(--primary))/40] bg-[hsl(var(--primary))/8]"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      {notification.sender_name} mentioned you in {notification.group_name}
                    </span>

                    <span className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
                      {notification.message_content}
                    </span>

                    <span className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="
                        rounded-xl px-3 py-1.5 text-xs font-medium
                        border-[hsl(var(--border))]
                        bg-[hsl(var(--background))]
                        text-[hsl(var(--foreground))]
                        hover:bg-[hsl(var(--muted))]
                      "
                      onClick={() => handleDismissNotification(notification.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setNotificationsDialogOpen(false)}
              className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Groups;
