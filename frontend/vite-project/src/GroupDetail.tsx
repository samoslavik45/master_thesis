import React, { useState, useEffect } from 'react';
import InviteButton from './InviteButton'; 
import Swal from 'sweetalert2';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { Users, Bookmark, Tag, Trash2, LogOut, Send, FileDown, FileText } from "lucide-react";


interface Group {
    id: number;
    name: string;
    members: Array<{
      id: number;
      first_name: string;
      last_name: string;
      username: string;
    }>;
    admin: {
      id: number;
      first_name: string;
      last_name: string;
      username: string;
    };
  }

interface Article {
  id: number;
  title: string;
  authors: string[];
  pdf_file: string;
  created_at?: string;
}

interface GroupDetailProps {
  groupId: number;
  onBack: () => void;
  updateGroups: () => void; 
}

const GroupDetail: React.FC<GroupDetailProps> = ({ groupId, onBack, updateGroups }) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentUser, setCurrentUser] = useState<number | null>(null); 
  const [isAdmin, setIsAdmin] = useState(false);
  const sortByName = (a: any, b: any) =>
  a.first_name.localeCompare(b.first_name);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [publicTags, setPublicTags] = useState<string[]>([]);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false);
  const [tagArticleId, setTagArticleId] = useState<number | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagIsPublic, setTagIsPublic] = useState(false);
  const [tagSubmitting, setTagSubmitting] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  const [tagResultOpen, setTagResultOpen] = useState(false);
  const [tagResultStatus, setTagResultStatus] = useState<"success" | "error">("success");
  const [tagResultMessage, setTagResultMessage] = useState("");

  const [removeMemberConfirmOpen, setRemoveMemberConfirmOpen] = useState(false);
  const [removeMemberResultOpen, setRemoveMemberResultOpen] = useState(false);
  const [removeMemberSubmitting, setRemoveMemberSubmitting] = useState(false);

  const [unlikeConfirmOpen, setUnlikeConfirmOpen] = useState(false);
  const [unlikeResultOpen, setUnlikeResultOpen] = useState(false);
  const [unlikeSubmitting, setUnlikeSubmitting] = useState(false);
  const [unlikeTargetId, setUnlikeTargetId] = useState<number | null>(null);
  const [unlikeResultStatus, setUnlikeResultStatus] = useState<"success" | "error">("success");
  const [unlikeResultMessage, setUnlikeResultMessage] = useState("");

  const [leaveGroupConfirmOpen, setLeaveGroupConfirmOpen] = useState(false);
  const [leaveGroupResultOpen, setLeaveGroupResultOpen] = useState(false);
  const [leaveGroupSubmitting, setLeaveGroupSubmitting] = useState(false);
  const [leaveGroupResultStatus, setLeaveGroupResultStatus] = useState<"success" | "error">("success");
  const [leaveGroupResultMessage, setLeaveGroupResultMessage] = useState("");
  const [leaveGroupShouldRedirect, setLeaveGroupShouldRedirect] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [removeMemberResultStatus, setRemoveMemberResultStatus] = useState<"success" | "error">("success");
  const [removeMemberResultMessage, setRemoveMemberResultMessage] = useState("");

  const [deleteGroupConfirmOpen, setDeleteGroupConfirmOpen] = useState(false);
  const [deleteGroupResultOpen, setDeleteGroupResultOpen] = useState(false);
  const [deleteGroupSubmitting, setDeleteGroupSubmitting] = useState(false);
  const [deleteGroupResultStatus, setDeleteGroupResultStatus] = useState<"success" | "error">("success");
  const [deleteGroupResultMessage, setDeleteGroupResultMessage] = useState("");
  const [deleteGroupShouldRedirect, setDeleteGroupShouldRedirect] = useState(false);

  
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await fetch('http://localhost:8000/main/current_user/', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error('Chyba při získávání aktuálního uživatele');
          }
          const data = await response.json();
          setCurrentUser(data.id);
        } catch (error) {
          console.error('Error:', error);
        }
      }
    };

    fetchCurrentUser();
  }, []);


  useEffect(() => {
    const fetchGroupDetails = async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/groups/${groupId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });
          if (!response.ok) {
            throw new Error('Serverová chyba pri získavaní detailov skupiny.');
          }
          const data = await response.json();
          setGroup(data); 
        } catch (error) {
          console.error(error);
        }
      };
      
      const fetchLikedArticles = async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/groups/${groupId}/liked_articles/`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });
          if (!response.ok) {
            throw new Error('Serverová chyba pri získavaní liknutých článkov skupiny.');
          }
          const data = await response.json();
          setArticles(data);
        } catch (error) {
          console.error(error);
        }
      };
    fetchGroupDetails();
    fetchLikedArticles();
  }, [groupId]);

  useEffect(() => {
    console.log('Outside condition - currentUser:', currentUser, typeof currentUser);
    console.log('Outside condition - group:', group);
    if (group && currentUser) {
      console.log('Inside condition - currentUser:', currentUser, typeof currentUser);
      console.log('Inside condition - group.admin:', group.admin, typeof group.admin);
      const isAdmin = group.admin.id === currentUser;
      setIsAdmin(isAdmin);
    }
  }, [group, currentUser]);

  const handleOpenAddTagModal = (articleId: number) => {
    setTagArticleId(articleId);
    setTagName("");
    setTagIsPublic(false);
    setTagError(null);
    setAddTagDialogOpen(true);
  };

  const handleShowTags = async (articleId: number) => {
    const token = localStorage.getItem("accessToken");

    try {
      const response = await fetch(`http://localhost:8000/api/article/${articleId}/tags/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }

      const { publicTags, userTags } = await response.json();

      setPublicTags(publicTags || []);
      setUserTags(userTags || []);
      setTagsModalOpen(true);
    } catch (error) {
      console.error("Error fetching tags:", error);
      setPublicTags(["Error loading tags"]);
      setUserTags(["Error loading tags"]);
      setTagsModalOpen(true);
    }
  };

  const handleConfirmAddTag = async (): Promise<void> => {
  if (!tagArticleId) return;

  if (!tagName.trim()) {
    setTagError("Tag name is required.");
    return;
  }

  try {
    setTagSubmitting(true);
    setTagError(null);

    const token = localStorage.getItem("accessToken");
    const response = await fetch("http://localhost:8000/api/add-tag/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        article_id: tagArticleId,
        tag_name: tagName.trim(),
        is_public: tagIsPublic,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to add tag to article");
    }

    const data = await response.json();
    console.log(data.message);

    setAddTagDialogOpen(false);
    setTagResultStatus("success");
    setTagResultMessage("The tag has been successfully added.");
    setTagResultOpen(true);
  } catch (error) {
    console.error("Error:", error);
    setTagResultStatus("error");
    setTagResultMessage("Failed to add tag to the article. Please try again.");
    setTagResultOpen(true);
  } finally {
    setTagSubmitting(false);
  }
};
  const openUnlikeConfirm = (articleId: number) => {
    setUnlikeTargetId(articleId);
    setUnlikeConfirmOpen(true);
    setUnlikeResultMessage("");
  };

 const handleConfirmUnlikeArticleAsGroup = async () => {
  if (!unlikeTargetId) return;

  const token = localStorage.getItem("accessToken");
  if (!token || !isAdmin) {
    setUnlikeConfirmOpen(false);
    setUnlikeResultStatus("error");
    setUnlikeResultMessage("You must be logged in and be the group admin to unlike an article.");
    setUnlikeResultOpen(true);
    return;
  }

  setUnlikeSubmitting(true);

  try {
    const response = await fetch(
      `http://localhost:8000/api/groups/${groupId}/unlike_article/${unlikeTargetId}/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      let msg = "Failed to unlike the article for the group.";
      try {
        const errorData = await response.json();
        msg = errorData?.detail || errorData?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    setArticles((prevArticles) =>
      prevArticles.filter((article) => article.id !== unlikeTargetId)
    );

    setUnlikeResultStatus("success");
    setUnlikeResultMessage("Article has been removed from group favourites.");
  } catch (error) {
    console.error("Error unliking article for the group:", error);
    setUnlikeResultStatus("error");
    setUnlikeResultMessage(
      error instanceof Error
        ? error.message
        : "Something went wrong while removing the article."
    );
  } finally {
    setUnlikeSubmitting(false);
    setUnlikeConfirmOpen(false);
    setUnlikeResultOpen(true);
  }
};
  

  const handleKickMember = (memberId: number, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName });
    setRemoveMemberConfirmOpen(true);
  };

  const handleConfirmKickMember = async () => {
    if (!memberToRemove) return;

    const token = localStorage.getItem("accessToken");
    if (!token || !isAdmin) return;

    try {
      setRemoveMemberSubmitting(true);

      const response = await fetch(
        `http://localhost:8000/api/groups/${groupId}/kick_member/${memberToRemove.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        let msg = "Failed to remove the member from the group.";
        try {
          const errorData = await response.json();
          msg = errorData?.detail || msg;
        } catch {}
        throw new Error(msg);
      }

      setGroup((prevGroup) => {
        if (!prevGroup) return null;
        return {
          ...prevGroup,
          members: prevGroup.members.filter((member) => member.id !== memberToRemove.id),
        };
      });

      setRemoveMemberConfirmOpen(false);
      setRemoveMemberResultStatus("success");
      setRemoveMemberResultMessage("The member has been removed from the group.");
      setRemoveMemberResultOpen(true);
      updateGroups();
    } catch (error) {
      console.error("Error removing member from the group:", error);
      setRemoveMemberConfirmOpen(false);
      setRemoveMemberResultStatus("error");
      setRemoveMemberResultMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while removing the member."
      );
      setRemoveMemberResultOpen(true);
    } finally {
      setRemoveMemberSubmitting(false);
      setMemberToRemove(null);
    }
  };

  const openLeaveGroupConfirm = () => {
    setLeaveGroupResultMessage("");
    setLeaveGroupShouldRedirect(false);
    setLeaveGroupConfirmOpen(true);
  };

  const handleConfirmLeaveGroup = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setLeaveGroupConfirmOpen(false);
      setLeaveGroupResultStatus("error");
      setLeaveGroupResultMessage("You must be logged in to leave the group.");
      setLeaveGroupResultOpen(true);
      return;
    }

    setLeaveGroupSubmitting(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/groups/${groupId}/leave_group/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        let msg = "Failed to leave the group.";
        try {
          const errorData = await response.json();
          msg = errorData?.detail || errorData?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      updateGroups();

      setLeaveGroupResultStatus("success");
      setLeaveGroupResultMessage("You have successfully left the group.");
      setLeaveGroupShouldRedirect(true);
    } catch (error) {
      console.error("Error leaving the group:", error);
      setLeaveGroupResultStatus("error");
      setLeaveGroupResultMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while leaving the group."
      );
      setLeaveGroupShouldRedirect(false);
    } finally {
      setLeaveGroupSubmitting(false);
      setLeaveGroupConfirmOpen(false);
      setLeaveGroupResultOpen(true);
    }
  };

  const openDeleteGroupConfirm = () => {
    setDeleteGroupResultMessage("");
    setDeleteGroupShouldRedirect(false);
    setDeleteGroupConfirmOpen(true);
  };

  const handleConfirmDeleteGroup = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setDeleteGroupConfirmOpen(false);
      setDeleteGroupResultStatus("error");
      setDeleteGroupResultMessage("You must be logged in to delete a group.");
      setDeleteGroupResultOpen(true);
      return;
    }

    setDeleteGroupSubmitting(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/groups/delete/${groupId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const msg =
          data?.detail ||
          data?.message ||
          "Failed to delete the group.";
        throw new Error(msg);
      }

      await updateGroups();

      setDeleteGroupResultStatus("success");
      setDeleteGroupResultMessage("The group has been deleted.");
      setDeleteGroupShouldRedirect(true);
    } catch (error) {
      console.error("Error deleting the group:", error);
      setDeleteGroupResultStatus("error");
      setDeleteGroupResultMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the group."
      );
      setDeleteGroupShouldRedirect(false);
    } finally {
      setDeleteGroupSubmitting(false);
      setDeleteGroupConfirmOpen(false);
      setDeleteGroupResultOpen(true);
    }
  };

  const handleExportBibtex = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/groups/${groupId}/export_bibtex/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (response.ok) {
        const bibtexText = await response.text();
        const blob = new Blob([bibtexText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "group_articles.bib";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        throw new Error('Failed to fetch BibTeX data');
      }
    } catch (error) {
      console.error('Error exporting BibTeX:', error);
      Swal.fire('Error!', 'Failed to export BibTeX data.', 'error');
    }
  };

  const handleOpenPdf = (pdfFile: string) => {
    if (!pdfFile) return;
    window.open(`http://localhost:8000${pdfFile}`, "_blank");
  };


return (
  <>
  <Card className="relative bg-card/70 backdrop-blur-xl border border-border/60 rounded-3xl shadow-xl p-6 sm:p-8 space-y-8">
    {/* ---------- HEADER ---------- */}
    <CardHeader className="p-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/30 shadow-inner">
            <Users className="w-6 h-6" />
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Group detail
            </p>

            <CardTitle className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
              {group?.name ?? "Loading group..."}
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Admin:{" "}
              <span className="font-medium">
                {group?.admin.first_name} {group?.admin.last_name}
              </span>
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge
                variant="outline"
                className="flex items-center gap-1 rounded-full px-3 py-1"
              >
                <Users className="w-3 h-3" />
                <span>{group?.members.length ?? 0} members</span>
              </Badge>
              {isAdmin && (
                <Badge className="rounded-full px-3 py-1">
                  You are admin
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </CardHeader>

    <Separator />

    {/* ---------- GROUP MEMBERS ---------- */}
    <Card className="border border-border/60 rounded-2xl bg-card/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg sm:text-xl">Members</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="h-72 w-full pr-3 -mr-3">
          {group?.members?.length ? (
            <ul className="space-y-3">
              {group.members.sort(sortByName).map((m) => (
                <li
                  key={m.id}
                  className="flex justify-between items-center bg-accent/60 px-3 py-2.5 rounded-xl border border-border text-sm hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {m.first_name} {m.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{m.username}
                    </p>
                  </div>

                  {isAdmin && currentUser !== m.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="
                        rounded-full text-xs
                        border-[hsl(var(--destructive))]/60
                        bg-[hsl(var(--destructive))]/10
                        text-[hsl(var(--destructive))]
                        hover:bg-[hsl(var(--destructive))]/20
                      "
                      onClick={() => handleKickMember(m.id, `${m.first_name} ${m.last_name}`)}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No members.</p>
          )}
        </ScrollArea>

        {!isAdmin && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Only group admin can remove members.
          </p>
        )}
      </CardContent>
    </Card>


    <Separator />

    {/* ---------- FAVOURITE ARTICLES ---------- */}
    <Card className="border border-border/60 rounded-2xl bg-card/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg sm:text-xl">
            Favourite Articles
          </CardTitle>
        </div>
        <Badge variant="outline" className="rounded-full text-xs">
          {articles.length} saved articles
        </Badge>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="h-72 w-full pr-3 -mr-3">
          {articles.length > 0 ? (
            <ul className="space-y-4">
              {articles.map((article) => (
              <li
                key={article.id}
                className="
                  bg-accent/60 p-4 rounded-xl border border-border shadow-sm
                  hover:bg-accent transition-colors
                "
              >
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))] text-base leading-snug">
                      {article.title.length > 120
                        ? article.title.slice(0, 120) + "..."
                        : article.title}
                    </h3>

                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                      Authors: {article.authors?.length ? article.authors.join(", ") : "Unknown"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPdf(article.pdf_file)}
                      className="
                        rounded-full text-xs
                        border border-[hsl(var(--border))]
                        bg-[hsl(var(--card))]
                        text-[hsl(var(--foreground))]
                        hover:bg-[hsl(var(--muted))]
                        shadow-sm
                      "
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      Open PDF
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="
                        rounded-full text-xs
                        border border-[hsl(var(--primary))/60]
                        bg-[hsl(var(--accent))]
                        text-[hsl(var(--primary))]
                        hover:bg-[hsl(var(--primary))/10]
                        shadow-sm
                        transition-colors
                      "
                      onClick={() => handleShowTags(article.id)}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      Show tags
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleOpenAddTagModal(article.id)}
                      className="
                        rounded-full text-xs
                        bg-[hsl(var(--primary))]
                        text-[hsl(var(--primary-foreground))]
                        hover:brightness-110
                        shadow-sm
                        transition-colors
                      "
                    >
                      Add tag
                    </Button>

                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="
                          rounded-full text-xs
                          border-[hsl(var(--destructive))]/60
                          bg-[hsl(var(--destructive))]/10
                          text-[hsl(var(--destructive))]
                          hover:bg-[hsl(var(--destructive))]/20
                        "
                        onClick={() => openUnlikeConfirm(article.id)}
                      >
                        Unlike
                      </Button>
                    )}
                  </div>
                </div>
              </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No liked articles.</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
    

    <Separator />

    {/* ---------- ACTIONS ---------- */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
      {/* LEFT SIDE ACTIONS */}
      <div className="flex flex-wrap items-center gap-3">
        {isAdmin && <InviteButton groupId={groupId} />}

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
          onClick={handleExportBibtex}
        >
          <FileDown className="w-4 h-4" />
          Export BibTeX
        </Button>
      </div>

      {/* RIGHT SIDE ACTIONS */}
      <div className="flex flex-wrap gap-3">
        {isAdmin ? (
          <Button
            variant="outline"
            className="
              rounded-full flex items-center gap-2
              border-[hsl(var(--destructive))]/60
              bg-[hsl(var(--destructive))]/10
              text-[hsl(var(--destructive))]
              hover:bg-[hsl(var(--destructive))]/20
            "
            onClick={openDeleteGroupConfirm}
          >
            <Trash2 className="w-4 h-4" />
            Delete Group
          </Button>
        ) : (
          <Button
            variant="outline"
            className="
              rounded-full flex items-center gap-2
              border-[hsl(var(--destructive))]/60
              bg-[hsl(var(--destructive))]/10
              text-[hsl(var(--destructive))]
              hover:bg-[hsl(var(--destructive))]/20
            "
            onClick={openLeaveGroupConfirm}
          >
            <LogOut className="w-4 h-4" />
            Leave Group
          </Button>
        )}
      </div>
    </div>
  </Card>

  {/* ---------- TAGS MODAL ---------- */}
  <Dialog open={tagsModalOpen} onOpenChange={setTagsModalOpen}>
    <DialogContent
      className="
        max-w-md 
        rounded-3xl 
        bg-white/90
        backdrop-blur-xl 
        p-8 
        shadow-2xl
        border border-[hsl(var(--border))]
      "
    >
      <DialogHeader className="text-center">
        <DialogTitle className="text-3xl font-semibold text-[hsl(var(--foreground))] tracking-tight">
          Article Tags
        </DialogTitle>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Public & personal tags attached to this article
        </p>
      </DialogHeader>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] text-center">
          Public Tags
        </h3>

        <div className="mt-3 text-center">
          {publicTags.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-3">
              {publicTags.map((tag, i) => (
                <span
                  key={i}
                  className="
                    px-4 py-1.5 
                    bg-[hsl(var(--accent))] 
                    text-[hsl(var(--foreground))] 
                    rounded-full 
                    text-sm 
                    border border-[hsl(var(--border))]
                    shadow-sm
                  "
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <i className="text-[hsl(var(--muted-foreground))]">
              No public tags available
            </i>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      <div>
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] text-center">
          Your Tags
        </h3>

        <div className="mt-3 text-center">
          {userTags.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-3">
              {userTags.map((tag, i) => (
                <span
                  key={i}
                  className="
                    px-4 py-1.5 
                    bg-[hsl(var(--primary))/0.15] 
                    text-[hsl(var(--primary))] 
                    rounded-full 
                    text-sm 
                    border border-[hsl(var(--primary))/0.4]
                    shadow-sm
                  "
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <i className="text-[hsl(var(--muted-foreground))]">
              You have not added any tags
            </i>
          )}
        </div>
      </div>

      <DialogFooter className="mt-8 flex justify-center">
        <Button
          onClick={() => setTagsModalOpen(false)}
          className="
            rounded-lg px-8 py-2 
            bg-[hsl(var(--primary))] 
            text-[hsl(var(--primary-foreground))] 
            hover:brightness-110 
            shadow-md
          "
        >
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* ---------- ADD TAG MODAL ---------- */}
  <Dialog open={addTagDialogOpen} onOpenChange={setAddTagDialogOpen}>
  <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
    <DialogHeader>
      <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
        Add tag
      </DialogTitle>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Enter a tag for this article and choose whether it should be public.
      </p>
    </DialogHeader>

    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
          Tag name
        </label>
        <Input
          value={tagName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagName(e.target.value)}
          placeholder="e.g. optimization, transformers…"
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

      <div className="flex items-center gap-2">
        <input
          id="tag-is-public"
          type="checkbox"
          checked={tagIsPublic}
          onChange={(e) => setTagIsPublic(e.target.checked)}
          className="h-4 w-4 rounded border-[hsl(var(--border))]"
        />
        <label
          htmlFor="tag-is-public"
          className="text-sm text-[hsl(var(--foreground))]"
        >
          Public tag
        </label>
      </div>

      {tagError && (
        <p className="text-sm text-[hsl(var(--destructive))]">
          {tagError}
        </p>
      )}
    </div>

    <DialogFooter className="mt-4 flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={() => setAddTagDialogOpen(false)}
        className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
      >
        Cancel
      </Button>

      <Button
        onClick={handleConfirmAddTag}
        disabled={tagSubmitting}
        className="
          rounded-xl bg-[hsl(var(--primary))]
          text-[hsl(var(--primary-foreground))]
          hover:brightness-110 px-5
          disabled:opacity-60 disabled:cursor-not-allowed
        "
      >
        Add tag
      </Button>
    </DialogFooter>
  </DialogContent>
  </Dialog> 

  {/* ---------- ADD TAG RESULT MODAL ---------- */}
  <Dialog open={tagResultOpen} onOpenChange={setTagResultOpen}>
    <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
          {tagResultStatus === "success" ? "Tag added" : "Tag error"}
        </DialogTitle>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {tagResultMessage}
        </p>
      </DialogHeader>

      <DialogFooter className="mt-4">
        <Button
          onClick={() => setTagResultOpen(false)}
          className="rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110 px-6"
        >
          OK
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* ---------- REMOVE MEMBER CONFIRM MODAL ---------- */}
  <Dialog open={removeMemberResultOpen} onOpenChange={setRemoveMemberResultOpen}>
    <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
          {removeMemberResultStatus === "success" ? "Member removed" : "Action failed"}
        </DialogTitle>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {removeMemberResultMessage}
        </p>
      </DialogHeader>

      <DialogFooter className="mt-4">
        <Button
          onClick={() => setRemoveMemberResultOpen(false)}
          className="rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110 px-6"
        >
          OK
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* ---------- REMOVE MEMBER RESULT MODAL ---------- */}
  <Dialog open={removeMemberConfirmOpen} onOpenChange={setRemoveMemberConfirmOpen}>
    <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
          Remove member?
        </DialogTitle>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {memberToRemove
            ? `${memberToRemove.name} will be removed from this group. This action can be reversed only by inviting them again.`
            : "This member will be removed from the group."}
        </p>
      </DialogHeader>

      <DialogFooter className="mt-4 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setRemoveMemberConfirmOpen(false)}
          className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
        >
          Cancel
        </Button>

        <Button
          onClick={handleConfirmKickMember}
          disabled={removeMemberSubmitting}
          variant="outline"
          className="
            rounded-xl px-4 py-2 text-sm font-semibold
            border-[hsl(var(--destructive))]/70
            bg-[hsl(var(--destructive))]/10
            text-[hsl(var(--destructive))]
            hover:bg-[hsl(var(--destructive))]/20
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          Remove
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* ---------- UNLIKE ARTICLE CONFIRM MODAL ---------- */}
  <Dialog open={unlikeConfirmOpen} onOpenChange={setUnlikeConfirmOpen}>
    <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
          Remove article from group favourites?
        </DialogTitle>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          This article will no longer be liked by the group and may affect group-based recommendations.
        </p>
      </DialogHeader>

      <DialogFooter className="mt-4 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setUnlikeConfirmOpen(false)}
          className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
        >
          Cancel
        </Button>

        <Button
          onClick={handleConfirmUnlikeArticleAsGroup}
          disabled={unlikeSubmitting}
          variant="outline"
          className="
            rounded-xl px-4 py-2 text-sm font-semibold
            border-[hsl(var(--destructive))]/70
            bg-[hsl(var(--destructive))]/10
            text-[hsl(var(--destructive))]
            hover:bg-[hsl(var(--destructive))]/20
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          Remove
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* ---------- UNLIKE ARTICLE RESULT MODAL ---------- */}
  <Dialog open={unlikeResultOpen} onOpenChange={setUnlikeResultOpen}>
    <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
          {unlikeResultStatus === "success" ? "Article removed" : "Action failed"}
        </DialogTitle>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {unlikeResultMessage}
        </p>
      </DialogHeader>

      <DialogFooter className="mt-4">
        <Button
          onClick={() => setUnlikeResultOpen(false)}
          className="rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110 px-6"
        >
          OK
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* ---------- LEAVE GROUP CONFIRM MODAL ---------- */}
  <Dialog open={leaveGroupConfirmOpen} onOpenChange={setLeaveGroupConfirmOpen}>
    <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
          Leave group?
        </DialogTitle>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          You will leave this group and lose access to its member-only actions until you are invited again.
        </p>
      </DialogHeader>

      <DialogFooter className="mt-4 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setLeaveGroupConfirmOpen(false)}
          className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
        >
          Cancel
        </Button>

        <Button
          onClick={handleConfirmLeaveGroup}
          disabled={leaveGroupSubmitting}
          variant="outline"
          className="
            rounded-xl px-4 py-2 text-sm font-semibold
            border-[hsl(var(--destructive))]/70
            bg-[hsl(var(--destructive))]/10
            text-[hsl(var(--destructive))]
            hover:bg-[hsl(var(--destructive))]/20
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          Leave group
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* ---------- LEAVE GROUP RESULT MODAL ---------- */}
  <Dialog
    open={leaveGroupResultOpen}
    onOpenChange={(open) => {
      setLeaveGroupResultOpen(open);
      if (!open && leaveGroupShouldRedirect) {
        onBack();
      }
    }}
  >
    <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
          {leaveGroupResultStatus === "success" ? "Group left" : "Action failed"}
        </DialogTitle>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {leaveGroupResultMessage}
        </p>
      </DialogHeader>

      <DialogFooter className="mt-4">
        <Button
          onClick={() => {
            setLeaveGroupResultOpen(false);
            if (leaveGroupShouldRedirect) {
              onBack();
            }
          }}
          className="rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110 px-6"
        >
          OK
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* ---------- DELETE GROUP CONFIRM MODAL ---------- */}
  <Dialog open={deleteGroupConfirmOpen} onOpenChange={setDeleteGroupConfirmOpen}>
  <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
    <DialogHeader>
      <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
        Delete group?
      </DialogTitle>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        This will permanently delete the group and remove access for all members. This action cannot be undone.
      </p>
    </DialogHeader>

    <DialogFooter className="mt-4 flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={() => setDeleteGroupConfirmOpen(false)}
        className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
      >
        Cancel
      </Button>

      <Button
        onClick={handleConfirmDeleteGroup}
        disabled={deleteGroupSubmitting}
        variant="outline"
        className="
          rounded-xl px-4 py-2 text-sm font-semibold
          border-[hsl(var(--destructive))]/70
          bg-[hsl(var(--destructive))]/10
          text-[hsl(var(--destructive))]
          hover:bg-[hsl(var(--destructive))]/20
          disabled:opacity-60 disabled:cursor-not-allowed
        "
      >
        Delete group
      </Button>
    </DialogFooter>
  </DialogContent>
  </Dialog>

 {/* ---------- DELETE GROUP RESULT MODAL ---------- */}
 <Dialog
    open={deleteGroupResultOpen}
    onOpenChange={(open) => {
      setDeleteGroupResultOpen(open);
      if (!open && deleteGroupShouldRedirect) {
        onBack();
      }
    }}
  >
    <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
          {deleteGroupResultStatus === "success" ? "Group deleted" : "Action failed"}
        </DialogTitle>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {deleteGroupResultMessage}
        </p>
      </DialogHeader>

      <DialogFooter className="mt-4">
        <Button
          onClick={() => {
            setDeleteGroupResultOpen(false);
            if (deleteGroupShouldRedirect) {
              onBack();
            }
          }}
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

export default GroupDetail;
