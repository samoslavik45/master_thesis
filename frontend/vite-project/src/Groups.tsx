import React, { useState, useEffect } from 'react';
import CreateGroupModal from './CreateGroupModal'; 
import GroupDetail from './GroupDetail';
import GroupInvitesModal from './GroupInvitesModal';
import './Groups.css';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';


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
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [newGroupName, setNewGroupName] = useState<string>('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInvitesModalOpen, setIsInvitesModalOpen] = useState(false);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Stav pre prihlásenie
    const navigate = useNavigate(); // Hook useNavigate() pro navigaci

    const redirectToLogin = () => {
      navigate('/login'); // Přesměrování na /login
    };

    const checkTokenValidity = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = new Date(payload.exp * 1000);
        return expiry > new Date(); // porovnáva s aktuálnym časom
      }
      return false;
    };
    
    useEffect(() => {
      // Kontrola pri načítaní stránky
      const tokenIsValid = checkTokenValidity();
      if (!tokenIsValid) {
        setIsLoggedIn(false); // aktualizujeme stav na ne-prihlásený
      }
      if (tokenIsValid){
        setIsLoggedIn(true);
      }
    }, []); // Prázdny dependency array zabezpečí spustenie len raz pri načítaní

    useEffect(() => {
      const intervalId = setInterval(() => {
        // Táto funkcia by mala vrátiť `true` alebo `false`
        const tokenIsValid = checkTokenValidity(); 
        if (!tokenIsValid) {
          clearInterval(intervalId); // zastavíme periodickú kontrolu, ak je token neplatný
          setIsLoggedIn(false); // aktualizujeme stav na ne-prihlásený
        }
      }, 30000); // kontrola každú minútu
    
      // keď sa komponent odstráni alebo keď sa zmení dependency array
      return () => {
        clearInterval(intervalId); // vycistíme interval, aby nedošlo k memory leak
      };
    }, []); // prázdne dependency array zabezpečí, že interval začne po prvom renderovaní komponentu
    


    const fetchInvites = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
    
        try {
          const response = await fetch('http://localhost:8000/api/invites/', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) throw new Error('Failed to fetch invites');
          const data = await response.json();
          setInvites(data);
        } catch (error) {
          console.error('Error fetching invites:', error);
        }
      };

      const handleShowInvites = () => {
        if (invites.length === 0) {
          Swal.fire('No invites', 'You currently have no invites.', 'info');
          return;
        }
      
        const invitesHtml = invites.map(invite => `
          <div>
            <p><strong>${invite.group_name}</strong> from <em>${invite.sender_name}</em></p>
            <button id="accept-${invite.id}" class="swal2-confirm swal2-styled">Accept</button>
            <button id="reject-${invite.id}" class="swal2-cancel swal2-styled">Reject</button>
          </div>
        `).join('');
      
        Swal.fire({
          title: 'Group Invites',
          html: invitesHtml,
          showConfirmButton: false,
          didOpen: () => {
            invites.forEach(invite => {
              (document.getElementById(`accept-${invite.id}`) as HTMLElement).onclick = () => handleAcceptInvite(invite.id);
              (document.getElementById(`reject-${invite.id}`) as HTMLElement).onclick = () => handleRejectInvite(invite.id);
            });
          }
        });
      };

      const fetchGroups = async () => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:8000/api/groups/', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (!response.ok) {
            console.error('Chyba pri načítaní skupín');
            return;
        }
        const data: Group[] = await response.json();
        setGroups(data);
    };

    const handleAcceptInvite = async (inviteId: number): Promise<void> => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await fetch(`http://localhost:8000/api/invites/accept/${inviteId}/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });
    
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Server returned status: ${response.status}, detail: ${errorData.error}`);
          }
    
          const data = await response.json();
          Swal.fire({
            title: 'Invite Accepted',
            text: data.message,
            icon: 'success'
          });
          fetchGroups(); // To ensure the group list is updated
          fetchInvites(); // To update the invites list
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: 'Error accepting invite: ' + (error instanceof Error ? error.message : String(error)),
            icon: 'error'
          });
        }
      } else {
        Swal.fire({
          title: 'Not Logged In',
          text: 'You must be logged in to accept invites.',
          icon: 'warning'
        });
      }
    };
      
    const handleRejectInvite = async (inviteId: number): Promise<void> => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await fetch(`http://localhost:8000/api/invites/reject/${inviteId}/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });
    
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Server returned status: ${response.status}, detail: ${errorData.error}`);
          }
    
          const data = await response.json();
          Swal.fire({
            title: 'Invite Rejected',
            text: data.message,
            icon: 'success'
          });
          fetchInvites(); // To update the invites list
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: 'Error rejecting invite: ' + (error instanceof Error ? error.message : String(error)),
            icon: 'error'
          });
        }
      } else {
        Swal.fire({
          title: 'Not Logged In',
          text: 'You must be logged in to reject invites.',
          icon: 'warning'
        });
      }
    };
      
      useEffect(() => {
        fetchInvites();
        fetchGroups();
      }, []);

    const handleCreateGroup = async (newGroupName: string) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert('Nie ste prihlásený.');
            return;
        }
        if (!newGroupName) {
            alert('Názov skupiny je povinný.');
            return;
        }
    
        try {
            const response = await fetch('http://localhost:8000/api/groups/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newGroupName }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Server returned status: ${response.status}, detail: ${errorData.detail}`);
            }
    
            const newGroup = await response.json();
            setGroups(prev => [...prev, newGroup]);
            setNewGroupName('');
            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Nepodarilo sa vytvoriť skupinu: ', error);
            alert(error);
        }
    };

    const handleOpenCreateGroupModal = () => {
      Swal.fire({
        title: 'Create new group',
        input: 'text',
        inputPlaceholder: 'Enter the group name',
        showCancelButton: true,
        confirmButtonText: 'Create',
        preConfirm: (groupName) => {
          handleCreateGroup(groupName);
        }
      });
    };
    

    const handleSelectGroup = (groupId: number) => {
        setSelectedGroupId(groupId);
      };
      

      return (
        <>
          {isLoggedIn ? (
            <div className="groups-container">
              <div className="group-list">
                {groups.map((group) => (
                  <div key={group.id} className="group-item">
                    <span className="group-name">{group.name}</span>
                    <div className="group-actions">
                      <button onClick={() => handleSelectGroup(group.id)}>Detail</button>
                    </div>
                  </div>
                ))}
              </div>
              {selectedGroupId ? (
                <GroupDetail groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} updateGroups={fetchGroups} />
              ) : null}
              <div className="group-actions-top">
                <button onClick={handleOpenCreateGroupModal} className="create-group-button">
                  Create new group
                </button>
                <button onClick={handleShowInvites} className="invite-button">
                  Show invites
                </button>
              </div>
              <GroupInvitesModal
                isOpen={isInvitesModalOpen}
                onClose={() => setIsInvitesModalOpen(false)}
                invites={invites}
                onAccept={handleAcceptInvite}
                onReject={handleRejectInvite}
              />
            </div>
          ) : (
            <div className="not-logged-in-card">
              <div className="not-logged-in-content">
                <h2>Group</h2>
                <p>No group data.</p>
                <button onClick={redirectToLogin}>
                  Login
                </button>
              </div>
            </div>
          )}
        </>
      );
      
      
      
}

export default Groups;
