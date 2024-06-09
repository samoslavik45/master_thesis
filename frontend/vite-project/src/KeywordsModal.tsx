import React, { useState, useEffect } from 'react';
import { EditedKeyword } from './types'; 


interface KeywordsModalProps {
  editedKeywords: EditedKeyword[];
  onConfirm: (editedKeywords: EditedKeyword[]) => void;
  setKeywordsChanged: (changed: boolean) => void; 
  setShowKeywordsModal: (show: boolean) => void; 
}

const KeywordsModalAdd: React.FC<KeywordsModalProps> = ({ editedKeywords, onConfirm, setKeywordsChanged, setShowKeywordsModal }) => {
  const [localEditedKeywords, setLocalEditedKeywords] = useState<EditedKeyword[]>(editedKeywords);


  useEffect(() => {
    setLocalEditedKeywords(editedKeywords);
  }, [editedKeywords]);

  const handleChange = (index: number, value: string) => {
    const newKeywords = [...localEditedKeywords];
    newKeywords[index].value = value;
    setLocalEditedKeywords(newKeywords);
    setKeywordsChanged(true);  
  };

  const handleCheckboxChange = (index: number) => {
    const newKeywords = [...localEditedKeywords];
    newKeywords[index].selected = !newKeywords[index].selected;
    setLocalEditedKeywords(newKeywords);
    setKeywordsChanged(true);  
  };
  

  const handleAddKeyword = () => {
    const newKeyword = { id: '', value: '', selected: true };
    setLocalEditedKeywords([...localEditedKeywords, newKeyword]);
    setKeywordsChanged(true);  
  };
  
  const handleSubmit = () => {
    const selectedKeywords = localEditedKeywords.filter(keyword => keyword.selected);
    onConfirm(selectedKeywords);
    setShowKeywordsModal(false);
    setKeywordsChanged(true); 
  };

  return (
    <div className="keywords-modal">
      <form onSubmit={(e) => e.preventDefault()}>
        {localEditedKeywords.map((keyword, index) => (
          <div key={index}> {}
            <input
              type="checkbox"
              checked={keyword.selected}
              onChange={() => handleCheckboxChange(index)}
            />
            <input
              type="text"
              value={keyword.value}
              onChange={(e) => handleChange(index, e.target.value)}
            />
          </div>
        ))}
        <button type="button" onClick={handleAddKeyword}>Add Keyword</button>
        <button type="button" onClick={handleSubmit}>Confirm Keywords</button>
      </form>
    </div>
  );
};

export default KeywordsModalAdd;
