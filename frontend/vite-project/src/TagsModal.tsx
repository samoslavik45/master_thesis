import React from 'react';
import './TagsModal.css';

interface TagsModalProps {
    show: boolean;
    tags: {
      publicTags: string[];
      userTags: string[];
    };
    onClose: () => void;
  }
  
  const TagsModal: React.FC<TagsModalProps> = ({ show, tags, onClose }) => {
    if (!show) return null;
  
    // Zastaví propagáciu kliknutia vnútri modálu, aby sa nevyvolal onClose
  const handleModalClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
  };

  const renderTags = (tags: string[]) => tags.join('; ');


return (
    <>
      {show && (
        <div className="tags-modal-backdrop show" onClick={onClose}>
          <div className="tags-modal show">
            <div className="tags-modal-content" onClick={e => e.stopPropagation()}>
              <div className="tags-modal-header">
                <h5 className="tags-modal-title">Tags</h5>
                <button type="button" className="tags-modal-close-button" onClick={onClose}>
                  &times;
                </button>
              </div>
              <div className="tags-modal-body">
                <h6>Public Tags:</h6>
                <p className="tags-text">{renderTags(tags.publicTags)}</p>
                <h6>Your Tags:</h6>
                <p className="tags-text">{renderTags(tags.userTags)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
  

export default TagsModal;
