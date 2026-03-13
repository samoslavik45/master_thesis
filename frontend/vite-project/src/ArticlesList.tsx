// Modernized ArticlesList with full original functionality preserved
// Using shadcn/ui components and badges for categories & keywords

import React, { useState, useContext, useEffect } from "react";
import { Article, Category } from "./types";
import axios from "axios";
import fileDownload from "js-file-download";
import Swal from "sweetalert2";
import { LoginContext } from "./App";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";


interface ArticlesListProps {
  articles: Article[];
  groups: Array<{ id: number; name: string }>;
  categories: Category[];
  isLoggedIn: boolean;
}

/* ---------------- PDF handlers ---------------- */

const handlePDFDownload = (pathToFile: string) => {
  const filename = pathToFile.split("/").pop() || "defaultName.pdf";

  axios
    .get(`http://localhost:8000/media/${pathToFile}`, {
      responseType: "blob",
    })
    .then((res) => fileDownload(res.data, filename))
    .catch((err) => console.error(err));
};

const handlePdfMetadataExport = (pathToFile: string) => {
  axios
    .post("http://localhost:8000/api/generate-bibtex/", { filename: pathToFile })
    .then((response) => {
      const text = response.data;
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = pathToFile.split("/").pop()?.replace(/\.[^/.]+$/, "") + ".bib";
      link.click();
    })
    .catch(() => Swal.fire("Error", "Failed to generate BibTeX.", "error"));
};

/* --------------- COMPONENT ---------------- */

const ArticlesList: React.FC<ArticlesListProps> = ({ articles, isLoggedIn, groups }) => {
  const [expanded, setExpanded] = useState<number[]>([]);
  const [similarOpen, setSimilarOpen] = useState<number[]>([]);
  const [similar, setSimilar] = useState<Record<number, any[]>>({});
  const [showFullAbstract, setShowFullAbstract] = useState<number[]>([]);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [publicTags, setPublicTags] = useState<string[]>([]);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [likeDialogOpen, setLikeDialogOpen] = useState(false);
  const [likeGroupDialogOpen, setLikeGroupDialogOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [selectedSimilar, setSelectedSimilar] = useState<any | null>(null);
  const { selectedRecoModel } = useContext(LoginContext);
  


  const toggleAbstract = (id: number) => {
    setShowFullAbstract((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };


  const toggleExpanded = (id: number) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSimilar = (id: number) => {
    setSimilarOpen((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const fetchSimilar = async (articleId: number) => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/articles/${articleId}/similar/?algo=${selectedRecoModel}&k=4`
      );
      const data = await res.json();
      setSimilar((prev) => ({ ...prev, [articleId]: data }));
    } catch (e) {
      console.error(e);
    }
  };

  /* ----------- LIKE HANDLERS ----------- */

  const openLikeDialog = (articleId: number) => {
    setSelectedArticleId(articleId);
    setLikeDialogOpen(true);
  };

  const openLikeGroupDialog = (articleId: number) => {
    setSelectedArticleId(articleId);
    setLikeGroupDialogOpen(true);
  };

const confirmLike = async () => {
  if (!selectedArticleId) return;

  const token = localStorage.getItem("accessToken");

  if (!token) {
    toast.error("Login required to like articles.", {
      position: "top-center",
      style: {
        background: "rgba(255,255,255,0.95)",
        color: "hsl(35 25% 15%)",
        borderRadius: "14px",
        border: "1px solid hsl(35 30% 82%)",
        backdropFilter: "blur(8px)",
      },
    });
    setLikeDialogOpen(false);
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:8000/api/articles/like/${selectedArticleId}/`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.status === 409) {
      toast("You already liked this article.", {
        position: "top-center",
        style: {
          background: "rgba(255,255,255,0.95)",
          color: "hsl(35 25% 15%)",
          borderRadius: "14px",
          border: "1px solid hsl(35 30% 82%)",
          backdropFilter: "blur(8px)",
        },
      });
      setLikeDialogOpen(false);
      return;
    }

    if (!res.ok) throw new Error();

    toast.success("Article liked successfully!", {
      position: "top-center",
      style: {
        background: "rgba(255,255,255,0.95)",
        color: "hsl(140 30% 20%)",
        borderRadius: "14px",
        border: "1px solid hsl(140 40% 80%)",
        backdropFilter: "blur(8px)",
      },
    });
  } catch {
    toast.error("Unable to like this article.", {
      position: "top-center",
      style: {
        background: "rgba(255,255,255,0.95)",
        color: "hsl(0 60% 30%)",
        borderRadius: "14px",
        border: "1px solid hsl(0 60% 80%)",
        backdropFilter: "blur(8px)",
      },
    });
  }

  setLikeDialogOpen(false);
};




const confirmGroupLike = async (groupId: number) => {
  if (!selectedArticleId) return;

  const token = localStorage.getItem("accessToken");

  if (!token) {
    toast.error("Login required to like as group.", {
      position: "top-center",
      style: {
        background: "rgba(255,255,255,0.95)",
        color: "hsl(35 25% 15%)",
        borderRadius: "14px",
        border: "1px solid hsl(35 30% 82%)",
        backdropFilter: "blur(8px)",
      },
    });
    setLikeGroupDialogOpen(false);
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:8000/api/groups/${groupId}/like_article/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ article_id: selectedArticleId }),
      }
    );

    if (res.status === 409) {
      toast("This group already liked this article.", {
        position: "top-center",
        style: {
          background: "rgba(255,255,255,0.95)",
          color: "hsl(35 25% 15%)",
          borderRadius: "14px",
          border: "1px solid hsl(35 30% 82%)",
          backdropFilter: "blur(8px)",
        },
      });
      setLikeGroupDialogOpen(false);
      return;
    }

    if (!res.ok) throw new Error();

    toast.success("Group like added!", {
      position: "top-center",
      style: {
        background: "rgba(255,255,255,0.95)",
        color: "hsl(140 30% 20%)",
        borderRadius: "14px",
        border: "1px solid hsl(140 40% 80%)",
        backdropFilter: "blur(8px)",
      },
    });
  } catch {
    toast.error("Group like failed.", {
      position: "top-center",
      style: {
        background: "rgba(255,255,255,0.95)",
        color: "hsl(0 60% 30%)",
        borderRadius: "14px",
        border: "1px solid hsl(0 60% 80%)",
        backdropFilter: "blur(8px)",
      },
    });
  }

  setLikeGroupDialogOpen(false);
};


useEffect(() => {
  setSimilar({});
  setSimilarOpen([]);
}, [selectedRecoModel]);



const showTags = async (articleId: number) => {
  const token = localStorage.getItem("accessToken");

  try {
    let publicTags: string[] = [];
    let userTags: string[] = [];

    if (token) {
      // PRIHLÁSENÝ – načítame public aj user tags
      const response = await fetch(
        `http://localhost:8000/api/article/${articleId}/tags/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to load tags");

      const data = await response.json();
      publicTags = data.publicTags || [];
      userTags = data.userTags || [];
    } else {
      // NEPRIHLÁSENÝ – načítame LEN public tags
      const response = await fetch(
        `http://localhost:8000/api/article/${articleId}/public_tags/`
      );

      if (!response.ok) throw new Error("Failed to load public tags");

      const data = await response.json();
      publicTags = data.publicTags || [];
      userTags = ["Login required to see personal tags"];
    }

    setPublicTags(publicTags);
    setUserTags(userTags);
    setTagsModalOpen(true);

  } catch (err) {
    setPublicTags(["Error loading tags"]);
    setUserTags(["Error loading tags"]);
    setTagsModalOpen(true);
  }
};

const handleOpenSimilarArticle = (targetId: number) => {
  // rozbaliť cieľový článok
  setExpanded((prev) =>
    prev.includes(targetId) ? prev : [...prev, targetId]
  );

  // scroll na kartu článku (ak sa nachádza v zozname)
  const el = document.getElementById(`article-${targetId}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};



  // ArticlesList.tsx – nový return blok
return (
  <div className="w-full max-w-5xl mx-auto mt-2 px-4 pb-24">

    {/* BACKGROUND WRAPPER OF ARTICLES */}
      {articles.length > 0 && (
        <div
          className="
            rounded-3xl
            p-4 sm:p-4
            space-y-6
            overflow-hidden

            bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),rgba(255,255,255,0.05),transparent)]
            backdrop-blur-md
            shadow-[0_0_40px_rgba(0,0,0,0.08)]
          "
        >
      {articles?.map((article) => {
        const isExpanded = expanded.includes(article.id);
        const similarShown = similarOpen.includes(article.id);
        const isFullAbstract = showFullAbstract.includes(article.id);

        const catList: any[] = (article as any).categories || [];
        const kwList: any[] = (article as any).keywords || [];

        const wrapperBase = `
          relative group rounded-2xl 
          bg-[hsl(var(--card))] 
          border border-[hsl(var(--border))]
          shadow-[0_4px_20px_rgba(0,0,0,0.04)] 
          transition-all duration-300
        `;

        const wrapperHoverClosed = `
          hover:bg-[hsl(35_45%_88%)]
          hover:shadow-[0_10px_30px_rgba(120,95,70,0.12)]
          hover:-translate-y-[2px]
        `;

        const abstractShort =
          article.content.length > 480
            ? `${article.content.substring(0, 480)}...`
            : article.content;

        return (
          <div
            key={article.id}
            id={`article-${article.id}`}
            className={`${wrapperBase} ${isExpanded ? "" : wrapperHoverClosed}`}
          >
            {/* Glow */}
            <div
              className="
                absolute -inset-1 rounded-2xl
                bg-[hsl(var(--primary))/0.08]
                blur-2xl opacity-0 
                group-hover:opacity-100
                transition duration-700 pointer-events-none
              "
            />

            <Card
              className="
                bg-[hsl(var(--card))]
                border border-[hsl(var(--border))]
                shadow-none 
                backdrop-blur-sm
                rounded-xl
              "
            >

              {/* HEADER */}
              <CardHeader
                onClick={() => toggleExpanded(article.id)}
                className="
                  cursor-pointer px-8 py-6 rounded-2xl 
                  hover:bg-[hsl(var(--muted))]
                  transition-colors
                "
              >
                <h1 className="text-[1.55rem] font-semibold text-[hsl(var(--foreground))] tracking-tight">
                  {article.title}
                </h1>

                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {isExpanded ? "Click to collapse" : "Click to expand details"}
                </p>
              </CardHeader>


              {isExpanded && (
                <CardContent className="px-8 pb-4 space-y-5">
                  {/* NEW ULTRA-COMPACT METADATA + ACTION BAR */}
                  <div
                    className="
                      mt-2
                      rounded-xl 
                      p-4 
                      bg-[hsl(var(--muted))] 
                      border border-[hsl(var(--border))]
                      shadow-sm
                      flex flex-col gap-4
                    "
                  >
                    <div className="flex justify-between items-start gap-6">

                    {/* LEFT SIDE — AUTHORS + KEYWORDS */}
                    <div className="flex flex-col gap-6 flex-1">

                      {/* AUTHORS */}
                      <div className="flex items-start gap-2">
                        <span className="text-lg mt-[2px]">👤</span>
                        <div className="flex-1">
                          <p className="font-semibold text-[0.95rem] text-[hsl(var(--foreground))] mb-2">
                            Authors
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {article.authors.map((a) => (
                              <span
                                key={a}
                                className="
                                  px-3 py-[5px] rounded-full text-[0.85rem]
                                  bg-[hsl(var(--card))]
                                  text-[hsl(var(--foreground))]
                                  border border-[hsl(var(--border))]
                                  shadow-sm
                                "
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* KEYWORDS */}
                      <div className="flex items-start gap-2">
                        <span className="text-lg mt-[2px]">🔑</span>
                        <div className="flex-1">
                          <p className="font-semibold text-[0.95rem] text-[hsl(var(--foreground))] mb-2">
                            Keywords
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {kwList.length ? (
                              kwList.map((k, idx) => (
                                <span
                                  key={idx}
                                  className="
                                  px-3 py-[5px] rounded-full text-[0.85rem]
                                  bg-[hsl(var(--card))]
                                  text-[hsl(var(--foreground))]
                                  border border-[hsl(var(--border))]
                                  shadow-sm
                                  "
                                >
                                  {typeof k === "string" ? k : k?.name}
                                </span>
                              ))
                            ) : (
                              <span className="italic text-[0.85rem] text-[hsl(var(--muted-foreground))]">
                                —
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE — CATEGORY + LIKE BUTTONS */}
                    <div className="flex flex-col gap-6 items-start pr-2">

                      {/* CATEGORY */}
                      <div className="flex items-start gap-2">
                        <span className="text-lg mt-[2px]">🏷️</span>
                        <div>
                          <p className="font-semibold text-[0.95rem] text-[hsl(var(--foreground))] mb-2">
                            Category
                          </p>
                          <div className="flex flex-wrap gap-2">
                          <span
                            className="
                              px-3 py-[5px] rounded-full text-[0.85rem]
                              bg-[hsl(var(--card))]
                              text-[hsl(var(--foreground))]
                              border border-[hsl(var(--border))]
                              shadow-sm
                            "
                          >
                            {catList.length
                              ? typeof catList[0] === "object"
                                ? catList[0].name
                                : catList[0]
                              : "—"}
                          </span>
                          </div>
                        </div>
                      </div>

                      {/* LIKE BUTTONS */}
                      {isLoggedIn && (
                        <div className="mt-4 flex items-center gap-3">
                          {/* GROUP LIKE */}
                          <Button
                            variant="outline"
                            onClick={() => openLikeGroupDialog(article.id)}
                            className="
                              inline-flex items-center gap-2
                              h-9 px-4 text-xs font-medium tracking-wide
                              rounded-full
                              border border-[hsl(var(--border))]
                              bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--muted))]
                              text-[hsl(var(--foreground))]
                              shadow-[0_2px_6px_rgba(0,0,0,0.06)]
                              hover:shadow-[0_4px_10px_rgba(0,0,0,0.10)]
                              hover:-translate-y-[1px]
                              active:translate-y-0
                              transition-all duration-200
                            "
                          >
                            <span
                              className="
                                inline-flex h-6 w-6 items-center justify-center
                                rounded-full
                                bg-[hsl(var(--primary))/0.06]
                                text-[0.8rem]
                              "
                            >
                              🤝
                            </span>
                            <span>Like in group</span>
                          </Button>

                          {/* HEART LIKE */}
                          <button
                            onClick={() => openLikeDialog(article.id)}
                            className="
                              group
                              relative inline-flex items-center justify-center
                              h-10 w-10
                              rounded-full
                              bg-gradient-to-br from-rose-100 via-rose-200 to-rose-300
                              shadow-[0_2px_6px_rgba(0,0,0,0.10)]
                              hover:shadow-[0_4px_10px_rgba(0,0,0,0.16)]
                              text-lg
                              hover:scale-105 active:scale-95
                              transition-transform duration-150
                              focus-visible:outline-none
                              focus-visible:ring-2
                              focus-visible:ring-rose-400
                              focus-visible:ring-offset-2
                              focus-visible:ring-offset-[hsl(var(--background))]
                            "
                          >
                            <span
                              className="
                                absolute inset-0 rounded-full
                                bg-white/25
                                opacity-0
                                group-hover:opacity-100
                                transition-opacity duration-200
                              "
                            />
                            <span className="relative drop-shadow-sm">❤️</span>
                          </button>
                        </div>
                      )}



                    </div>
                    
                    </div>
                  </div>
                  <Separator />

                  {/* ABSTRACT */}
                  <div
                    className="
                      mt-2                /* blízko pri prvej časti */
                      p-4                 /* bolo p-6 – menší padding */
                      rounded-xl 
                      shadow-inner
                      bg-[hsl(var(--muted))]
                      border border-[hsl(var(--border))]
                      backdrop-blur-xl
                    "
                  >
                    <h4 className="font-bold text-[hsl(var(--foreground))] mb-2">
                      Abstract
                    </h4>
                    <p className="text-[hsl(var(--foreground))] leading-relaxed text-[0.9rem]">
                      {isFullAbstract ? article.content : abstractShort}
                    </p>

                    {article.content.length > 480 && (
                      <button
                        onClick={() => toggleAbstract(article.id)}
                        className="
                          mt-2              /* bolo mt-3 – bližšie k textu */
                          text-sm font-medium 
                          text-[hsl(var(--primary))]
                          hover:underline
                        "
                      >
                        {isFullAbstract ? "Show less" : "Show full abstract"}
                      </button>
                    )}
                  </div>


                  {/* BUTTONS */}
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    {/* LEFT BUTTONS */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() =>
                          window.open(`http://localhost:8000/media/${article.pdf_file}`, "_blank")
                        }
                        className="
                          inline-flex items-center gap-2
                          h-10 px-5 text-sm font-medium
                          rounded-full
                          bg-[hsl(var(--primary))]
                          text-[hsl(var(--primary-foreground))]
                          shadow-[0_2px_6px_rgba(0,0,0,0.10)]
                          hover:shadow-[0_4px_12px_rgba(0,0,0,0.18)]
                          hover:-translate-y-[1px]
                          active:translate-y-0
                          antialiased
                          transform-gpu
                          transition-transform duration-200
                        "
                      >
                        <span
                          className="
                            inline-flex h-6 w-6 items-center justify-center
                            rounded-full
                            bg-[hsl(var(--primary-foreground))/0.16]
                            text-[0.75rem]
                          "
                        >
                          📄
                        </span>
                        <span>Open PDF</span>
                      </Button>

                      <Button
                        onClick={() => handlePDFDownload(article.pdf_file)}
                        className="
                          inline-flex items-center gap-2
                          h-10 px-5 text-sm font-medium
                          rounded-full
                          bg-[hsl(var(--primary))]
                          text-[hsl(var(--primary-foreground))]
                          shadow-[0_2px_6px_rgba(0,0,0,0.10)]
                          hover:shadow-[0_4px_12px_rgba(0,0,0,0.18)]
                          hover:-translate-y-[1px]
                          active:translate-y-0
                          antialiased
                          transform-gpu
                          transition-transform duration-200
                        "
                      >
                        <span
                          className="
                            inline-flex h-6 w-6 items-center justify-center
                            rounded-full
                            bg-[hsl(var(--primary-foreground))/0.16]
                            text-[0.75rem]
                          "
                        >
                          ⬇️
                        </span>
                        <span>Download PDF</span>
                      </Button>
                    </div>

                    {/* RIGHT BUTTONS */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => handlePdfMetadataExport(article.pdf_file)}
                        className="
                          inline-flex items-center gap-2
                          h-10 px-5 text-sm font-medium
                          rounded-full
                          bg-[hsl(var(--primary))]
                          text-[hsl(var(--primary-foreground))]
                          shadow-[0_2px_6px_rgba(0,0,0,0.10)]
                          hover:shadow-[0_4px_12px_rgba(0,0,0,0.18)]
                          hover:-translate-y-[1px]
                          active:translate-y-0
                          antialiased
                          transform-gpu
                          transition-transform duration-200
                        "
                      >
                        <span
                          className="
                            inline-flex h-6 w-6 items-center justify-center
                            rounded-full
                            bg-[hsl(var(--primary-foreground))/0.16]
                            text-[0.75rem]
                          "
                        >
                          📤
                        </span>
                        <span>Export BibTeX</span>
                      </Button>

                      <Button
                        onClick={() => showTags(article.id)}
                        className="
                          inline-flex items-center gap-2
                          h-10 px-5 text-sm font-medium
                          rounded-full
                          bg-[hsl(var(--primary))]
                          text-[hsl(var(--primary-foreground))]
                          shadow-[0_2px_6px_rgba(0,0,0,0.10)]
                          hover:shadow-[0_4px_12px_rgba(0,0,0,0.18)]
                          hover:-translate-y-[1px]
                          active:translate-y-0
                          antialiased
                          transform-gpu
                          transition-transform duration-200
                        "
                      >
                        <span
                          className="
                            inline-flex h-6 w-6 items-center justify-center
                            rounded-full
                            bg-[hsl(var(--primary-foreground))/0.16]
                            text-[0.75rem]
                          "
                        >
                          🏷️
                        </span>
                        <span>Show Tags</span>
                      </Button>
                    </div>
                  </div>



                  
                  <div className="">
                    <Button
                      variant="outline"
                      onClick={() => {
                        toggleSimilar(article.id);
                        fetchSimilar(article.id);
                      }}
                      className="
                        inline-flex items-center gap-2
                        h-9 px-4 text-xs md:text-sm font-medium
                        rounded-full
                        border border-[hsl(var(--border))]
                        bg-[hsl(var(--accent))]
                        text-[hsl(var(--foreground))]
                        shadow-[0_2px_6px_rgba(0,0,0,0.06)]
                        hover:bg-[hsl(var(--muted))]
                        hover:shadow-[0_4px_10px_rgba(0,0,0,0.10)]
                        hover:-translate-y-[1px]
                        active:translate-y-0
                        antialiased
                        transform-gpu
                        transition-transform transition-shadow transition-colors duration-200
                      "
                    >
                      <span
                        className="
                          inline-flex h-6 w-6 items-center justify-center
                          rounded-full
                          bg-[hsl(var(--primary))/0.06]
                          text-[0.75rem]
                        "
                      >
                        🔍
                      </span>
                      <span className="whitespace-nowrap">
                        {similarShown ? "Hide Similar Articles" : "Show Similar Articles"}
                      </span>
                    </Button>

                  </div>


                  {/* SIMILAR LIST */}
                  {similarShown && similar[article.id] && (
                    <div
                      className="
                        p-6 rounded-xl 
                        bg-[hsl(var(--accent))]
                        border border-[hsl(var(--border))]
                        shadow-inner 
                        backdrop-blur-xl
                        mt-4
                      "
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-[hsl(var(--foreground))] text-lg">
                            Similar Articles
                          </h3>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                            Current model: {selectedRecoModel === "sbert-v1" ? "SBERT" : "TF-IDF"}
                          </p>
                        </div>

                        <span
                          className={`
                            inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold
                            ${
                              selectedRecoModel === "sbert-v1"
                                ? "bg-[hsl(var(--primary))/0.14] text-[hsl(var(--primary))] border border-[hsl(var(--primary))/0.25]"
                                : "bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]"
                            }
                          `}
                        >
                          {selectedRecoModel === "sbert-v1" ? "SBERT active" : "TF-IDF active"}
                        </span>
                      </div>

                      <ScrollArea className="h-56 pr-2">
                        <div className="space-y-4">
                          {similar[article.id].map((sim) => (
                            <div
                              key={sim.id}
                              className="
                                group
                                p-4 rounded-xl
                                bg-[hsl(var(--muted))]
                                border border-[hsl(var(--border))]
                                shadow-sm
                                hover:bg-[hsl(var(--card))]
                                hover:shadow-md 
                                hover:-translate-y-[1px]
                                transition-all duration-200
                                cursor-pointer
                              "
                              onClick={() => handleOpenSimilarArticle(sim.id)}
                            >
                              {/* TITLE */}
                              <h4
                                className="
                                  font-semibold text-[hsl(var(--foreground))] 
                                  text-sm mb-1 leading-tight
                                  group-hover:underline
                                "
                              >
                                {sim.title}
                              </h4>

                              {/* AUTHORS */}
                              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                                {sim.authors.join(", ")}
                              </p>

                              <div className="flex flex-wrap items-center gap-2">
                                {/* VIEW DETAILS */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation(); // nespúšťaj click na card
                                    handleOpenSimilarArticle(sim.id);
                                  }}
                                  className="
                                    inline-flex items-center gap-2
                                    h-8 px-3 text-[0.75rem] font-medium
                                    rounded-full
                                    border border-[hsl(var(--border))]
                                    bg-[hsl(var(--card))]
                                    text-[hsl(var(--foreground))]
                                    shadow-[0_1px_4px_rgba(0,0,0,0.06)]
                                    hover:bg-[hsl(var(--muted))]
                                    hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)]
                                    hover:-translate-y-[1px]
                                    transition-all duration-200
                                  "
                                >
                                  <span
                                    className="
                                      inline-flex h-5 w-5 items-center justify-center
                                      rounded-full
                                      bg-[hsl(var(--primary))/0.06]
                                      text-[0.7rem]
                                    "
                                  >
                                    👁️
                                  </span>
                                  <span>View details</span>
                                </Button>

                                {/* OPEN PDF */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation(); // aby sa neotváral detail pri kliku na PDF
                                    window.open(`http://localhost:8000/media/${sim.pdf_file}`, "_blank");
                                  }}
                                  className="
                                    inline-flex items-center gap-2
                                    h-8 px-3 text-[0.75rem] font-medium
                                    rounded-full
                                    bg-[hsl(var(--accent))]
                                    text-[hsl(var(--foreground))]
                                    border border-[hsl(var(--border))]
                                    shadow-sm
                                    hover:bg-[hsl(var(--muted))]
                                    hover:shadow-md
                                    hover:-translate-y-[1px]
                                    transition-all duration-200
                                  "
                                >
                                  <span
                                    className="
                                      inline-flex h-5 w-5 items-center justify-center
                                      rounded-full
                                      bg-[hsl(var(--primary))/0.06]
                                      text-[0.7rem]
                                    "
                                  >
                                    📄
                                  </span>
                                  <span>Open PDF</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}



                </CardContent>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  )}

   {/* TAGS MODAL */}
    <Dialog open={tagsModalOpen} onOpenChange={setTagsModalOpen}>
      <DialogContent
        className="
          max-w-md 
          rounded-3xl 
          bg-white/90 
          backdrop-blur-xl 
          p-8 
          shadow-2xl
          border border-[hsl(var(--border))]
        "
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-3xl font-semibold text-[hsl(var(--foreground))] tracking-tight">
            Article Tags
          </DialogTitle>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Public & personal tags attached to this article
          </p>
        </DialogHeader>

        {/* PUBLIC TAGS */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] text-center">
            Public Tags
          </h3>

          <div className="mt-3 text-center">
            {publicTags.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-3">
                {publicTags.map((tag, i) => (
                  <span
                    key={i}
                    className="
                      px-4 py-1.5 
                      bg-[hsl(var(--accent))] 
                      text-[hsl(var(--foreground))] 
                      rounded-full 
                      text-sm 
                      border border-[hsl(var(--border))]
                      shadow-sm
                    "
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <i className="text-[hsl(var(--muted-foreground))]">
                No public tags available
              </i>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        {/* USER TAGS */}
        <div>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] text-center">
            Your Tags
          </h3>

          <div className="mt-3 text-center">
            {userTags.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-3">
                {userTags.map((tag, i) => (
                  <span
                    key={i}
                    className="
                      px-4 py-1.5 
                      bg-[hsl(var(--primary))/0.15] 
                      text-[hsl(var(--primary))] 
                      rounded-full 
                      text-sm 
                      border border-[hsl(var(--primary))/0.4]
                      shadow-sm
                    "
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <i className="text-[hsl(var(--muted-foreground))]">
                You have not added any tags
              </i>
            )}
          </div>
        </div>

        <DialogFooter className="mt-8 flex justify-center">
          <Button
            onClick={() => setTagsModalOpen(false)}
            className="
              rounded-lg px-8 py-2 
              bg-[hsl(var(--primary))] 
              text-[hsl(var(--primary-foreground))] 
              hover:brightness-110 
              shadow-md
            "
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* LIKE MODAL */}
    <Dialog open={likeDialogOpen} onOpenChange={setLikeDialogOpen}>
      <DialogContent className="rounded-3xl p-8 max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center text-[hsl(var(--foreground))]">
            Like this article?
          </DialogTitle>
        </DialogHeader>

        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-2">
          Do you want to like this article?
        </p>

        <DialogFooter className="mt-6">
          <div className="flex w-full justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLikeDialogOpen(false)}
              className="
                px-6 rounded-xl
                border-[hsl(var(--border))]
                bg-[hsl(var(--muted))]
                text-[hsl(var(--foreground))]
                hover:bg-[hsl(var(--muted))]
                hover:brightness-95
                shadow-sm
              "
            >
              Cancel
            </Button>
            <Button
              onClick={confirmLike}
              className="
                px-6 rounded-xl
                bg-[hsl(var(--primary))]
                text-[hsl(var(--primary-foreground))]
                shadow-md
                hover:brightness-110
              "
            >
              ❤️ Like
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* GROUP LIKE MODAL */}
    <Dialog open={likeGroupDialogOpen} onOpenChange={setLikeGroupDialogOpen}>
      <DialogContent
        className="
          rounded-3xl 
          p-8 
          max-w-md 
          bg-[hsl(var(--card))] 
          border 
          border-[hsl(var(--border))]
        "
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center text-[hsl(var(--foreground))]">
            Like as Group
          </DialogTitle>
        </DialogHeader>

        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-2 mb-6">
          Select a group that should like this article.
        </p>

        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <Button
              key={group.id}
              variant="outline"
              onClick={() => confirmGroupLike(group.id)}
              className="
                w-full 
                justify-between
                rounded-xl 
                py-3 
                text-[0.9rem]
                border-[hsl(var(--border))]
                bg-[hsl(var(--accent))]
                text-[hsl(var(--foreground))]
                hover:bg-[hsl(var(--muted))]
              "
            >
              {group.name}
            </Button>
          ))}
        </div>

        <DialogFooter className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => setLikeGroupDialogOpen(false)}
            className="
              px-6 rounded-xl
              border-[hsl(var(--border))]
              bg-[hsl(var(--muted))]
              text-[hsl(var(--foreground))]
              hover:bg-[hsl(var(--muted))]
              hover:brightness-95
              shadow-sm
            "
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>




  </div>
);
};

export default ArticlesList;
