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
    category: article.categories?.[0]?.id ?? "",
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saveResultOpen, setSaveResultOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error">("success");



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

    if (initialized) return;
    if (!article) return;
    if (!keywordData.length) return; // počkaj, kým sa načíta zoznam keywordov

    const initialAuthors = article.authors.join(", ");

    // CATEGORY FIX – ostáva tak ako máš ↓
    const categoryId =
      article.categories?.[0]?.id ??
      (typeof article.category === "object"
        ? (article.category as any).id
        : (article.category as any));

    // KEYWORDS FIX 🟫
    const kwIds = article.keywords
      .map((keywordName: string) => {
        // nájde keyword v keywordData podľa názvu
        const found = keywordData.find(
          (kw) => kw.keyword.toLowerCase() === keywordName.toLowerCase()
        );
        return found?.id ?? null;
      })
      .filter((x) => x !== null) as number[];

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
  }, [show, article?.id, keywordData.length]);




  // ---------------------------------------------------------------------------
  // 3) Keď máme keywordData alebo selectedKeywordIds, dopočítame názvy
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!selectedKeywordIds.length || !keywordData.length) {
      setSelectedKeywordNames([]);
      return;
    }

    const names = selectedKeywordIds
      .map((id) => keywordData.find((kw) => kw.id === id)?.keyword)
      .filter(Boolean) as string[];

    setSelectedKeywordNames(names);
  }, [selectedKeywordIds, keywordData]);


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
        setSaveStatus("success");
        setSaveResultOpen(true);
        onArticleUpdated();
      } else {
        setSaveStatus("error");
        setSaveResultOpen(true);
      }
    } catch (error) {
      setSaveStatus("error");
      setSaveResultOpen(true);
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
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    onDelete(article.id);
    setDeleteOpen(false);
    onClose();
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
        max-w-3xl w-full overflow-hidden
        rounded-3xl border border-[hsl(var(--border))]
        bg-[hsl(var(--card))] text-[hsl(var(--foreground))]
        shadow-[0_22px_60px_rgba(148,116,87,0.35)]
        backdrop-blur-xl
        p-0
      "
    >
      {/* HEADER */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--primary))]" />

        <DialogHeader className="px-6 pt-5 pb-3">
          <DialogTitle className="text-xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            Edit article
          </DialogTitle>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Update metadata, refine keywords or move the paper into a different category.
          </p>

          <span className="absolute right-6 top-6 text-[0.65rem] uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
            ID #{article.id}
          </span>
        </DialogHeader>
      </div>

      {/* BODY */}
      <ScrollArea className="max-h-[70vh] px-6 pb-4">
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">

          {/* TITLE */}
          <section className="space-y-2">
            <Label className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
              Title
            </Label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="
                h-10 rounded-xl
                border border-[hsl(var(--border))]
                bg-[hsl(var(--accent))]
                text-sm
                shadow-sm
                focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-0
              "
            />
            <p className="text-[0.7rem] text-[hsl(var(--muted-foreground))]">
              Use the original paper title or a clear, descriptive alternative.
            </p>
          </section>

          {/* ABSTRACT */}
          <section className="space-y-2">
            <Label className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
              Abstract
            </Label>
            <Textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              className="
                min-h-[160px]
                rounded-xl
                border border-[hsl(var(--border))]
                bg-[hsl(var(--accent))]
                text-sm
                shadow-sm
                focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-0
              "
            />
            <p className="text-[0.7rem] text-[hsl(var(--muted-foreground))]">
              You can paste the full abstract or a short summary of the article.
            </p>
          </section>

          {/* AUTHORS */}
          <section className="space-y-2">
            <Label className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
              Authors
            </Label>
            <Input
              type="text"
              name="author_name"
              value={formData.author_name}
              onChange={handleChange}
              className="
                h-10 rounded-xl
                border border-[hsl(var(--border))]
                bg-[hsl(var(--accent))]
                text-sm
                shadow-sm
                focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-0
              "
              placeholder="Jimmy Lei Ba, Diederik P. Kingma"
            />
            <p className="text-[0.7rem] text-[hsl(var(--muted-foreground))]">
              Separate multiple authors with a comma.
            </p>
          </section>

          {/* CATEGORY */}
          <section className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <Label className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
                  Category
                </Label>
                <p className="mt-1 text-[0.7rem] text-[hsl(var(--muted-foreground))]">
                  Choose the most relevant discipline for this article.
                </p>
              </div>

              {/* ACTIVE CATEGORY PILL */}
              <div className="
                inline-flex items-center gap-2
                rounded-full border border-[hsl(var(--border))]
                bg-[hsl(var(--accent))]
                px-3 py-1.5 text-[0.75rem]
              ">
                <span className="
                  inline-flex h-6 w-6 items-center justify-center
                  rounded-full bg-[hsl(var(--primary))]
                  text-[0.7rem] font-semibold
                  text-[hsl(var(--primary-foreground))]
                ">
                  {(
                    (categories.find(c => c.id === Number(formData.category))?.name ??
                      "?")[0] || "?"
                  ).toUpperCase()}
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-[hsl(var(--foreground))]">
                    {categories.find(c => c.id === Number(formData.category))?.name ??
                      "No category selected"}
                  </span>
                  <span className="text-[0.65rem] text-[hsl(var(--muted-foreground))]">
                    Active category
                  </span>
                </div>
              </div>
            </div>

            {/* SEARCH + LIST – POD SEBOU */}
            <div className="space-y-3">
              {/* Search input */}
              <div className="space-y-2">
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search categories…"
                  className="
                    h-10 rounded-xl
                    border border-[hsl(var(--border))]
                    bg-[hsl(var(--accent))]
                    text-sm
                    shadow-sm
                    focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-0
                  "
                />
                <p className="text-[0.7rem] text-[hsl(var(--muted-foreground))]">
                  Start typing to quickly filter the category list.
                </p>
              </div>

              {/* Category list as pills/buttons */}
              <div className="
                h-[150px] rounded-xl
                border border-[hsl(var(--border))]
                bg-[hsl(var(--accent))]
                overflow-hidden
              ">
                <ScrollArea className="h-full">
                  <div className="p-1 space-y-1">
                    {filteredCategories.length ? (
                      filteredCategories.map((category) => {
                        const isActive = Number(formData.category) === category.id;
                        return (
                          <button
                            type="button"
                            key={category.id}
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, category: category.id }))
                            }
                            className={`
                              flex w-full flex-col items-start gap-0.5
                              rounded-lg px-3 py-2 text-left text-sm transition
                              ${
                                isActive
                                  ? "bg-[hsl(var(--primary))/0.08] border border-[hsl(var(--primary))/0.5]"
                                  : "bg-transparent border border-transparent hover:bg-[hsl(var(--muted))]"
                              }
                            `}
                          >
                            <div className="flex w-full items-center justify-between gap-2">
                              <span className="truncate font-medium">
                                {category.name}
                              </span>
                              <span
                                className={`
                                  ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full border text-[0.55rem]
                                  ${
                                    isActive
                                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                                      : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
                                  }
                                `}
                              >
                                {isActive ? "✓" : ""}
                              </span>
                            </div>
                            {category.description && (
                              <span className="line-clamp-1 text-[0.7rem] text-[hsl(var(--muted-foreground))]">
                                {category.description}
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-3 py-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
                        No categories match this search.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </section>

          {/* KEYWORDS */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
                  Keywords
                </Label>
                <p className="mt-1 text-[0.7rem] text-[hsl(var(--muted-foreground))]">
                  Use keywords to make this article easier to discover.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleEditKeywordsClick}
                className="
                  rounded-xl px-4 py-2 text-xs font-semibold
                  border-[hsl(var(--primary))/0.6]
                  bg-[hsl(var(--accent))]
                  text-[hsl(var(--primary))]
                  hover:bg-[hsl(var(--muted))]
                "
              >
                Edit keywords
              </Button>
            </div>

            {/* Chips preview */}
            <div className="flex flex-wrap gap-2">
              {selectedKeywordNames.length ? (
                selectedKeywordNames.map((name, i) => (
                  <span
                    key={i}
                    className="
                      inline-flex items-center gap-1
                      rounded-full bg-[hsl(var(--muted))]
                      px-3 py-1
                      text-xs font-medium text-[hsl(var(--foreground))]
                    "
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
                    {name}
                  </span>
                ))
              ) : (
                <span className="text-[0.75rem] italic text-[hsl(var(--muted-foreground))]">
                  No keywords selected yet.
                </span>
              )}
            </div>

            {showKeywordsModal && (
              <KeywordsModal
                editedKeywords={editedKeywords}
                onConfirm={handleKeywordsConfirm}
                setKeywordsChanged={setKeywordsChanged}
                setShowKeywordsModal={setShowKeywordsModal}
              />
            )}
          </section>

          {/* FOOTER BUTTONS */}
          <DialogFooter
            className="
              mt-4 flex flex-col gap-3
              border-t border-[hsl(var(--border))]
              pt-4 pb-2
              sm:flex-row sm:items-center sm:justify-between
            "
          >
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              className="
                rounded-xl px-4 py-2 text-sm font-semibold
                border-[hsl(var(--destructive))]/70
                bg-[hsl(var(--destructive))]/10
                text-[hsl(var(--destructive))]
                hover:bg-[hsl(var(--destructive))]/20
              "
            >
              Delete article
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="
                  rounded-xl px-5 py-2 text-sm font-medium
                  border-[hsl(var(--border))]
                  bg-[hsl(var(--secondary))]
                  text-[hsl(var(--foreground))]
                  hover:bg-[hsl(var(--muted))]
                "
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="
                  rounded-xl px-6 py-2 text-sm font-semibold
                  bg-[hsl(var(--primary))]
                  text-[hsl(var(--primary-foreground))]
                  shadow-md hover:brightness-110
                "
              >
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </ScrollArea>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
              Delete Article
            </DialogTitle>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              This action is irreversible. Do you really want to delete this article?
            </p>
          </DialogHeader>

          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]"
            >
              Cancel
            </Button>

            <Button
              onClick={confirmDelete}
              className="rounded-xl bg-[hsl(var(--destructive))] text-white hover:brightness-110"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={saveResultOpen} onOpenChange={setSaveResultOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
              {saveStatus === "success" ? "Article Updated" : "Update Failed"}
            </DialogTitle>

            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {saveStatus === "success"
                ? "Your article was successfully updated."
                : "There was an issue saving your changes. Please try again."}
            </p>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              onClick={() => {
                setSaveResultOpen(false);
                if (saveStatus === "success") onClose();
              }}
              className="rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110 px-6"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DialogContent>
  </Dialog>
);



};

export default EditArticleModal;
