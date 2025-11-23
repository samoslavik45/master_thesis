import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GroupDetail from "./GroupDetail";
import Swal from "sweetalert2";

/* shadcn/ui */
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Mail } from "lucide-react";

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

const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const navigate = useNavigate();

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
    setIsLoggedIn(checkTokenValidity());
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

  useEffect(() => {
    if (isLoggedIn) {
      fetchGroups();
      fetchInvites();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (groups.length > 0 && selectedGroupId === null) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups]);

  /* ------------ INVITE MODAL ------------ */
  const handleShowInvites = () => {
    if (invites.length === 0) {
      Swal.fire("No invites", "You currently have no invites.", "info");
      return;
    }

    const content = invites
      .map(
        (i) => `
      <div style="margin-bottom: 12px;">
        <p><strong>${i.group_name}</strong> invited by <em>${i.sender_name}</em></p>
        <button id="acc-${i.id}" class="swal2-confirm swal2-styled">Accept</button>
        <button id="rej-${i.id}" class="swal2-cancel swal2-styled">Reject</button>
      </div>
      `
      )
      .join("");

    Swal.fire({
      title: "Group Invites",
      html: content,
      showConfirmButton: false,
      didOpen: () => {
        invites.forEach((invite) => {
          document.getElementById(`acc-${invite.id}`)!.onclick = () =>
            handleAcceptInvite(invite.id);
          document.getElementById(`rej-${invite.id}`)!.onclick = () =>
            handleRejectInvite(invite.id);
        });
      },
    });
  };

  const handleAcceptInvite = async (id: number) => {
    const token = localStorage.getItem("accessToken");
    await fetch(`http://localhost:8000/api/invites/accept/${id}/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    Swal.fire("Accepted!", "You joined the group.", "success");
    fetchGroups();
    fetchInvites();
  };

  const handleRejectInvite = async (id: number) => {
    const token = localStorage.getItem("accessToken");
    await fetch(`http://localhost:8000/api/invites/reject/${id}/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    Swal.fire("Rejected!", "Invite declined.", "success");
    fetchInvites();
  };

  /* ------------ CREATE GROUP ------------ */
  const handleCreateGroup = () => {
    Swal.fire({
      title: "Create new group",
      input: "text",
      inputPlaceholder: "Group name",
      showCancelButton: true,
      confirmButtonText: "Create",
      preConfirm: async (name) => {
        if (!name) return;

        const token = localStorage.getItem("accessToken");
        const res = await fetch("http://localhost:8000/api/groups/create/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name }),
        });

        if (res.ok) {
          await fetchGroups();
        }
      },
    });
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

            <div className="flex gap-3 mt-4">
              <Button
                className="rounded-xl flex items-center gap-2"
                onClick={handleCreateGroup}
              >
                <Plus className="w-4 h-4" />
                New Group
              </Button>

              <Button
                variant="secondary"
                className="rounded-xl flex items-center gap-2"
                onClick={handleShowInvites}
              >
                <Mail className="w-4 h-4" />
                Invites
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
  </>
);

};

export default Groups;
