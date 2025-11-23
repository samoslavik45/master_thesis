import React, { useState, useEffect } from 'react';
import { Article, Category, EditedKeyword } from './types';
import './EditArticleModal.css';
import KeywordsModal from './KeywordsModal';
import Swal from 'sweetalert2';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";


interface Keyword {
  id: number;
  keyword: string;
}

interface EditArticleModalProps {
  show: boolean;
  article: Article;
  categories: Category[];
  onClose: () => void;
  onDelete: (articleId: number) => void;
  onArticleUpdated: () => void;
}

const EditArticleModal: React.FC<EditArticleModalProps> = ({
  show,
  article,
  categories,
  onClose,
  onDelete,
  onArticleUpdated,
}) => {
  console.log('Modal show state:', show);
  console.log('Received article data:', article);

  const [formData, setFormData] = useState<{
    id: number;
    title: string;
    content: string;
    author_name: string;
    category: number | string;
    keywords: (number | string)[];
    tag: string | undefined;
  }>({
    id: article.id,
    title: article.title,
    content: article.content,
    author_name: article.authors.join(', '),
    category:
      typeof article.category === 'object'
        ? (article.category as any).id
        : (article.category as any),
    keywords: Array.isArray(article.keywords)
      ? (article.keywords as any[])
      : [],
    tag: (article as any).tag,
  });

  const [keywordData, setKeywordData] = useState<Keyword[]>([]);
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<number[]>([]);
  const [selectedKeywordNames, setSelectedKeywordNames] = useState<string[]>([]);
  const [showKeywordsModal, setShowKeywordsModal] = useState(false);
  const [editedKeywords, setEditedKeywords] = useState<EditedKeyword[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [keywordsChanged, setKeywordsChanged] = useState(false); // používa ho KeywordsModal, ale my už na ňom nezávisíme
  const [initialized, setInitialized] = useState(false);


  // ---------------------------------------------------------------------------
  // 1) Načítanie všetkých keywordov z backendu
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/keywords/');
        const data: Keyword[] = await response.json();
        setKeywordData(data);
      } catch (error) {
        console.error('Failed to fetch keywords:', error);
      }
    };

    fetchKeywords();
  }, []);

  // mapa id -> názov
  const keywordMap: { [key: string]: string } = keywordData.reduce(
    (map, keyword) => {
      map[keyword.id.toString()] = keyword.keyword;
      return map;
    },
    {} as { [key: string]: string }
  );

  // ---------------------------------------------------------------------------
  // 2) Keď sa zmení article, nastavíme základný formData + selectedKeywordIds
  // ---------------------------------------------------------------------------
  useEffect(() => {
  if (!show) {
    setInitialized(false);
    return;
  }

  if (initialized) return;  //  STOP multiple re-renders

  if (!article) return;

  const initialAuthors = article.authors.join(', ');

  const categoryId =
    typeof article.category === 'object'
      ? (article.category as any).id
      : (article.category as any);

  const kwIds: number[] = Array.isArray(article.keywords)
    ? (article.keywords as any[]).map((k) =>
        typeof k === 'object' ? (k as any).id : Number(k)
      )
    : [];

  setFormData({
    id: article.id,
    title: article.title,
    content: article.content,
    author_name: initialAuthors,
    category: categoryId,
    keywords: kwIds,
    tag: (article as any).tag,
  });

  setSelectedKeywordIds(kwIds);

  setInitialized(true);
}, [show, article?.id]);



  // ---------------------------------------------------------------------------
  // 3) Keď máme keywordData alebo selectedKeywordIds, dopočítame názvy
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!selectedKeywordIds.length || !keywordData.length) {
      setSelectedKeywordNames([]);
      return;
    }

    const names = selectedKeywordIds
      .map((id) => keywordMap[id.toString()])
      .filter(Boolean);

    setSelectedKeywordNames(names);
  }, [selectedKeywordIds, keywordData]); // keywordMap je z keywordData

  // ---------------------------------------------------------------------------
  // 4) Edit keywords – otvoríme KeywordsModal s existujúcimi keywordmi
  // ---------------------------------------------------------------------------
  const handleEditKeywordsClick = () => {
    const keywordsToEdit: EditedKeyword[] = selectedKeywordIds.map((id) => ({
      id: id.toString(),                              // ⬅️ dôležitá zmena
      value: keywordMap[id.toString()] || 'Unknown keyword',
      selected: true,
    }));

    setEditedKeywords(keywordsToEdit);
    setShowKeywordsModal(true);
  };


  // ---------------------------------------------------------------------------
  // 5) Pomocná funkcia na vytvorenie keywordu na backende
  // ---------------------------------------------------------------------------
  async function createKeyword(keyword: string) {
    const response = await fetch('http://localhost:8000/api/create/keyword/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ keyword }),
    });
    return response.json() as Promise<Keyword>;
  }

  // ---------------------------------------------------------------------------
  // 6) Potvrdenie keywords z KeywordsModal
  //    - vytvoríme nové keywords
  //    - spojíme staré + nové
  //    - uložíme ID aj názvy do state
  // ---------------------------------------------------------------------------
const handleKeywordsConfirm = async (selected: EditedKeyword[]) => {
  console.log('handleKeywordsConfirm – selected:', selected);

  // EXISTUJÚCE keywordy, ktoré user ponechal a NEZMENIL ich názov
  const existingSelected = selected.filter((kw) => {
    if (!kw.selected || !kw.id || kw.id.trim() === '') return false;

    const originalName = keywordMap[kw.id.toString()];
    const newName = kw.value.trim();

    return originalName.toLowerCase() === newName.toLowerCase();
  });

  // NOVÉ keywordy:
  // 1) tie bez ID
  // 2) tie, čo sa zmenili (prepísané)
  const newSelected = selected.filter((kw) => {
    if (!kw.selected) return false;

    const newName = kw.value.trim();

    // úplne nové keywords (nemajú ID)
    if (!kw.id || kw.id.trim() === '') return newName !== '';

    // keywords, ktoré mali ID, ale boli prepísané
    const originalName = keywordMap[kw.id.toString()];
    return originalName.toLowerCase() !== newName.toLowerCase();
  });

  console.log('existingSelected:', existingSelected);
  console.log('newSelected (to create or changed):', newSelected);

  // Vytvoríme nové (alebo prepísané) keywords v DB
  const createdKeywords: Keyword[] = await Promise.all(
    newSelected.map((kw) => createKeyword(kw.value.trim()))
  );

  console.log('createdKeywords from backend:', createdKeywords);

  // Pridáme ich do keywordData → obnoví keywordMap
  setKeywordData((prev) => [...prev, ...createdKeywords]);

  // ID všetkých vybraných Keywordov
  const allIds: number[] = [
    ...existingSelected.map((kw) => Number(kw.id)),
    ...createdKeywords.map((kw) => kw.id),
  ];

  // Názvy pre UI
  const allNames: string[] = [
    ...existingSelected.map((kw) => kw.value.trim()),
    ...createdKeywords.map((kw) => kw.keyword),
  ];

  console.log('allIds:', allIds);
  console.log('allNames:', allNames);

  setSelectedKeywordIds(allIds);
  setSelectedKeywordNames(allNames);

  setFormData((prev) => ({
    ...prev,
    keywords: allIds,
  }));

  setShowKeywordsModal(false);
  setKeywordsChanged(false);
};



  // ---------------------------------------------------------------------------
  // 7) Zmena inputov (title, content, author_name, category)
  // ---------------------------------------------------------------------------
  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // ---------------------------------------------------------------------------
  // 8) Update článku na backende (PUT)
  // ---------------------------------------------------------------------------
  async function updateArticle(articleData: any) {
    try {
      const response = await fetch(
        `http://localhost:8000/api/articles/update/${formData.id}/`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(articleData),
        }
      );

      if (response.ok) {
        Swal.fire({
          title: 'Success!',
          text: 'Your article has been updated successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        }).then(() => {
          onArticleUpdated();
          onClose();
        });
      } else {
        console.error('Update response not OK:', await response.text());
        throw new Error('Failed to update article');
      }
    } catch (error) {
      console.error('Error updating article:', error);
      Swal.fire({
        title: 'Error!',
        text: 'There was a problem updating your article.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 9) Submit formulára
  // ---------------------------------------------------------------------------
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log('---- SUBMIT ----');
    console.log('FormData before submit:', formData);
    console.log('selectedKeywordIds:', selectedKeywordIds);
    console.log('selectedKeywordNames:', selectedKeywordNames);

    const authorsArray = formData.author_name
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    console.log('AuthorsArray:', authorsArray);

    // Ak by z nejakého dôvodu selectedKeywordNames boli prázdne,
    // dopočítame ich z mapy (bezpečnostná sieť)
    let keywordNamesToUse = selectedKeywordNames;
    if (!keywordNamesToUse.length && selectedKeywordIds.length) {
      keywordNamesToUse = selectedKeywordIds
        .map((id) => keywordMap[id.toString()])
        .filter(Boolean);
    }

    const keywordsText = keywordNamesToUse.join(', ');
    console.log('Final keywordsText:', keywordsText);

    const articleData = {
      title: formData.title,
      content: formData.content,
      authors: authorsArray,
      category_id: formData.category,
      tag: formData.tag,
      keywords_text: keywordsText,
    };

    console.log('Final articleData sending to backend:', articleData);

    await updateArticle(articleData);
  };

  // ---------------------------------------------------------------------------
  // 10) Delete článku
  // ---------------------------------------------------------------------------
  const handleDelete = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(article.id);
        onClose();
        Swal.fire('Deleted!', 'Your article has been deleted.', 'success');
      }
    });
  };

  // ---------------------------------------------------------------------------
  // 11) Filter kategórií
  // ---------------------------------------------------------------------------
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!show || !article) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // 12) Render
  // ---------------------------------------------------------------------------
return (
  <Dialog open={show} onOpenChange={onClose}>
    <DialogContent
      className="
        max-w-2xl 
        rounded-2xl 
        bg-white/90 
        backdrop-blur-xl
        border 
        shadow-2xl
        p-0
      "
    >
      <DialogHeader className="p-6 pb-2">
        <DialogTitle className="text-2xl font-semibold tracking-tight">
          Edit Article
        </DialogTitle>
      </DialogHeader>

      <ScrollArea className="max-h-[70vh] px-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* TITLE */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="bg-white/70 backdrop-blur-sm border rounded-lg"
            />
          </div>

          {/* ABSTRACT */}
          <div className="space-y-2">
            <Label>Abstract</Label>
            <Textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              className="min-h-[150px] bg-white/70 backdrop-blur-sm border rounded-lg"
            />
          </div>

          {/* AUTHORS */}
          <div className="space-y-2">
            <Label>Authors (comma-separated)</Label>
            <Input
              type="text"
              name="author_name"
              value={formData.author_name}
              onChange={handleChange}
            />
          </div>

          {/* CATEGORY SEARCH */}
          <div className="space-y-2">
            <Label>Search Categories</Label>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search categories..."
            />
          </div>

          {/* CATEGORY LIST */}
          <div className="space-y-2">
            <Label>Select Category</Label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 bg-white/70"
              size={5}
            >
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* KEYWORDS */}
          <div className="space-y-3">
            <Label>Keywords</Label>

            {/* Chips preview */}
            <div className="flex flex-wrap gap-2">
              {selectedKeywordNames.map((name, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs"
                >
                  {name}
                </span>
              ))}
            </div>

            {/* Edit button */}
            <Button
              type="button"
              variant="secondary"
              onClick={handleEditKeywordsClick}
              className="rounded-lg"
            >
              Edit Keywords
            </Button>
          </div>

          {showKeywordsModal && (
            <KeywordsModal
              editedKeywords={editedKeywords}
              onConfirm={handleKeywordsConfirm}
              setKeywordsChanged={setKeywordsChanged}
              setShowKeywordsModal={setShowKeywordsModal}
            />
          )}

          <DialogFooter className="p-6 pt-2 flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className="rounded-lg"
          >
            Delete Article
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="rounded-lg"
            >
              Close
            </Button>

            <Button
              type="submit"
              className="rounded-lg bg-primary text-white"
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
        </form>
      </ScrollArea>

      
    </DialogContent>
  </Dialog>
);

};

export default EditArticleModal;
