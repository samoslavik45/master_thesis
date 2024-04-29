import React, { useState } from 'react';

interface KeywordsModalProps {
  keywords: string[];
  onConfirm: (keywords: string[]) => void;
}

interface EditedKeyword {
  value: string;
  selected: boolean;
}

const KeywordsModal: React.FC<KeywordsModalProps> = ({ keywords, onConfirm }) => {
  const [editedKeywords, setEditedKeywords] = useState<EditedKeyword[]>(
    keywords.map(keyword => ({ value: keyword, selected: true }))
  );

  const handleChange = (index: number, value: string) => {
    const newKeywords = [...editedKeywords];
    newKeywords[index].value = value;
    setEditedKeywords(newKeywords);
  };

  const handleCheckboxChange = (index: number) => {
    const newKeywords = [...editedKeywords];
    newKeywords[index].selected = !newKeywords[index].selected;
    setEditedKeywords(newKeywords);
  };

  const handleAddKeyword = () => {
    setEditedKeywords([...editedKeywords, { value: '', selected: true }]);
  };

  const handleSubmit = () => {
    onConfirm(editedKeywords.filter(keyword => keyword.selected).map(keyword => keyword.value));
  };

  return (
    <div className="keywords-modal">
      <form onSubmit={(e) => e.preventDefault()}>
        {editedKeywords.map((keyword, index) => (
          <div key={index}>
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

export default KeywordsModal;