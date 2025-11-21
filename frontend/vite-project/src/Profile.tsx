import { useState, useEffect } from "react";
import "./Profile.css";
import { Article, Category } from "./types";
import AddArticleModal from "./AddArticleModal";
import Swal from "sweetalert2";
import EditArticleModal from "./EditArticleModal";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "./App";
import { useContext } from "react";


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
import { Badge } from "@/components/ui/badge";



interface Profile {
    first_name: string;
    last_name: string;
    email: string;
    
}


const Profile = () => {
    const [user, setUser] = useState<Profile | null>(null); 
    const [userArticles, setUserArticles] = useState<Article[]>([]); 
    const [likedArticles, setLikedArticles] = useState<Article[]>([]);
    const [showAddArticleModal, setShowAddArticleModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [currentArticleToEdit, setCurrentArticleToEdit] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); 
    const navigate = useNavigate(); 
    const { openLogin } = useContext(LoginContext);


    const redirectToLogin = () => {
      navigate('/login'); 
    };

    const checkTokenValidity = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = new Date(payload.exp * 1000);
        return expiry > new Date(); 
      }
      return false;
    };

    useEffect(() => {
      const token = localStorage.getItem("accessToken");

      // helper: check token validity
      const isTokenValid = () => {
        if (!token) return false;
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          return payload.exp * 1000 > Date.now();
        } catch {
          return false;
        }
      };

      // 1) Token validity on mount
      if (!isTokenValid()) {
        setIsLoggedIn(false);
        return; // no need to fetch anything else
      }
      setIsLoggedIn(true);

      // 2) Fetch everything in parallel
      const loadAll = async () => {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        try {
          const [userRes, articlesRes, likedRes, catRes] = await Promise.all([
            fetch("http://localhost:8000/main/current_user/", { headers }),
            fetch("http://localhost:8000/api/user-articles/", { headers }),
            fetch("http://localhost:8000/api/liked-articles/", { headers }),
            fetch("http://localhost:8000/api/categories/", { headers }),
          ]);

          const [userData, articlesData, likedData, categoriesData] =
            await Promise.all([
              userRes.json(),
              articlesRes.json(),
              likedRes.json(),
              catRes.json(),
            ]);

          setUser(userData);
          setUserArticles(articlesData);
          setLikedArticles(likedData);
          setCategories(categoriesData);
        } catch (err) {
          console.error("Error while loading profile:", err);
          setIsLoggedIn(false);
        }
      };

      loadAll();

      // 3) Token checker interval
      const intervalId = setInterval(() => {
        if (!isTokenValid()) {
          clearInterval(intervalId);
          setIsLoggedIn(false);
        }
      }, 30000);

      return () => clearInterval(intervalId);
    }, []);

    
    
    
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
    
    const unlikeArticle = async (articleId: number) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const response = await fetch(`http://localhost:8000/api/articles/unlike/${articleId}/`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
              });
              if (response.ok) {
                setLikedArticles(prevArticles => prevArticles.filter(article => article.id !== articleId));
                Swal.fire(
                  'Deleted!',
                  'Artcile has been unliked.',
                  'success'
                )
              } else {
                console.error('Failed to unlike the article.');
                Swal.fire(
                  'Error!',
                  'Failed to unlike the article.',
                  'error'
                )
              }
            } catch (error) {
              console.error('Error:', error);
            }
          }
        });
      } else {
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
      Swal.fire({
        title: 'Enter Tag',
        html: `
          <input type="text" id="tagName" class="swal2-input" placeholder="Tag Name">
          <label for="isPublic" class="swal2-checkbox" style="display: flex; align-items: center; margin-top: 20px;">
            <input type="checkbox" id="isPublic" style="width: 24px; height: 24px; margin-right: 8px;"> Public
          </label>
          <div style="display: flex; justify-content: center; margin-top: 20px;">
            <button type="button" id="swal2-confirm" class="swal2-confirm swal2-styled" style="margin-right: 5px;">OK</button>
            <button type="button" id="swal2-cancel" class="swal2-cancel swal2-styled">Cancel</button>
          </div>
        `,
        showConfirmButton: false,
        preConfirm: () => {
          
        },
        didOpen: () => {
          
          const confirmButton = Swal.getPopup()?.querySelector('#swal2-confirm') as HTMLElement;
          confirmButton.onclick = () => {
            const tagName = (Swal.getPopup()?.querySelector('#tagName') as HTMLInputElement)?.value;
            const isPublic = (Swal.getPopup()?.querySelector('#isPublic') as HTMLInputElement)?.checked;
            if (tagName) {
              handleAddTag(articleId, tagName, isPublic);
              Swal.close();
            } else {
              Swal.showValidationMessage('Tag name is required');
            }
          };
    
          
          const cancelButton = Swal.getPopup()?.querySelector('#swal2-cancel') as HTMLElement;
          cancelButton.onclick = () => {
            Swal.close();
          };
        }
      });
    };

    const handleShowTags = async (articleId: number) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await fetch(`http://localhost:8000/api/article/${articleId}/tags/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch tags');
          }
          const { publicTags, userTags } = await response.json();
    
          
          Swal.fire({
            title: 'Article Tags',
            html: `
              <h6>Public Tags:</h6>
              <p>${publicTags.join('; ')}</p>
              <h6>Your Tags:</h6>
              <p>${userTags.join('; ')}</p>
            `,
            confirmButtonText: 'Close',
          });
        } catch (error) {
          console.error('Error fetching tags:', error);
        }
      }
    };

    const handleAddTag = async (articleId: number, tagName: string, isPublic: boolean): Promise<void> => {
      try {
        const token = localStorage.getItem('accessToken'); 
        const response = await fetch('http://localhost:8000/api/add-tag/', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            article_id: articleId,
            tag_name: tagName,
            is_public: isPublic,
          }),
        });
    
        if (!response.ok) {
          throw new Error('Failed to add tag to article');
        }
    
        const data = await response.json();
        console.log(data.message);

        Swal.fire(
          'Tag Added!',
          'The tag has been successfully added.',
          'success'
        );
      } catch (error) {
        console.error('Error:', error);
        Swal.fire(
          'Error!',
          'Failed to add tag to the article.',
          'error'
        )
      }
    };

    const handleEditClick = (article: Article) => {
      setCurrentArticleToEdit(article.id);
      setShowEditModal(true);
    };

  
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
      <div className="max-w-5xl mx-auto mt-24 px-4 pb-16">

        {/* PROFILE CARD */}
        <Card className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-md rounded-2xl mb-10">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-[hsl(var(--foreground))]">
              {user.first_name} {user.last_name}
            </CardTitle>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">{user.email}</p>
          </CardHeader>
        </Card>

        {/* MAIN TABS */}
        <Tabs defaultValue="myarticles" className="w-full">
          <TabsList
            className="
              grid grid-cols-2 w-full 
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
                          onClick={() => handleShowTags(article.id)}
                          size="sm"
                          className="
                            rounded-xl
                            bg-[hsl(var(--accent))]
                            border border-[hsl(var(--border))]
                            text-[hsl(var(--foreground))]
                            hover:bg-[hsl(var(--muted))]
                            transition
                          "
                        >
                          Show Tags
                        </Button>

                        <Button
                          onClick={() => handleOpenAddTagModal(article.id)}
                          size="sm"
                          className="
                            rounded-xl
                            bg-[hsl(var(--primary))]
                            text-[hsl(var(--primary-foreground))]
                            hover:scale-[1.03]
                            transition
                          "
                        >
                          Add Tag
                        </Button>

                        <Button
                          onClick={() => unlikeArticle(article.id)}
                          variant="secondary"
                          size="sm"
                          className="
                            rounded-xl
                            bg-[hsl(var(--secondary))]
                            text-[hsl(var(--foreground))]
                            hover:bg-[hsl(var(--muted))]
                            transition
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
        </Tabs>

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
      </div>
    )}
  </>
);

}

export default Profile;