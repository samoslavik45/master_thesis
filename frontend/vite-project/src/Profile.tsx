import React, { useState, useEffect } from 'react';
import './Profile.css'; 
import { Article, Category } from './types'; // Upravte cestu podľa vášho projektu
import AddArticleModal from './AddArticleModal'; // Predpokladáme, že tento komponent ste už vytvorili
import AddTagModal from './AddTagModal';
import TagsModal from './TagsModal';
import Swal from 'sweetalert2';
import EditArticleModal from './EditArticleModal';
import { useNavigate } from 'react-router-dom';



// Definovanie typu pre užívateľa
interface Profile {
    first_name: string;
    last_name: string;
    email: string;
    // pridajte ďalšie vlastnosti podľa potreby
}

interface Tags {
  publicTags: string[];
  userTags: string[];
}

const Profile = () => {
    const [user, setUser] = useState<Profile | null>(null); // Použitie typu User[]
    const [userArticles, setUserArticles] = useState<Article[]>([]); // Přidáme stav pro články uživatele
    const [likedArticles, setLikedArticles] = useState<Article[]>([]);
    const [showAddArticleModal, setShowAddArticleModal] = useState<boolean>(false);
    const [showTagModal, setShowTagModal] = useState<boolean>(false);
    const [currentArticleId, setCurrentArticleId] = useState<number | null>(null);
    const [tagsToShow, setTagsToShow] = useState<{ publicTags: string[]; userTags: string[]; }>({ publicTags: [], userTags: [] });
    const [showTagsModal, setShowTagsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [currentArticleToEdit, setCurrentArticleToEdit] = useState<Article | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Stav pre prihlásenie
    const navigate = useNavigate(); // Hook useNavigate() pro navigaci

    const redirectToLogin = () => {
      navigate('/login'); // Přesměrování na /login
    };

    const checkTokenValidity = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = new Date(payload.exp * 1000);
        return expiry > new Date(); // porovnáme s aktuálnym časom
      }
      return false;
    };

    useEffect(() => {
      const tokenIsValid = checkTokenValidity();
      if (!tokenIsValid) {
        setIsLoggedIn(false); // aktualizujeme stav na ne-prihlásený
      }
      if (tokenIsValid){
        setIsLoggedIn(true);
      }
    }, []);

    useEffect(() => {
      const intervalId = setInterval(() => {
        const tokenIsValid = checkTokenValidity();
        if (!tokenIsValid) {
          clearInterval(intervalId); // zastavíme interval, keď token už nie je platný
          setIsLoggedIn(false); // aktualizujeme stav na ne-prihlásený
        }
      }, 30000); // kontrola každých 30 sekúnd
    
      return () => clearInterval(intervalId); // vyčistenie intervalu pri unmountingu
    }, []);


    useEffect(() => {
      const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');    
      if (token) {
          fetch('http://localhost:8000/main/current_user/', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`, // Použitie tokenu v požiadavke
              'Content-Type': 'application/json'
            },
          })
            .then(response => response.json())
            .then(data => {
              setUser(data);
            })
            .catch(error => console.error('Error:', error));
        } else {
          console.log('No token found, user might not be logged in');
        }
      }
      fetchUser();
      }, []);

    useEffect(() => {
      fetchUserArticles();
    }, []); 

    useEffect(() => {
      const fetchLikedArticles = async () => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            const response = await fetch('http://localhost:8000/api/liked-articles/', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            const articles = await response.json();
            setLikedArticles(articles);
          } catch (error) {
            console.error('Error fetching liked articles:', error);
          }
        }
      };
      fetchLikedArticles();
    }, []); // Pridáme do dependency array, aby sme to spustili len po načítaní komponentu

    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/categories/', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch categories');
          }
          const data = await response.json();
          setCategories(data);
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      };
    
      fetchCategories();
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
    
        // Odstrániť článok zo stavu
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
              console.log('Loaded articles:', articles); // Kontrolný log pre zobrazenie načítaných článkov
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
          // Logika pre tlačidlo OK by mala byť tu, ale z dôvodu custom implementácie ju presúvame do didOpen
        },
        didOpen: () => {
          // OK button handler
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
    
          // Cancel button handler
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
    
          // Zobrazenie tagov pomocou SweetAlert2
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
      } catch (error) {
        console.error('Error:', error);
      }
    };

    const handleEditClick = (article: Article) => {
      setCurrentArticleToEdit(article);
      setShowEditModal(true);
    };

  
    return (
      <>
        {isLoggedIn && user ? (
          <div className="profile-card card shadow">
            <div className="card-body mt-3">
              <h2 className="card-title text-center mt-2">Profile</h2>
                <div className="profile-details text-center mb-4">
                  <p className="profile-name mb-2">{user.first_name} {user.last_name}</p>
                  <p className="profile-email">{user.email}</p>
                  <div className="user-articles">
                    <h3 className="my-articles-heading">My Articles</h3>
                    <div className="user-articles">
                    {userArticles.map(article => (
                      <div key={article.id} className="article-preview d-flex align-items-center justify-content-between mb-2 p-2 border rounded">
                        <div className='article-preview-content'>
                          <h5 className="mb-0">{article.title}</h5>
                          <p className="mb-0">Authors: <span className="text-muted">{article.authors.map(author => author).join(', ')}</span></p>
                          <p className="mb-0">Date: <span className="text-muted">{new Date(article.created_at).toLocaleDateString("cs-CZ")}</span></p>                                 
                        </div>
                        <button onClick={() => handleEditClick(article)} className="btn btn-sm edit-article-btn">
                          Edit
                        </button>
                      </div>
                    ))}
                    </div>
                  </div>
        
                  <div className="profile-actions mb-2 mt-2">
                    <button className="btn btn-primary" onClick={handleAddArticleClick}>Add Article</button>
                  </div>
                  <h3>Favourite Articles</h3>
                  <div className="liked-articles">
                    <div className="articles-container-profile">
                      {likedArticles.map(article => (
                        <div key={article.id} className="article-preview d-flex align-items-center justify-content-between mb-2 p-2 border rounded">
                          <div className='article-preview-content'>
                            <h5 className="mb-0">{article.title}</h5>
                            <p className="mb-0">Authors: <span className="text-muted">{article.authors.map(author => author).join(', ')}</span></p>
                            <p className="mb-0">Date: <span className="text-muted">{new Date(article.created_at).toLocaleDateString("cs-CZ")}</span></p>                                 
                          </div>
                          <button onClick={() => handleShowTags(article.id)} className="btn btn-info btn-sm">Show Tags</button>
                          <button onClick={() => handleOpenAddTagModal(article.id)} className="btn btn-primary btn-sm">Add Tag</button>
                          <button onClick={() => unlikeArticle(article.id)} className="btn btn-secondary btn-sm">Unlike</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {showEditModal && currentArticleToEdit && (
                      <EditArticleModal
                          show={showEditModal}
                          article={currentArticleToEdit}
                          categories={categories}
                          onClose={() => setShowEditModal(false)}
                          onDelete={handleDeleteArticle}
                          onArticleUpdated={handleArticleUpdated} // Pridanie prop
                      />
                  )}
                  <AddTagModal
                    show={showTagModal}
                    onClose={() => setShowTagModal(false)}
                    articleId={currentArticleId}
                    onAddTag={handleAddTag}
                  />
                  <AddArticleModal show={showAddArticleModal} onClose={handleCloseModal} />
                </div>
              </div>
           </div>
          ) : (
            <div className="not-logged-in-card">
              <div className="not-logged-in-content">
                <h2>Profile</h2>
                <p>No profile data.</p>
                <button onClick={redirectToLogin}>
                  Login
                </button>
              </div>
            </div>          
          )}
        </>
    );
}

export default Profile;