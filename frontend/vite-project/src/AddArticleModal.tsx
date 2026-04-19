import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { Category, EditedKeyword } from "./types";
import KeywordsModal from "./KeywordsModal";
import AbstractModal from "./AbstractModal";

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
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Plus } from "lucide-react";

interface AddArticleModalProps {
  show: boolean;
  onClose: () => void;
  onArticleAdded?: () => void;
}

interface FormState {
  title: string;
  content: string;
  author_name: string;
}

const AddArticleModal: React.FC<AddArticleModalProps> = ({
  show,
  onClose,
  onArticleAdded,
}) => {
  const initialFormData: FormState = {
    title: "",
    content: "",
    author_name: "",
  };

  const [formData, setFormData] = useState<FormState>(initialFormData);
  const [file, setFile] = useState<File | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [keywordsText, setKeywordsText] = useState<string>("");
  const [showKeywordsModal, setShowKeywordsModal] = useState(false);
  const [keywordsForEditing, setKeywordsForEditing] = useState<EditedKeyword[]>(
    []
  );
  const [keywordsChanged, setKeywordsChanged] = useState(false);

  const [showAbstractModal, setShowAbstractModal] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // NEW: state pre shadcn “New category” dialog
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null);
  const [categoryResultOpen, setCategoryResultOpen] = useState(false);

  const [submitResultOpen, setSubmitResultOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error">("success");
  const [submitMessage, setSubmitMessage] = useState<string>("");


  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const triggerFileSelectPopup = () => fileInputRef.current?.click();

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // Načítanie kategórií
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesResponse = await fetch(
          "http://localhost:8000/api/categories/"
        );
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories: ", error);
      }
    };

    fetchCategories();
  }, []);

  // ---------------------------------------------------------------------------
  // Handler zmien v textových poliach
  // ---------------------------------------------------------------------------
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------------------------------------------------------------------
  // Reset + zatvorenie modalu
  // ---------------------------------------------------------------------------
  const handleClose = () => {
    setFormData(initialFormData);
    setFile(null);
    setPdfUploaded(false);
    setSelectedCategory("");
    setKeywordsText("");
    setKeywordsForEditing([]);
    setShowKeywordsModal(false);
    setShowAbstractModal(false);
    setSearchTerm("");
    onClose();
  };

  // ---------------------------------------------------------------------------
  // Upload PDF + extrakcia meta + keywords
  // ---------------------------------------------------------------------------
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const pdfFile = e.target.files[0];
    setFile(pdfFile);

    const uploadFormData = new FormData();
    uploadFormData.append("pdf_file", pdfFile);

    try {
      const response = await fetch("http://127.0.0.1:8000/extract-keywords/", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await response.json();
      setPdfUploaded(true);

      // Title, authors, abstract
      setFormData((prevState) => ({
        ...prevState,
        title: data.title || "",
        author_name: data.author || "",
        content: data.abstract || prevState.content,
      }));

      if (data.abstract) {
        setShowAbstractModal(true);
      }

      // Keywords → do modalu + inputu
      if (Array.isArray(data.keywords)) {
        const cleanedKeywords = data.keywords
          .map((kw: string) => kw.replace(/\s+/g, " ").trim())
          .filter(Boolean);

        setKeywordsText(cleanedKeywords.join(", "));

        const formatted: EditedKeyword[] = cleanedKeywords.map(
          (kw: string) => ({
            id: "",
            value: kw,
            selected: true,
          })
        );

        setKeywordsForEditing(formatted);
      } else {
        console.error(
          "Received keywords are not in an array format:",
          data.keywords
        );
        setKeywordsText("");
      }
    } catch (error) {
      console.error("Error extracting keywords:", error);
      setKeywordsText("");
    }
  };

  // ---------------------------------------------------------------------------
  // NEW: shadcn “New category” dialog – otvorenie
  // ---------------------------------------------------------------------------
  const openAddCategoryDialog = () => {
    setNewCategoryName("");
    setNewCategoryDescription("");
    setAddCategoryError(null);
    setAddCategoryOpen(true);
  };

  // ---------------------------------------------------------------------------
  // NEW: vytvorenie kategórie cez API
  // ---------------------------------------------------------------------------
  const handleConfirmAddCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryDescription.trim()) {
      setAddCategoryError("Please fill in both name and description.");
      return;
    }

    setIsCreatingCategory(true);
    setAddCategoryError(null);

    try {
      const response = await fetch("http://localhost:8000/api/categories/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setAddCategoryError(
          result?.detail || "Failed to add new category. Please try again."
        );
        return;
      }

      // pridáme novú kategóriu do zoznamu a rovno ju vyberieme
      setCategories((prev) => [...prev, result]);
      setSelectedCategory(result.id.toString());
      setAddCategoryOpen(false);
      setCategoryResultOpen(true);
    } catch (error) {
      console.error("Failed to add category:", error);
      setAddCategoryError("Unexpected error. Please try again.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Potvrdenie keywords z KeywordsModal
  // ---------------------------------------------------------------------------
  const handleKeywordsConfirm = (edited: EditedKeyword[]) => {
    const selectedValues = edited
      .filter((k) => k.selected && k.value.trim() !== "")
      .map((k) => k.value.trim());

    const text = selectedValues.join(", ");

    setKeywordsText(text);
    setKeywordsForEditing(edited);
    setShowKeywordsModal(false);
    setKeywordsChanged(false);
  };

 // ---------------------------------------------------------------------------
  // Submit formulára
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const authorsArray = formData.author_name
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("content", formData.content);

    authorsArray.forEach((author) => {
      formDataToSend.append("authors", author);
    });

    if (selectedCategory) {
      formDataToSend.append("categories", selectedCategory);
    }

    formDataToSend.append("keywords_text", keywordsText);

    if (!file) {
      setSubmitStatus("error");
      setSubmitMessage("Please select a PDF file to upload.");
      setSubmitResultOpen(true);
      return;
    }

    formDataToSend.append("pdf_file", file);

    try {
      const response = await fetch(
        "http://localhost:8000/api/articles/create/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        setSubmitStatus("error");
        setSubmitMessage(
          data.error || "Something went wrong, please try again."
        );
        setSubmitResultOpen(true);
        return;
      }

      // success
      setSubmitStatus("success");
      setSubmitMessage("Article has been successfully posted.");
      setSubmitResultOpen(true);
    } catch (error) {
      console.error("Error:", error);
      setSubmitStatus("error");
      setSubmitMessage("An error occurred, please try again.");
      setSubmitResultOpen(true);
    }
  };


  if (!show) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      <Dialog
        open={show}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent
          className="
            max-w-3xl w-full overflow-hidden
            rounded-3xl border border-[hsl(var(--border))]
            bg-[hsl(var(--card))]/95 text-[hsl(var(--foreground))]
            shadow-[0_22px_60px_rgba(148,116,87,0.35)]
            backdrop-blur-xl
            p-0
          "
        >
          {/* HEADER */}
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--primary))]" />

            <DialogHeader className="px-6 pt-5 pb-3">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Add new article
              </DialogTitle>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                Upload a PDF, review the extracted metadata and categorize your
                paper.
              </p>
            </DialogHeader>
          </div>

          {/* BODY */}
          <ScrollArea className="max-h-[75vh] px-4 pb-4">
            <form onSubmit={handleSubmit} className="space-y-6 pt-2 px-2">
              {/* STEP 1 – PDF FILE */}
              <section className="space-y-3">
                <Label className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
                  PDF file
                </Label>

                <input
                  ref={fileInputRef}
                  type="file"
                  id="pdf_file"
                  name="pdf_file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div
                  className="
                    flex flex-col sm:flex-row items-center gap-3
                    rounded-2xl border border-dashed border-[hsl(var(--border))]
                    bg-[hsl(var(--accent))]
                    px-4 py-4
                  "
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--muted))]">
                    <Upload className="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>

                  <div className="flex-1 space-y-1 text-center sm:text-left">
                    <p className="text-sm font-medium">
                      {file ? file.name : "Select a PDF file to start"}
                    </p>
                    <p className="text-[0.7rem] text-[hsl(var(--muted-foreground))]">
                      We will try to extract the title, authors, abstract and
                      keywords automatically.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={triggerFileSelectPopup}
                    className="
                      rounded-xl px-4 py-2 text-sm font-semibold
                      bg-[hsl(var(--primary))]
                      text-[hsl(var(--primary-foreground))]
                      hover:brightness-110
                    "
                  >
                    {pdfUploaded ? "Replace file" : "Select file"}
                  </Button>
                </div>

                {pdfUploaded && (
                  <p className="flex items-center gap-2 text-[0.75rem] text-[hsl(var(--muted-foreground))]">
                    <FileText className="h-3.5 w-3.5" />
                    Metadata extracted from the PDF. Review and adjust before
                    posting.
                  </p>
                )}
              </section>

              {/* Zvyšok formulára až po uploade */}
              {pdfUploaded && (
                <>
                  {/* TITLE */}
                  <section className="space-y-2">
                    <Label className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
                      Title
                    </Label>
                    <Input
                      id="title"
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
                  </section>

                  {/* ABSTRACT */}
                  <section className="space-y-2">
                    <Label className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
                      Abstract
                    </Label>
                    <Textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      rows={5}
                      className="
                        min-h-[140px]
                        rounded-xl
                        border border-[hsl(var(--border))]
                        bg-[hsl(var(--accent))]
                        text-sm
                        shadow-sm
                        focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-0
                      "
                    />
                    <p className="text-[0.7rem] text-[hsl(var(--muted-foreground))]">
                      You can edit the extracted abstract or replace it with
                      your own summary.
                    </p>
                  </section>

                  {/* AUTHORS */}
                  <section className="space-y-2">
                    <Label className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
                      Authors
                    </Label>
                    <Input
                      id="author_name"
                      name="author_name"
                      value={formData.author_name}
                      onChange={handleChange}
                      placeholder="Jimmy Lei Ba, Diederik P. Kingma"
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
                      Separate multiple authors with a comma.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.author_name &&
                      formData.author_name
                        .split(",")
                        .map((author) => author.trim())
                        .filter(Boolean).length ? (
                        formData.author_name
                          .split(",")
                          .map((author) => author.trim())
                          .filter(Boolean)
                          .map((author, idx) => (
                            <Badge
                              key={idx}
                              className="
                                rounded-full bg-[hsl(var(--muted))]
                                text-[hsl(var(--foreground))] text-xs font-medium
                                px-3 py-1
                              "
                            >
                              {author}
                            </Badge>
                          ))
                      ) : (
                        <span className="text-[0.75rem] italic text-[hsl(var(--muted-foreground))]">
                          No authors detected yet.
                        </span>
                      )}
                    </div>
                  </section>

                  {/* CATEGORIES */}
                  <section className="space-y-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <Label className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
                          Category
                        </Label>
                        <p className="mt-1 text-[0.7rem] text-[hsl(var(--muted-foreground))]">
                          Pick the single discipline that best matches this
                          article.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={openAddCategoryDialog}
                        className="
                          rounded-xl px-4 py-2 text-xs font-semibold
                          border-[hsl(var(--primary))/0.6]
                          bg-[hsl(var(--accent))]
                          text-[hsl(var(--primary))]
                          hover:bg-[hsl(var(--muted))]
                        "
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        New category
                      </Button>
                    </div>

                    {/* SEARCH + LIST (pod sebou) */}
                    <div className="space-y-3">
                      {/* Search input */}
                      <div className="space-y-2">
                        <Input
                          id="categorySearch"
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
                      </div>

                      {/* Category list – single select */}
                      <div
                        className="
                          h-[170px] rounded-xl
                          border border-[hsl(var(--border))]
                          bg-[hsl(var(--accent))]
                          overflow-hidden
                        "
                      >
                        <ScrollArea className="h-full">
                          <div className="p-1 space-y-1">
                            {filteredCategories.length ? (
                              filteredCategories.map((category) => {
                                const idStr = category.id.toString();
                                const isSelected = selectedCategory === idStr;

                                return (
                                  <button
                                    type="button"
                                    key={category.id}
                                    onClick={() => setSelectedCategory(idStr)}
                                    className={`
                                      flex w-full flex-col items-start gap-0.5
                                      rounded-lg px-3 py-2 text-left text-sm transition
                                      ${
                                        isSelected
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
                                            isSelected
                                              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
                                          }
                                        `}
                                      >
                                        {isSelected ? "✓" : ""}
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
                        <p className="text-[0.7rem] text-[hsl(var(--muted-foreground))]">
                          Comma-separated list. You can adjust what was
                          extracted from the PDF.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (!keywordsForEditing.length && keywordsText) {
                            const fromText: EditedKeyword[] = keywordsText
                              .split(",")
                              .map((kw) => kw.trim())
                              .filter(Boolean)
                              .map((kw) => ({
                                id: "",
                                value: kw,
                                selected: true,
                              }));
                            setKeywordsForEditing(fromText);
                          }
                          setShowKeywordsModal(true);
                        }}
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

                    <Input
                      id="keywords_text"
                      value={keywordsText}
                      onChange={(e) => setKeywordsText(e.target.value)}
                      placeholder="optimization, deep learning, Adam, SGD…"
                      className="
                        h-10 rounded-xl
                        border border-[hsl(var(--border))]
                        bg-[hsl(var(--accent))]
                        text-sm
                        shadow-sm
                        focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-0
                      "
                    />

                    <div className="flex flex-wrap gap-2">
                      {keywordsText &&
                      keywordsText
                        .split(",")
                        .map((kw) => kw.trim())
                        .filter(Boolean).length ? (
                        keywordsText
                          .split(",")
                          .map((kw) => kw.trim())
                          .filter(Boolean)
                          .map((kw, idx) => (
                            <Badge
                              key={idx}
                              className="
                                rounded-full bg-[hsl(var(--muted))]
                                text-[hsl(var(--foreground))] text-xs font-medium
                                px-3 py-1
                              "
                            >
                              {kw}
                            </Badge>
                          ))
                      ) : (
                        <span className="text-[0.75rem] italic text-[hsl(var(--muted-foreground))]">
                          No keywords detected yet.
                        </span>
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* FOOTER */}
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
                  onClick={handleClose}
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
                  disabled={!pdfUploaded}
                  className="
                    rounded-xl px-6 py-2 text-sm font-semibold
                    bg-[hsl(var(--primary))]
                    text-[hsl(var(--primary-foreground))]
                    shadow-md hover:brightness-110
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  Post article
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* NEW CATEGORY DIALOG (shadcn) */}
      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
              New category
            </DialogTitle>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Define a name and a short description for this category.
            </p>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Name
              </Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Computer Vision"
                className="
                  h-10 rounded-xl
                  border border-[hsl(var(--border))]
                  bg-[hsl(var(--accent))]
                  text-sm
                  shadow-sm
                  focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-0
                "
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Description
              </Label>
              <Textarea
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Papers on image recognition, detection, segmentation…"
                className="
                  min-h-[90px] rounded-xl
                  border border-[hsl(var(--border))]
                  bg-[hsl(var(--accent))]
                  text-sm
                  shadow-sm
                  focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-0
                "
              />
            </div>

            {addCategoryError && (
              <p className="text-sm text-[hsl(var(--destructive))]">
                {addCategoryError}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddCategoryOpen(false)}
              className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleConfirmAddCategory}
              disabled={isCreatingCategory}
              className="
                rounded-xl bg-[hsl(var(--primary))]
                text-[hsl(var(--primary-foreground))]
                px-5
                hover:brightness-110
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {isCreatingCategory ? "Creating…" : "Create category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ABSTRACT MODAL */}
      {showAbstractModal && (
        <AbstractModal
          abstract={formData.content}
          onConfirm={(confirmedAbstract: string) => {
            setFormData((prev) => ({ ...prev, content: confirmedAbstract }));
            setShowAbstractModal(false);
          }}
          onClose={() => {
            setFormData((prev) => ({ ...prev, content: "" }));
            setShowAbstractModal(false);
          }}
        />
      )}

      {/* KEYWORDS MODAL */}
      {showKeywordsModal && (
        <KeywordsModal
          editedKeywords={keywordsForEditing}
          onConfirm={handleKeywordsConfirm}
          setKeywordsChanged={setKeywordsChanged}
          setShowKeywordsModal={setShowKeywordsModal}
        />
      )}

      {/* CATEGORY RESULT MODAL */}
      <Dialog open={categoryResultOpen} onOpenChange={setCategoryResultOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
              Category created
            </DialogTitle>

            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Your new category was successfully added and set as the active one.
            </p>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              onClick={() => setCategoryResultOpen(false)}
              className="rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110 px-6"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SUBMIT RESULT MODAL */}
      <Dialog open={submitResultOpen} onOpenChange={setSubmitResultOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
              {submitStatus === "success" ? "Article posted" : "Upload failed"}
            </DialogTitle>

            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {submitMessage}
            </p>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              onClick={() => {
                setSubmitResultOpen(false);
                if (submitStatus === "success") {
                  handleClose();
                  if (onArticleAdded) onArticleAdded();
                }
              }}
              className="rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110 px-6"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
};

export default AddArticleModal;
