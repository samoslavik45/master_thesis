import React, { useState, useEffect } from 'react';
import InviteButton from './InviteButton'; 
import Swal from 'sweetalert2';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { Users, Bookmark, Tag, Trash2, LogOut, Send } from "lucide-react";


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
    Swal.fire({
      title: 'Enter Tag',
      html: `
        <input type="text" id="tagName" class="swal2-input" placeholder="Tag Name">
        <label for="isPublic" class="swal2-checkbox" style="display: flex; align-items: center; margin-top: 20px;">
          <input type="checkbox" id="isPublic" style="width: 24px; height: 24px; margin-right: 8px;"> Public
        </label>
        <div style="display: flex; justify-content: center; margin-top: 20px;">
          <button type="button" id="swal2-confirm" class="swal2-confirm swal2-styled" style="margin-right: 5px;">OK</button>
          <button type="button" id="swal2-cancel" class="swal2-cancel swal2-styled">Cancel</button>
        </div>
      `,
      showConfirmButton: false,
      preConfirm: () => {

      },
      didOpen: () => {

        const confirmButton = Swal.getPopup()?.querySelector('#swal2-confirm') as HTMLElement;
        confirmButton.onclick = () => {
          const tagName = (Swal.getPopup()?.querySelector('#tagName') as HTMLInputElement)?.value;
          const isPublic = (Swal.getPopup()?.querySelector('#isPublic') as HTMLInputElement)?.checked;
          if (tagName) {
            handleAddTag(articleId, tagName, isPublic);
            Swal.close();
          } else {
            Swal.showValidationMessage('Tag name is required');
          }
        };
  

        const cancelButton = Swal.getPopup()?.querySelector('#swal2-cancel') as HTMLElement;
        cancelButton.onclick = () => {
          Swal.close();
        };
      }
    });
  };

  const handleShowTags = async (articleId: number) => {
    const url = `http://localhost:8000/api/article/${articleId}/tags/`;
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      const { publicTags, userTags } = await response.json();
      Swal.fire({
        title: 'Tags',
        html: `
          <h6>Public Tags:</h6>
          <p>${publicTags.join('; ')}</p>
          <h6>Your Tags:</h6>
          <p>${userTags.join('; ')}</p>
        `,
        confirmButtonText: 'Close',
      });
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleAddTag = async (articleId: number, tagName: string, isPublic: boolean): Promise<void> => {
    try {
      const token = localStorage.getItem('accessToken'); 
      const response = await fetch('http://localhost:8000/api/add-tag/', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          article_id: articleId,
          tag_name: tagName,
          is_public: isPublic,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to add tag to article');
      }
  
      const data = await response.json();
      console.log(data.message); 
      Swal.fire(
        'Tag Added!',
        'The tag has been successfully added.',
        'success'
      );
    } catch (error) {
      console.error('Error:', error);
      Swal.fire(
        'Error!',
        'Failed to add tag to the article.',
        'error'
      )
    }
  };

  const handleUnlikeArticleAsGroup = async (articleId: number) => {
    const token = localStorage.getItem('accessToken');
    if (!token || !isAdmin) {
      Swal.fire('Unauthorized', 'You must be logged in and be the group admin to perform this action.', 'error');
      return;
    }
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you really want to unlike this article for the group?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, unlike it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:8000/api/groups/${groupId}/unlike_article/${articleId}/`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });
  
          if (response.ok) {
            setArticles(prevArticles => prevArticles.filter(article => article.id !== articleId));
            Swal.fire('Unliked!', 'The article has been unliked for the group.', 'success');
          } else {
            const errorData = await response.json();
            Swal.fire('Failed!', errorData.message || 'Failed to unlike the article for the group.', 'error');
          }
        } catch (error) {
          console.error('Error unliking article for the group:', error);
          Swal.fire('Error!', 'Something went wrong!', 'error');
        }
      }
    });
  };
  

const handleKickMember = async (memberId: number) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, kick them!'
  });

  if (result.isConfirmed) {
    const token = localStorage.getItem('accessToken');
    if (token && isAdmin) {
      try {
        const response = await fetch(`http://localhost:8000/api/groups/${groupId}/kick_member/${memberId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (response.ok) {
          setGroup(prevGroup => {
            if (!prevGroup) return null;
            return {
              ...prevGroup,
              members: prevGroup.members.filter(member => member.id !== memberId),
            };
          });
          Swal.fire(
            'Kicked!',
            'The member has been kicked out of the group.',
            'success'
          );
        } else {
          console.error('Failed to kick the member from the group.');
        }
      } catch (error) {
        console.error('Error kicking member from the group:', error);
      }
    }
  }
};

const handleLeaveGroup = async () => {
  Swal.fire({
    title: 'Are you sure?',
    text: "You will leave this group and won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, leave it!'
  }).then(async (result) => {
    if (result.isConfirmed) {
      const token = localStorage.getItem('accessToken');
      try {
        const response = await fetch(`http://localhost:8000/api/groups/${groupId}/leave_group/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error('Failed to leave the group.');
        }

        Swal.fire('Left!', 'You have left the group.', 'success');
        updateGroups(); 
        onBack(); 
      } catch (error) {
        console.error('Error leaving the group:', error);
        Swal.fire('Error!', 'Something went wrong!', 'error');
      }
    }
  });
};


const handleDeleteGroup = async () => {
  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then(async (result) => {
    if (result.isConfirmed) {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        Swal.fire('Unauthorized', 'You must be logged in to delete a group.', 'error');
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/groups/delete/${groupId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete the group.');
        }

        Swal.fire('Deleted!', 'The group has been deleted.', 'success');
        updateGroups(); 
        onBack(); 
    
      } catch (error) {
        console.error('Error deleting the group:', error);
        Swal.fire('Error!', 'Something went wrong!', 'error');
      }
    }
  });
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


return (
  <Card
    className="
      bg-card/70 
      backdrop-blur-xl 
      border 
      rounded-2xl 
      shadow-xl 
      p-6 
      space-y-8
    "
  >
    {/* ---------- HEADER ---------- */}
    <CardHeader className="pb-4">
      <CardTitle className="text-3xl font-semibold text-primary tracking-tight">
        {group?.name}
      </CardTitle>

      <p className="text-muted-foreground mt-1">
        Admin:{" "}
        <span className="font-medium">
          {group?.admin.first_name} {group?.admin.last_name}
        </span>
      </p>
    </CardHeader>

    <Separator />


    {/* ---------- GROUP MEMBERS ---------- */}
    <Card className="border rounded-xl shadow-sm bg-card/60">
      <CardHeader className="flex flex-row items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <CardTitle className="text-xl">Members</CardTitle>
      </CardHeader>

      <CardContent>
        <ScrollArea className="max-h-60 pr-3">
          {group?.members.length ? (
            <ul className="space-y-3">
              {group.members.sort(sortByName).map((m) => (
                <li
                  key={m.id}
                  className="
                    flex 
                    justify-between 
                    items-center 
                    bg-accent 
                    p-3 
                    rounded-lg 
                    border 
                    border-border
                  "
                >
                  <div>
                    <p className="font-medium">
                      {m.first_name} {m.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{m.username}
                    </p>
                  </div>

                  {isAdmin && currentUser !== m.id && (
                    <Button
                      variant="destructive"
                      className="rounded-lg"
                      onClick={() => handleKickMember(m.id)}
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
          <p className="text-muted-foreground text-xs mt-2">
            Only group admin can remove members.
          </p>
        )}
      </CardContent>
    </Card>


    <Separator />


    {/* ---------- FAVOURITE ARTICLES ---------- */}
    <Card className="border rounded-xl shadow-sm bg-card/60">
      <CardHeader className="flex flex-row items-center gap-2 mb-2">
        <Bookmark className="w-5 h-5 text-primary" />
        <CardTitle className="text-xl">Favourite Articles</CardTitle>
      </CardHeader>

      <CardContent>
        <ScrollArea className="max-h-72 pr-3">
          {articles.length > 0 ? (
            <ul className="space-y-4">
              {articles.map((article) => (
                <li
                  key={article.id}
                  className="
                    bg-accent 
                    p-4 
                    rounded-lg 
                    border 
                    border-border 
                    shadow-sm
                  "
                >
                  <p className="font-medium mb-3">
                    {article.title.length > 80
                      ? article.title.slice(0, 80) + "..."
                      : article.title}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => handleShowTags(article.id)}
                    >
                      Show Tags
                    </Button>

                    <Button
                      size="sm"
                      className="rounded-lg"
                      onClick={() => handleOpenAddTagModal(article.id)}
                    >
                      Add Tag
                    </Button>

                    {isAdmin && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => handleUnlikeArticleAsGroup(article.id)}
                      >
                        Unlike
                      </Button>
                    )}
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
    <div className="flex justify-between items-center pt-4">

      {/* LEFT SIDE ACTIONS */}
      <div className="flex items-center gap-3">
        {isAdmin && (
          <Button
            onClick={() => {}}
            className="rounded-lg flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <InviteButton groupId={groupId} />
          </Button>
        )}

        <Button
          variant="secondary"
          className="rounded-lg"
          onClick={handleExportBibtex}
        >
          Export BibTeX
        </Button>
      </div>

      {/* RIGHT SIDE ACTIONS */}
      <div className="flex gap-3">
        {isAdmin ? (
          <Button
            variant="destructive"
            className="rounded-lg flex items-center gap-2"
            onClick={handleDeleteGroup}
          >
            <Trash2 className="w-4 h-4" />
            Delete Group
          </Button>
        ) : (
          <Button
            variant="destructive"
            className="rounded-lg flex items-center gap-2"
            onClick={handleLeaveGroup}
          >
            <LogOut className="w-4 h-4" />
            Leave Group
          </Button>
        )}
      </div>
    </div>
  </Card>
);

};

export default GroupDetail;
