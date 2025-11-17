import React, { useState } from 'react';
import { Article, Category } from './types'; 
import { Button, Card, Dropdown } from 'react-bootstrap'; 
import axios from 'axios';
import fileDownload from 'js-file-download';
import { FaHeart } from 'react-icons/fa'; 
import Swal from 'sweetalert2';

interface ArticlesListProps {
  articles: Article[];
  groups: Array<{ id: number; name: string }>;
  categories: Category[];
  isLoggedIn: boolean;
}

/* ---------------- PDF handlers ---------------- */

const handlePDFDownload = (pathToFile: string) => {
  const filename = pathToFile.split('/').pop() || 'defaultName.pdf';
  axios.get(`http://localhost:8000/media/${pathToFile}`, {
    responseType: 'blob',
  })
  .then(res => fileDownload(res.data, filename))
  .catch(err => console.error(err));
};

const handlePdfMetadataExport = (filename: string) => {
  axios.post('http://localhost:8000/api/generate-bibtex/', { filename })
    .then(response => {
      const text = response.data;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename.split('/').pop()?.replace(/\.[^/.]+$/, "") + ".bib";
      link.click();
    })
    .catch(() =>
      Swal.fire('Error', 'Failed to generate BibTeX.', 'error')
    );
};

/* --------------- COMPONENT ---------------- */

const ArticlesList: React.FC<ArticlesListProps> = ({ articles, isLoggedIn, groups }) => {

  const [expanded, setExpanded] = useState<number[]>([]);
  const [similarOpen, setSimilarOpen] = useState<number[]>([]);
  const [similar, setSimilar] = useState<Record<number, any[]>>({});

  const toggleExpanded = (id: number) => {
    setExpanded(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSimilar = (id: number) => {
    setSimilarOpen(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const fetchSimilar = async (articleId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/articles/${articleId}/similar/?k=4`);
      const data = await res.json();
      setSimilar(prev => ({ ...prev, [articleId]: data }));
    } catch (e) {
      console.error(e);
    }
  };

  /* ----------- LIKE HANDLERS ----------- */

  const handleLike = async (articleId: number) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return Swal.fire('Error', 'Login required.', 'error');
    }

    try {
      const res = await fetch(`http://localhost:8000/api/articles/like/${articleId}/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      Swal.fire('Success', 'Article liked!', 'success');
    } catch {
      Swal.fire('Error', 'Problem while liking article.', 'error');
    }
  };

  const handleLikeAsGroup = async (articleId: number, groupId: number) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return Swal.fire('Error', 'Login required.', 'error');

    try {
      const res = await fetch(`http://localhost:8000/api/groups/${groupId}/like_article/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ article_id: articleId }),
      });

      if (!res.ok) throw new Error();

      Swal.fire('Success', 'Liked as group!', 'success');
    } catch {
      Swal.fire('Error', 'Problem liking article as group.', 'error');
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
  
  /* -------------- RENDER -------------- */

  return (
    <div className="articles-list-container">
      {articles && articles.map(article => {

        const isExpanded = expanded.includes(article.id);
        const similarShown = similarOpen.includes(article.id);

        return (
          <Card className="article shadow-sm mb-3" key={article.id}>
            <Card.Body>

              {/* ------------ TITLE ------------ */}
              <div
                className="article-title"
                onClick={() => toggleExpanded(article.id)}
                style={{ cursor: 'pointer' }}
              >
                {article.title}
              </div>


              {isExpanded && (
                <>
                  {/* -------- HEADER INFO BOX -------- */}
                  <div className="article-header-box p-3 mb-3">
                    <div className="article-meta">Authors: {article.authors.join(', ')}</div>
                    <div className="article-meta">Categories: {article.categories.join(', ')}</div>
                    <div className="article-meta"><strong>Keywords:</strong> {article.keywords.join(', ')}</div>
                  </div>

                  {/* DESCRIPTION */}
                  <div className="article-description">
                    <strong>Description:</strong> {article.content.substring(0, 450)}...
                  </div>

                  {/* ------- SIMILAR ARTICLE TOGGLE ------- */}
                  <Button
                    variant="outline-primary"
                    className="mt-3 similar-toggle-btn"
                    onClick={() => {
                      toggleSimilar(article.id);
                      fetchSimilar(article.id);
                    }}
                  >
                    {similarShown ? "Hide Similar Articles" : "Show Similar Articles"}
                  </Button>

                  {/* ------- SIMILAR ARTICLES PANEL ------- */}
                  {similarShown && similar[article.id] && (
                    <div className="similar-box mt-3 p-3 border rounded bg-light">
                      <h5 className="text-primary mb-3">Similar Articles</h5>

                      <div className="similar-scroll">
                        {similar[article.id].map(sim => (
                          <Card className="mb-2 shadow-sm" key={sim.id}>
                            <Card.Body>
                              <Card.Title style={{ fontSize: "1rem" }}>{sim.title}</Card.Title>
                              <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                                Authors: {sim.authors.join(", ")}
                              </div>

                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="mt-2"
                                onClick={() =>
                                  window.open(`http://localhost:8000/media/${sim.pdf_file}`, "_blank")
                                }
                              >
                                Open PDF
                              </Button>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ------- TAGS BUTTON ------- */}
                  <Button
                    variant="outline-info"
                    className="mt-3 tag-button"
                    onClick={() => showTags(article.id)}
                  >
                    ⭐ Show Tags
                  </Button>

                  {/* ACTION BUTTONS */}
                  <div className="d-flex gap-2 flex-wrap mt-3">
                    <Button variant="primary" onClick={() => window.open(`http://localhost:8000/media/${article.pdf_file}`, "_blank")}>
                      Open PDF
                    </Button>
                    <Button variant="info" onClick={() => handlePDFDownload(article.pdf_file)}>
                      Download PDF
                    </Button>
                    <Button variant="success" onClick={() => handlePdfMetadataExport(article.pdf_file)}>
                      Export BibTeX
                    </Button>
                  </div>

                  {/* LIKE SECTION */}
                  {isLoggedIn && (
                    <div className="d-flex gap-2 align-items-center mt-4">
                      <Dropdown>
                        <Dropdown.Toggle className="like-group-btn">
                          👍 Like as Group
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                          {groups.map(g => (
                            <Dropdown.Item key={g.id} onClick={() => handleLikeAsGroup(article.id, g.id)}>
                              {g.name}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>

                      <Button className="like-btn" onClick={() => handleLike(article.id)}>
                        ❤️
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
};

export default ArticlesList;
