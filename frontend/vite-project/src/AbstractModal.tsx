import React, { useState } from 'react';

interface AbstractModalProps {
  abstract: string;
  onConfirm: (abstract: string) => void;
  onClose: () => void;
}

const AbstractModal: React.FC<AbstractModalProps> = ({ abstract, onConfirm, onClose }) => {
  const [editedAbstract, setEditedAbstract] = useState<string>(abstract);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onConfirm(editedAbstract);
  };

  return (
    <div className="modal" style={{ display: 'block' }}> {/* Upravte štýly podľa vašich potrieb */}
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Abstract</h5>
            <button type="button" className="close" onClick={onClose}> {/* Zmena tu */}
                <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <textarea
                className="form-control"
                value={editedAbstract}
                onChange={(e) => setEditedAbstract(e.target.value)}
                rows={5}
              ></textarea>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbstractModal;
