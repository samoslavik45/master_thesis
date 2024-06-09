import React, { useState, useEffect } from 'react';
import InviteButton from './InviteButton'; 
import './GroupDetail.css';
import Swal from 'sweetalert2';

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
    <div className='group-detail'>
      <h2>Detail of group {group?.name}</h2>
      <div>
        <h3>Group members</h3>
        <div className="group-members">
        <ul>
        {group?.members.map((member) => (
              <li key={member.id}>
                {member.first_name} {member.last_name} ({member.username})
                {isAdmin && currentUser !== member.id && (
                  <button onClick={() => handleKickMember(member.id)} className='btn btn-delete btn-sm'>
                    Remove member
                  </button>
                )}
              </li>
            ))}
        </ul>
        </div>
      </div>
      <div>
        <h3>Favourite Articles</h3>
        <div className="group-articles">
        {articles.length > 0 ? (
          <ul>
            {articles.map((article) => (
              <li key={article.id} className='article-item'>
                {article.title.length > 60
                  ? `${article.title.substring(0, 60)}...`
                  : article.title}
              <div className="button-group">
                <button onClick={() => handleShowTags(article.id)} className='btn btn-info btn-sm'>Show Tags </button>
                <button onClick={() => handleOpenAddTagModal(article.id)} className='btn btn-group-primary btn-sm'>Add Tag</button>
                {isAdmin && (
                  <button onClick={() => handleUnlikeArticleAsGroup(article.id)} className='btn btn-group-secondary btn-sm'>
                    Unlike
                  </button>
                )}
              </div>
              </li> 
            ))}
          </ul>
        ) : (
          <p>No liked articles.</p>
        )}
        </div>
      </div>
      <div className='group-detail-actions'>
        <div className="group-detail-actions-left">
          {group && currentUser === group.admin.id && <InviteButton groupId={groupId} />} {}
          <button className="btn btn-success" onClick={handleExportBibtex}>Export BibTeX of All Articles</button>
        </div>
        <div className="group-detail-actions-right">
          {group && currentUser === group.admin.id ? (
            <button className="btn-delete" onClick={handleDeleteGroup}>Delete Group</button>
          ) : (
            <button className="btn-delete" onClick={handleLeaveGroup}>Leave Group</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
