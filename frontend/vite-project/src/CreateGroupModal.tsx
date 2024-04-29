import React, { useState } from 'react';
import './CreateGroupModal.css';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (groupName: string) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [groupName, setGroupName] = useState('');

  const handleCreateClick = () => {
    onCreate(groupName);
    setGroupName('');
    onClose(); 
  };
  if (!isOpen) return null;

  return (
    <>
      <div className={`create-modal-backdrop ${isOpen ? 'show' : ''}`} onClick={onClose}></div>
      <div className={`create-modal ${isOpen ? 'show' : ''}`}>
        <div className="create-modal-content">
          <span className="close-button" onClick={onClose}>&times;</span>
          <h2>Creating group</h2>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Názov skupiny"
          />
          <button onClick={handleCreateClick}>Creat group</button>
        </div>
      </div>
    </>
  );
};

export default CreateGroupModal;
