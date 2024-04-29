import React, { useState } from 'react';
import { Article, Category } from './types'; // Upravte cestu podľa vášho projektu
import { Button, Card, Dropdown } from 'react-bootstrap'; // Import Bootstrap Button a Card
import axios from 'axios';
import fileDownload from 'js-file-download';
import { FaHeart } from 'react-icons/fa'; // Ikona srdca pre tlačidlo like, potrebné pridať do projektu cez npm
import Swal from 'sweetalert2';



// Definícia typov pre props komponentu
interface ArticlesListProps {
  articles: Article[];
  groups: Array<{ id: number; name: string }>; // Pridajte typ pre vaše skupiny
  categories: Category[]; // Pridajte typ pre vaše kategórie
  isLoggedIn: boolean; // Pridaný nový prop
}

const handlePDFDownload = (pathToFile: string) => {
  // Rozdělení cesty k souboru pro získání samotného názvu souboru
  const filename = pathToFile.split('/').pop() || 'defaultName.pdf';
  axios.get(`http://localhost:8000/media/${pathToFile}`, {
        responseType: 'blob',
    }).then(res => {
        // Použití extrahovaného názvu souboru pro název staženého souboru
        fileDownload(res.data, filename);
        console.log("názov súboru" + pathToFile)
    }).catch(err => {
        console.error(err);
    });
};


const handlePdfMetadataExport = (filename: string) => {
  axios.post('http://localhost:8000/api/generate-bibtex/', { filename })
    .then(response => {
      const bibtexText = response.data;
      const blob = new Blob([bibtexText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.split('/').pop()?.replace(/\.[^/.]+$/, "") + ".bib" || "default.bib";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(error => {
      console.error('There was an error with the request:', error);
      Swal.fire('Error', 'Failed to generate BibTeX. Please try again.', 'error');
    });
};




const ArticlesList: React.FC<ArticlesListProps> = ({ articles, isLoggedIn, groups, categories }) => {

  const [expandedArticleIds, setExpandedArticleIds] = useState<number[]>([]);
  const toggleArticle = (articleId: number) => {
    setExpandedArticleIds(currentExpandedIds =>
      currentExpandedIds.includes(articleId)
        ? currentExpandedIds.filter(id => id !== articleId)
        : [...currentExpandedIds, articleId]
    );
  };
  console.log('Prijaté kategórie v ArticlesList:', categories); // Log prijatých kategórií
  
  const handleLike = async (articleId: number) => {
    const token = localStorage.getItem('accessToken'); // Získanie tokenu z local storage
    if (token) {
      try {
        const response = await fetch(`http://localhost:8000/api/articles/like/${articleId}/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Problém pri like článku');
        }
        const data = await response.json();
        console.log(data.detail);
        Swal.fire({
          title: 'Success!',
          text: 'You have liked the article successfully!',
          icon: 'success',
          confirmButtonText: 'Close'
        });
      } catch (error) {
        console.error('Chyba:', error);
        Swal.fire('Error', 'There was a problem liking the article.', 'error');
      }
    } else {
      console.log('Užívateľ nie je prihlásený');
      Swal.fire('Error', 'You must be logged in to like an article.', 'error');
    }
  };

  const handleLikeAsGroup = async (articleId: number, groupId: number) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('Užívateľ nie je prihlásený');
      Swal.fire('Error', 'You must be logged in to like an article as a group.', 'error');
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:8000/api/groups/${groupId}/like_article/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ article_id: articleId }),
      });
  
      if (!response.ok) {
        throw new Error('Problém pri odosielaní like za skupinu.');
      }
  
      const data = await response.json();
      console.log(data.detail); // Server by mal vrátiť nejakú správu o úspechu
      Swal.fire({
        title: 'Success!',
        text: `Article liked successfully as ${data.groupName || 'your group'}!`,
        icon: 'success',
        confirmButtonText: 'Close'
    });
  } catch (error) {
    console.error('Chyba:', error);
    Swal.fire('Error', 'There was a problem liking the article as a group.', 'error');
  }
  };

  const showTags = async (articleId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/article/${articleId}/public_tags/`, {
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const { publicTags } = await response.json();

      Swal.fire({
        title: 'Tags',
        html: `
          <h4>Public tags of article:</h4>
          <p>${publicTags.join(', ')}</p>
        `,
        confirmButtonText: 'Close',
      });
    } catch (error) {
      console.error('Error fetching tags:', error);
      Swal.fire('Error', 'Failed to fetch tags.', 'error');
    }
  };
  

  console.log('Loaded articles:', articles); // Kontrolný log pre zobrazenie načítaných článkov
  
  return (
    <div className="articles-list-container">
      {articles && articles.map((article: Article) => {
        // Logujeme kategóriu aktuálne spracúvaného článku
        console.log('Processing article with category:', article.category);
  
        return (
          <Card className="article mb-3" key={article.id}>
            <Card.Body>
              <div className="card-content w-100"> 
                <Card.Title as="button" onClick={() => toggleArticle(article.id)} className="article-title">
                    {article.title}
                  </Card.Title>
                    <div className="article-meta">Authors: {article.authors.join(', ')}</div>
                      <div className="article-meta">
                          Categories: {article.categories.join(', ')}
                      </div>
                    {expandedArticleIds.includes(article.id) && (
                    <>
                      <div className="article-divider"></div> {/* Nový element pre vizuálnu oddelenie */}
                      <Card.Text>Keywords: {article.keywords.join(', ')}</Card.Text>
                      <Card.Text>Description: {article.content.substring(0, 500)}...</Card.Text>
                      <Button variant="info" className="btn-sm" onClick={() => showTags(article.id)}>Show Tags</Button>
                      <div className="card-buttons">
                        <Button variant="primary" onClick={() => window.open(`http://localhost:8000/media/${article.pdf_file}`, '_blank')} style={{ marginRight: '10px'}} className="btn-custom">Open PDF</Button>
                        <Button variant="info" onClick={() => handlePDFDownload(article.pdf_file)} style={{ marginRight: '10px' }} className="btn-custom">Export PDF</Button>
                        <Button variant="success" onClick={() => handlePdfMetadataExport(article.pdf_file)} className="btn-custom">Export BibTeX</Button>
                      </div>
                    </>
                  )}

                {isLoggedIn && expandedArticleIds.includes(article.id) && (
                <div className="like-group-button">
                <><Dropdown>
                  <Dropdown.Toggle variant="success" id="dropdown-basic">
                    Like as Group
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="dropdown-menu">
                    {groups.map((group) => (
                      <Dropdown.Item key={group.id} onClick={() => handleLikeAsGroup(article.id, group.id)}>
                        {group.name}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown><Button
                  variant="outline-danger"
                  onClick={() => handleLike(article.id)}
                  className="btn-like"
                >
                    <FaHeart />
                  </Button></>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
  
};

export default ArticlesList;
