import React from 'react';
import './InviteButton.css';
import Swal from 'sweetalert2';

interface InviteButtonProps {
  groupId: number;
}

const InviteButton: React.FC<InviteButtonProps> = ({ groupId }) => {
  const sendInvite = async (username: string) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const response = await fetch(`http://localhost:8000/api/groups/${groupId}/send_invite/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username })
        });

        const data = await response.json();
        if (!response.ok) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: data.error || 'There was an issue sending the invite.'
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Invite sent',
            text: data.message,
            confirmButtonText: 'OK'
          });
        }
      } catch (error) {
        console.error('Error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Something went wrong!'
        });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Unauthorized',
        text: 'You must be logged in to send invites.'
      });
    }
  };

  const handleSendInviteClick = () => {
    Swal.fire({
      title: 'Enter username',
      input: 'text',
      inputAttributes: {
        autocapitalize: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Send invite',
      showLoaderOnConfirm: true,
      preConfirm: (username) => {
        return sendInvite(username);
      },
      allowOutsideClick: () => !Swal.isLoading()
    });
  };

  return (
    <>
      <button onClick={handleSendInviteClick}>Send Invite</button>
    </>
  );
};

export default InviteButton;
