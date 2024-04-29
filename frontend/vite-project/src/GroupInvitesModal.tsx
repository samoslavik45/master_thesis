import React from 'react';
import './GroupInvitesModal.css'; // Ako predpoklad, že máte samostatný CSS súbor

interface Invite {
  id: number;
  group_name: string;
  sender_name: string;
}

interface GroupInvitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  invites: Invite[];
  onAccept: (inviteId: number) => void;
  onReject: (inviteId: number) => void;
}

const GroupInvitesModal: React.FC<GroupInvitesModalProps> = ({
  isOpen,
  onClose,
  invites,
  onAccept,
  onReject,
}) => {
    console.log(invites);
    return (
      <>
        {isOpen && (
          <>
            <div className={`group-invites-modal-backdrop ${isOpen ? 'show' : ''}`} onClick={onClose} />
            <div className={`group-invites-modal ${isOpen ? 'show' : ''}`}>
              <div className="group-invites-modal-content">
                <span className="group-invites-close-button" onClick={onClose}>
                  &times;
                </span>
                <h2>Pozvánky do skupín</h2>
                <div className="group-invites-list">
                  {invites && invites.length > 0 ? (
                    invites.map((invite) => (
                      <div key={invite.id} className="invite-item">
                        <div className="invite-details">
                          <p className="invite-group-name">{invite.group_name}</p>
                          <p className="invite-sender-name">Od: {invite.sender_name}</p>
                        </div>
                        <div className="invite-actions">
                          <button onClick={() => onAccept(invite.id)} className="accept-btn">Accept</button>
                          <button onClick={() => onReject(invite.id)} className="reject-btn">Reject</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-invites">Žiadne pozvánky.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </>
    );
    
  };

export default GroupInvitesModal;
