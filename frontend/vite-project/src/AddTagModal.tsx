import React, { useState, FormEvent, ChangeEvent } from 'react';
import './AddTagModal.css';

interface AddTagModalProps {
  show: boolean;
  onClose: () => void;
  articleId: number | null;
  onAddTag: (articleId: number, tagName: string, isPublic: boolean) => void;
}

const AddTagModal: React.FC<AddTagModalProps> = ({ show, onClose, articleId, onAddTag }) => {
  const [tagName, setTagName] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(true);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (articleId !== null) {
      onAddTag(articleId, tagName, isPublic);
      onClose();
    } else {
      console.error('Error: articleId is null');
    }
  };

  return (
    <>
      {show && (
        <div className="tag-modal-backdrop show">
          <div className="tag-modal show">
            <form onSubmit={handleSubmit} className="tag-modal-content">
              <div className="tag-modal-form-group">
                <label htmlFor="tagName">Tag Name:</label>
                <input
                  type="text"
                  id="tagName"
                  className="tag-modal-input"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                />
              </div>
              <div className="tag-modal-form-group">
                <label>
                  <input
                    type="checkbox"
                    className="tag-modal-checkbox"
                    checked={isPublic}
                    onChange={() => setIsPublic(!isPublic)}
                  /> Is Public?
                </label>
              </div>
              <button type="submit" className="tag-modal-button">Add Tag</button>
              <button type="button" className="tag-modal-close-button" onClick={onClose}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
  
};

export default AddTagModal;
