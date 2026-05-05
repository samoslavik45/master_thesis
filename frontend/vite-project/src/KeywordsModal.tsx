import React, { useState, useEffect } from 'react';
import { EditedKeyword } from './types'; 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";



interface KeywordsModalProps {
  editedKeywords: EditedKeyword[];
  onConfirm: (editedKeywords: EditedKeyword[]) => void;
  setKeywordsChanged: (changed: boolean) => void; 
  setShowKeywordsModal: (show: boolean) => void; 
}

const KeywordsModal: React.FC<KeywordsModalProps> = ({ editedKeywords, onConfirm, setKeywordsChanged, setShowKeywordsModal }) => {
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
  <Dialog open={true} onOpenChange={() => setShowKeywordsModal(false)}>
    <DialogContent
      className="
        max-w-lg 
        rounded-2xl 
        bg-white/90 
        backdrop-blur-xl
        border 
        shadow-2xl
        p-0
      "
    >
      <DialogHeader className="p-6 pb-2">
        <DialogTitle className="text-xl font-semibold tracking-tight">
          Edit Keywords
        </DialogTitle>
      </DialogHeader>

      <ScrollArea className="max-h-[60vh] px-6">
        <div className="space-y-4 pb-4">

          {localEditedKeywords.map((keyword, index) => (
            <div
              key={index}
              className="
                flex 
                items-center 
                gap-4 
                border 
                rounded-lg 
                p-3 
                bg-white/70 
                shadow-sm
              "
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={keyword.selected}
                  onCheckedChange={() => handleCheckboxChange(index)}
                />
              </div>

              <Input
                value={keyword.value}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder="Keyword..."
                className="flex-1"
              />
            </div>
          ))}

          <Button
            type="button"
            variant="secondary"
            onClick={handleAddKeyword}
            className="w-full rounded-lg"
          >
            + Add Keyword
          </Button>
        </div>
      </ScrollArea>

      <DialogFooter className="p-6 pt-2 flex justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowKeywordsModal(false)}
          className="rounded-lg"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          className="rounded-lg bg-primary text-white"
        >
          Confirm Keywords
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

};

export default KeywordsModal;
