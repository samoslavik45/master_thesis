import React, { useState, useEffect } from "react";
import { Article, Category, RecommendedArticle} from "./types";
import AddArticleModal from "./AddArticleModal";
import EditArticleModal from "./EditArticleModal";
import { LoginContext } from "./App";
import { useContext } from "react";
import RecommendedList from "./RecommendedList";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";



interface Profile {
    first_name: string;
    last_name: string;
    email: string;
    
}

interface Keyword {
  id: number;
  keyword: string;
}

const Profile = () => {
    const [user, setUser] = useState<Profile | null>(null); 
    const [userArticles, setUserArticles] = useState<Article[]>([]); 
    const [likedArticles, setLikedArticles] = useState<Article[]>([]);
    const [showAddArticleModal, setShowAddArticleModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [currentArticleToEdit, setCurrentArticleToEdit] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const { isLoggedIn, setIsLoggedIn, openLogin } = useContext(LoginContext);
    const [tagsModalOpen, setTagsModalOpen] = useState(false);
    const [publicTags, setPublicTags] = useState<string[]>([]);
    const [userTags, setUserTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const [addTagDialogOpen, setAddTagDialogOpen] = useState(false);
    const [tagArticleId, setTagArticleId] = useState<number | null>(null);
    const [tagName, setTagName] = useState("");
    const [tagIsPublic, setTagIsPublic] = useState(false);
    const [tagSubmitting, setTagSubmitting] = useState(false);
    const [tagError, setTagError] = useState<string | null>(null);

    const [tagResultOpen, setTagResultOpen] = useState(false);
    const [tagResultStatus, setTagResultStatus] = useState<"success" | "error">("success");
    const [tagResultMessage, setTagResultMessage] = useState("");

    const [unlikeConfirmOpen, setUnlikeConfirmOpen] = useState(false);
    const [unlikeTargetId, setUnlikeTargetId] = useState<number | null>(null);
    const [unlikeSubmitting, setUnlikeSubmitting] = useState(false);

    const [unlikeResultOpen, setUnlikeResultOpen] = useState(false);
    const [unlikeResultStatus, setUnlikeResultStatus] = useState<"success" | "error">("success");
    const [unlikeResultMessage, setUnlikeResultMessage] = useState("");

    const [recommendedArticles, setRecommendedArticles] = useState<RecommendedArticle[]>([]);
    const [recoLoading, setRecoLoading] = useState(false);

    const [keywords, setKeywords] = useState<Keyword[]>([]);

    //testovací debug
    const [debugOpen, setDebugOpen] = useState(false);
    const [debugLoading, setDebugLoading] = useState(false);
    const [debugData, setDebugData] = useState<any | null>(null);

    // debug funkcia
    const fetchRecommendationDebug = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setDebugData(null);
        return;
      }

      try {
        setDebugLoading(true);

        const res = await fetch(
          "http://localhost:8000/api/recommendations/debug/?algo=tfidf-v1&limit=5",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          console.error("Failed to fetch recommendation debug:", res.status);
          setDebugData(null);
          return;
        }

        const data = await res.json();
        setDebugData(data);
      } catch (err) {
        console.error("Error loading recommendation debug:", err);
        setDebugData(null);
      } finally {
        setDebugLoading(false);
      }
    };
    const loadAll = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      try {
        const [userRes, articlesRes, likedRes, catRes, keywordRes] =
          await Promise.all([
            fetch("http://localhost:8000/main/current_user/", { headers }),
            fetch("http://localhost:8000/api/user-articles/", { headers }),
            fetch("http://localhost:8000/api/liked-articles/", { headers }),
            fetch("http://localhost:8000/api/categories/", { headers }),
            fetch("http://localhost:8000/api/keywords/", { headers }),
          ]);

        const [
          userData,
          articlesData,
          likedData,
          categoriesData,
          keywordsData,
        ] = await Promise.all([
          userRes.json(),
          articlesRes.json(),
          likedRes.json(),
          catRes.json(),
          keywordRes.json(),
        ]);

        setUser(userData);
        setUserArticles(articlesData);
        setLikedArticles(likedData);
        setCategories(categoriesData);
        setKeywords(keywordsData);
      } catch (err) {
        console.error("Error while loading profile:", err);
        setIsLoggedIn(false);
      }
    };


    useEffect(() => {
      const token = localStorage.getItem("accessToken");

      // helper na validáciu tokenu
      const isTokenValid = () => {
        if (!token) return false;
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          return payload.exp * 1000 > Date.now();
        } catch {
          return false;
        }
      };

      if (!isTokenValid()) {
        setIsLoggedIn(false);
        setLoading(false);    // ✅ máme overené, že nie je prihlásený
        return;
      }

      // token je OK → používateľ je prihlásený
      setIsLoggedIn(true);

      // načítaj všetko a až potom vypni loading
      Promise.all([loadAll(), fetchRecommendations(), fetchRecommendationDebug()])        .catch((err) => {
          console.error("Error while loading profile:", err);
          setIsLoggedIn(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }, [setIsLoggedIn]);

    
    const handleDeleteArticle = async (articleId: number) => {
      try {
        const response = await fetch(`http://localhost:8000/api/articles/delete/${articleId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
    
        if (!response.ok) {
          throw new Error('Failed to delete the article');
        }
    
        setUserArticles(prevArticles => prevArticles.filter(article => article.id !== articleId));
        setShowEditModal(false);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
  const openUnlikeConfirm = (articleId: number) => {
    setUnlikeTargetId(articleId);
    setUnlikeConfirmOpen(true);
    setUnlikeResultMessage("");
  };

  const handleConfirmUnlike = async () => {
    if (!unlikeTargetId) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUnlikeConfirmOpen(false);
      setUnlikeResultStatus("error");
      setUnlikeResultMessage("You must be logged in to unlike an article.");
      setUnlikeResultOpen(true);
      return;
    }

    setUnlikeSubmitting(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/articles/unlike/${unlikeTargetId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unlike the article.");
      }

      setLikedArticles((prevArticles) =>
        prevArticles.filter((article) => article.id !== unlikeTargetId)
      );

      setUnlikeResultStatus("success");
      setUnlikeResultMessage("Article has been removed from favourites.");
    } catch (error) {
      console.error("Error:", error);
      setUnlikeResultStatus("error");
      setUnlikeResultMessage("Failed to unlike the article. Please try again.");
    } finally {
      setUnlikeSubmitting(false);
      setUnlikeConfirmOpen(false);
      setUnlikeResultOpen(true);
    }
  };

    const fetchUserArticles = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
          try {
              const response = await fetch('http://localhost:8000/api/user-articles/',
               {
                  headers: {
                      'Authorization': `Bearer ${token}`,
                  },
              });
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              const articles = await response.json();
              console.log('Loaded articles:', articles);
              setUserArticles(articles);
          } catch (error) {
              console.error('Error fetching user articles:', error);
          }
      }
  };
    
    const handleAddArticleClick = () => {
      console.log("Opening modal...");
      setShowAddArticleModal(true);
    };

    const handleCloseModal = () => {
        setShowAddArticleModal(false);
    };

    const handleArticleUpdated = () => {
      fetchUserArticles();
    };

    const handleOpenAddTagModal = (articleId: number) => {
      setTagArticleId(articleId);
      setTagName("");
      setTagIsPublic(false);
      setTagError(null);
      setAddTagDialogOpen(true);
    };


    const showTags = async (articleId: number) => {
      const token = localStorage.getItem('accessToken');
      try {
        const response = await fetch(`http://localhost:8000/api/article/${articleId}/tags/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch tags");

        const { publicTags, userTags } = await response.json();
        setPublicTags(publicTags || []);
        setUserTags(userTags || []);
        setTagsModalOpen(true);

      } catch (err) {
        setPublicTags(["Error loading tags"]);
        setUserTags(["Error loading tags"]);
        setTagsModalOpen(true);
      }
    };

    const handleConfirmAddTag = async (): Promise<void> => {
      if (!tagArticleId) return;

      if (!tagName.trim()) {
        setTagError("Tag name is required.");
        return;
      }

    try {
      setTagSubmitting(true);
      setTagError(null);

      const token = localStorage.getItem("accessToken");
      const response = await fetch("http://localhost:8000/api/add-tag/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          article_id: tagArticleId,
          tag_name: tagName.trim(),
          is_public: tagIsPublic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add tag to article");
      }

      const data = await response.json();
      console.log(data.message);

      // zavrieme input dialog a ukážeme result dialog
      setAddTagDialogOpen(false);
      setTagResultStatus("success");
      setTagResultMessage("The tag has been successfully added.");
      setTagResultOpen(true);
    } catch (error) {
      console.error("Error:", error);
      setTagResultStatus("error");
      setTagResultMessage("Failed to add tag to the article. Please try again.");
      setTagResultOpen(true);
    } finally {
      setTagSubmitting(false);
    }
  };


  const handleEditClick = (article: Article) => {
    setCurrentArticleToEdit(article.id);
    setShowEditModal(true);
  };

  const fetchRecommendations = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setRecommendedArticles([]);
      return;
    }

    try {
      setRecoLoading(true);

      const res = await fetch("http://localhost:8000/api/recommendations/?limit=5", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch recommendations:", res.status);
        setRecommendedArticles([]);
        return;
      }

      const data = await res.json();
      setRecommendedArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading recommendations:", err);
      setRecommendedArticles([]);
    } finally {
      setRecoLoading(false);
    }
  };

  const handleOpenRecommendation = (article: RecommendedArticle) => {
    window.open(`${article.pdf_file}`, "_blank");
  };

  const handleRecommendationLike = async (articleId: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await fetch(
        `http://localhost:8000/api/recommendations/${articleId}/feedback/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "like" }),
        }
      );

      if (!res.ok) {
        console.error("Failed to like recommendation:", res.status);
        return;
      }

      await fetchRecommendations();
      await fetchRecommendationDebug(); // debug
      await loadAll(); // refresh favourites count + liked list
    } catch (err) {
      console.error("Error liking recommendation:", err);
    }
  };

  const handleRecommendationDismiss = async (articleId: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await fetch(
        `http://localhost:8000/api/recommendations/${articleId}/feedback/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "dismiss" }),
        }
      );

      if (!res.ok) {
        console.error("Failed to dismiss recommendation:", res.status);
        return;
      }

      await fetchRecommendations();
      await fetchRecommendationDebug(); // debug
    } catch (err) {
      console.error("Error dismissing recommendation:", err);
    }
  };

  
if (loading) {
  return (
    <div className="flex flex-col items-center justify-center mt-20">
        {/* prázdna stránka / loader */}
    </div>
  );
}

return (
  <>
    {!isLoggedIn || !user ? (
      <div className="flex flex-col items-center justify-center mt-20">
        <Card className="w-full max-w-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold text-[hsl(var(--foreground))]">
              Profile
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-4">
            <p className="text-[hsl(var(--muted-foreground))]">No profile data available.</p>

            <Button
              onClick={openLogin}
              className="
                bg-[hsl(var(--primary))]
                text-[hsl(var(--primary-foreground))]
                rounded-xl px-6
                hover:scale-[1.03]
                transition
              "
            >
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    ) : (
      <div className="max-w-5xl mx-auto mt-12 px-4 pb-16">
        {/* PROFILE CARD */}
        <Card
          className="
            relative mb-10 overflow-hidden rounded-3xl
            border border-[hsl(var(--border))]
            bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--muted))]
            shadow-lg
          "
        >
          <CardHeader className="flex flex-row items-center gap-6 p-6">
            <div className="relative">
              <div
                className="
                  absolute inset-0
                  rounded-2xl
                  bg-[hsl(var(--primary))/0.35]
                  blur-sm
                  opacity-80
                "
                aria-hidden="true"
              />
              <div
                className="
                  relative flex h-14 w-14 items-center justify-center
                  rounded-2xl
                  border border-[hsl(var(--primary))/0.5]
                  bg-[hsl(var(--background))]
                  text-xl font-semibold tracking-tight
                  text-[hsl(var(--primary))]
                  shadow-md
                "
              >
                {user.first_name?.[0]}
                {user.last_name?.[0]}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
                {user.first_name} {user.last_name}
              </CardTitle>

              <p className="mt-1 truncate text-sm text-[hsl(var(--muted-foreground))]">
                {user.email}
              </p>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-3">
              <div className="relative">
                <div
                  className="
                    absolute inset-0
                    rounded-2xl
                    bg-[hsl(var(--primary))/0.25]
                    blur-sm
                    opacity-80
                  "
                  aria-hidden="true"
                />
                <div
                  className="
                    relative
                    rounded-2xl
                    border border-[hsl(var(--primary))/0.5]
                    bg-[hsl(var(--background))]
                    px-4 py-2.5
                    text-right
                    shadow-md
                  "
                >
                  <p className="text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                    My articles
                  </p>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    {userArticles.length}
                  </p>
                </div>
              </div>

              <div className="relative">
                <div
                  className="
                    absolute inset-0
                    rounded-2xl
                    bg-[hsl(var(--primary))/0.25]
                    blur-sm
                    opacity-80
                  "
                  aria-hidden="true"
                />
                <div
                  className="
                    relative
                    rounded-2xl
                    border border-[hsl(var(--primary))/0.5]
                    bg-[hsl(var(--background))]
                    px-4 py-2.5
                    text-right
                    shadow-md
                  "
                >
                  <p className="text-[10px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                    Favourites
                  </p>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    {likedArticles.length}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* MAIN TABS */}
        <Tabs defaultValue="myarticles" className="w-full">
          <TabsList
            className="
              grid grid-cols-3 w-full
              bg-[hsl(var(--muted))]
              border border-[hsl(var(--border))]
              rounded-xl mb-6
            "
          >
            <TabsTrigger value="myarticles" className="rounded-xl">
              My Articles
            </TabsTrigger>

            <TabsTrigger value="liked" className="rounded-xl">
              Favourite Articles
            </TabsTrigger>

            <TabsTrigger value="recommended" className="rounded-xl">
              Recommended For You
            </TabsTrigger>
          </TabsList>

          {/* MY ARTICLES */}
          <TabsContent value="myarticles">
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => setShowAddArticleModal(true)}
                className="
                  bg-[hsl(var(--primary))]
                  text-[hsl(var(--primary-foreground))]
                  rounded-xl px-6 shadow
                  hover:scale-[1.03] transition
                "
              >
                Add Article
              </Button>
            </div>

            <ScrollArea className="h-[480px] pr-3">
              <div className="space-y-4">
                {userArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="
                      bg-[hsl(var(--muted))]
                      border border-[hsl(var(--border))]
                      shadow-sm rounded-xl p-4
                      hover:bg-[hsl(var(--card))]
                      transition
                    "
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[hsl(var(--foreground))] text-lg">
                          {article.title}
                        </h3>

                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                          Authors: {article.authors.join(", ")}
                        </p>

                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                          Added: {new Date(article.created_at).toLocaleDateString("cs-CZ")}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentArticleToEdit(article.id);
                          setShowEditModal(true);
                        }}
                        className="
                          rounded-xl px-4
                          bg-[hsl(var(--accent))]
                          border border-[hsl(var(--border))]
                          text-[hsl(var(--foreground))]
                          hover:bg-[hsl(var(--muted))]
                          transition
                        "
                      >
                        Edit
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* LIKED ARTICLES */}
          <TabsContent value="liked">
            <ScrollArea className="h-[480px] pr-3">
              <div className="space-y-4">
                {likedArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="
                      bg-[hsl(var(--muted))]
                      border border-[hsl(var(--border))]
                      rounded-xl p-4 shadow-sm
                      hover:bg-[hsl(var(--card))]
                      transition
                    "
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[hsl(var(--foreground))] text-lg">
                          {article.title}
                        </h3>

                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                          Authors: {article.authors.join(", ")}
                        </p>

                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                          Liked: {new Date(article.created_at).toLocaleDateString("cs-CZ")}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => showTags(article.id)}
                          size="sm"
                          variant="outline"
                          className="
                            rounded-xl px-3 py-1.5 text-xs font-medium
                            border border-[hsl(var(--primary))/60]
                            bg-[hsl(var(--accent))]
                            text-[hsl(var(--primary))]
                            hover:bg-[hsl(var(--primary))/10]
                            shadow-sm
                            transition-colors
                          "
                        >
                          Show tags
                        </Button>

                        <Button
                          onClick={() => handleOpenAddTagModal(article.id)}
                          size="sm"
                          className="
                            rounded-xl px-3 py-1.5 text-xs font-medium
                            bg-[hsl(var(--primary))]
                            text-[hsl(var(--primary-foreground))]
                            hover:brightness-110
                            shadow-sm
                            transition-colors
                          "
                        >
                          Add tag
                        </Button>

                        <Button
                          onClick={() => openUnlikeConfirm(article.id)}
                          size="sm"
                          variant="outline"
                          className="
                            rounded-xl px-3 py-1.5 text-xs font-medium
                            border-[hsl(var(--destructive))]/70
                            bg-[hsl(var(--destructive))]/10
                            text-[hsl(var(--destructive))]
                            hover:bg-[hsl(var(--destructive))]/20
                            transition-colors
                          "
                        >
                          Unlike
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* RECOMMENDED ARTICLES */}
          <TabsContent value="recommended">
          <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3">
            <div>
              <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
                Recommended for you
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Personalized suggestions based on your likes, group activity and interactions
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="
                  hidden sm:inline-flex items-center rounded-full
                  border border-[hsl(var(--primary))/0.25]
                  bg-[hsl(var(--primary))/0.08]
                  px-3 py-1 text-xs font-medium
                  text-[hsl(var(--primary))]
                  w-fit
                "
              >
                Personalized feed
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebugOpen((prev) => !prev)}
                className="rounded-xl"
              >
                {debugOpen ? "Hide debug" : "Show debug"}
              </Button>
            </div>
          </div>

            <ScrollArea className="h-[480px] pr-3">
              {recoLoading ? (
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-6 text-sm text-[hsl(var(--muted-foreground))]">
                  Loading recommendations...
                </div>
              ) : recommendedArticles.length > 0 ? (
                <RecommendedList
                  articles={recommendedArticles}
                  categories={categories}
                  keywords={keywords}
                  isLoggedIn={isLoggedIn}
                  onOpen={handleOpenRecommendation}
                  onLike={handleRecommendationLike}
                  onDismiss={handleRecommendationDismiss}
                />
              ) : (
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-6 text-sm text-[hsl(var(--muted-foreground))]">
                  No recommendations available yet. Try liking more articles to build your profile.
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
        

        {/* testovací debug panel */}

        {debugOpen && (
          <div className="mb-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Recommendation debug
              </h4>

              <Button
                size="sm"
                variant="outline"
                onClick={fetchRecommendationDebug}
                className="rounded-xl"
              >
                Refresh debug
              </Button>
            </div>

            {debugLoading ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Loading debug info...
              </p>
            ) : debugData ? (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))] mb-1">
                    Seed articles
                  </p>
                  <div className="space-y-1 text-[hsl(var(--muted-foreground))]">
                    <p>User likes: {debugData.seed?.user_liked_ids?.join(", ") || "none"}</p>
                    <p>Group likes: {debugData.seed?.group_liked_ids?.join(", ") || "none"}</p>
                    <p>Positive feedback: {debugData.seed?.positive_feedback_ids?.join(", ") || "none"}</p>
                    <p>Dismiss feedback: {debugData.seed?.dismiss_feedback_ids?.join(", ") || "none"}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="font-medium text-[hsl(var(--foreground))] mb-1">
                    Profile summary
                  </p>
                  <div className="space-y-1 text-[hsl(var(--muted-foreground))]">
                    <p>Exists: {String(debugData.profile_summary?.exists)}</p>
                    <p>Vector length: {debugData.profile_summary?.vector_length ?? "-"}</p>
                    <p>Nonzero dimensions: {debugData.profile_summary?.nonzero_dimensions ?? "-"}</p>
                    <p>Norm: {debugData.profile_summary?.norm ?? "-"}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="font-medium text-[hsl(var(--foreground))] mb-2">
                    Weights used
                  </p>

                  <div className="max-h-36 overflow-y-auto rounded-xl bg-[hsl(var(--muted))] p-3">
                    {debugData.weights_used?.length ? (
                      <div className="space-y-1 text-[hsl(var(--muted-foreground))]">
                        {debugData.weights_used.map((item: any, index: number) => (
                          <p key={index}>
                            article {item.article_id} | source: {item.source} | weight: {item.weight}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[hsl(var(--muted-foreground))]">No weights used.</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="font-medium text-[hsl(var(--foreground))] mb-2">
                    Top recommendations
                  </p>

                  <div className="max-h-36 overflow-y-auto rounded-xl bg-[hsl(var(--muted))] p-3">
                    {debugData.recommendations?.length ? (
                      <div className="space-y-1 text-[hsl(var(--muted-foreground))]">
                        {debugData.recommendations.map((item: any, index: number) => (
                          <p key={index}>
                            article {item.id} | score: {typeof item.score === "number" ? item.score.toFixed(4) : item.score}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[hsl(var(--muted-foreground))]">No recommendations.</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="font-medium text-[hsl(var(--foreground))] mb-2">
                    First 20 vector values
                  </p>

                  <div className="max-h-36 overflow-y-auto rounded-xl bg-[hsl(var(--muted))] p-3 text-[hsl(var(--muted-foreground))] break-all">
                    {debugData.profile_summary?.first_20_values?.length
                      ? debugData.profile_summary.first_20_values.join(", ")
                      : "No vector preview available"}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                No debug data available.
              </p>
            )}
          </div>
        )}

        {/* MODALS */}
        {showEditModal && currentArticleToEdit && (
          <EditArticleModal
            show={showEditModal}
            article={userArticles.find((a) => a.id === currentArticleToEdit)!}
            categories={categories}
            onClose={() => setShowEditModal(false)}
            onDelete={handleDeleteArticle}
            onArticleUpdated={() => fetchUserArticles()}
          />
        )}

        {showAddArticleModal && (
          <AddArticleModal
            show={showAddArticleModal}
            onClose={() => setShowAddArticleModal(false)}
            onArticleAdded={() => fetchUserArticles()}
          />
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

        {/* ADD TAG DIALOG */}
        <Dialog open={addTagDialogOpen} onOpenChange={setAddTagDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
                Add tag
              </DialogTitle>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Enter a tag for this article and choose whether it should be public.
              </p>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Tag name
                </label>
                <Input
                  value={tagName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagName(e.target.value)}
                  placeholder="e.g. optimization, transformers…"
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

              <div className="flex items-center gap-2">
                <input
                  id="tag-is-public"
                  type="checkbox"
                  checked={tagIsPublic}
                  onChange={(e) => setTagIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-[hsl(var(--border))]"
                />
                <label
                  htmlFor="tag-is-public"
                  className="text-sm text-[hsl(var(--foreground))]"
                >
                  Public tag
                </label>
              </div>

              {tagError && (
                <p className="text-sm text-[hsl(var(--destructive))]">
                  {tagError}
                </p>
              )}
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setAddTagDialogOpen(false)}
                className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              >
                Cancel
              </Button>

              <Button
                onClick={handleConfirmAddTag}
                disabled={tagSubmitting}
                className="
                  rounded-xl bg-[hsl(var(--primary))]
                  text-[hsl(var(--primary-foreground))]
                  hover:brightness-110 px-5
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
              >
                Add tag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ADD TAG RESULT DIALOG */}
        <Dialog open={tagResultOpen} onOpenChange={setTagResultOpen}>
          <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
                {tagResultStatus === "success" ? "Tag added" : "Tag error"}
              </DialogTitle>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {tagResultMessage}
              </p>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <Button
                onClick={() => setTagResultOpen(false)}
                className="rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110 px-6"
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* UNLIKE CONFIRM DIALOG */}
        <Dialog open={unlikeConfirmOpen} onOpenChange={setUnlikeConfirmOpen}>
          <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
                Remove from favourites?
              </DialogTitle>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                This article will be removed from your favourite articles list. You can still like it again later.
              </p>
            </DialogHeader>

            <DialogFooter className="mt-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setUnlikeConfirmOpen(false)}
                className="rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              >
                Cancel
              </Button>

              <Button
                onClick={handleConfirmUnlike}
                disabled={unlikeSubmitting}
                className="
                  rounded-xl px-4 py-2 text-sm font-semibold
                  border-[hsl(var(--destructive))]/70
                  bg-[hsl(var(--destructive))]/10
                  text-[hsl(var(--destructive))]
                  hover:bg-[hsl(var(--destructive))]/20
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
                variant="outline"
              >
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* UNLIKE RESULT DIALOG */}
        <Dialog open={unlikeResultOpen} onOpenChange={setUnlikeResultOpen}>
          <DialogContent className="max-w-md rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">
                {unlikeResultStatus === "success" ? "Article unliked" : "Action failed"}
              </DialogTitle>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {unlikeResultMessage}
              </p>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <Button
                onClick={() => setUnlikeResultOpen(false)}
                className="rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110 px-6"
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )}
  </>
);

}

export default Profile;