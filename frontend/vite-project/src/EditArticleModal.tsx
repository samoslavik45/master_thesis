import React, { useState, useEffect } from 'react';
import { Article, Category, EditedKeyword } from './types'; 
import './EditArticleModal.css';
import KeywordsModal from './KeywordsModal';
import Swal from 'sweetalert2';

interface Keyword {
  id: string;
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

const EditArticleModal: React.FC<EditArticleModalProps> = ({ show, article, categories, onClose, onDelete, onArticleUpdated }) => {
  console.log('Modal show state:', show); 
  console.log('Received article data:', article);  
  const initialAuthors = article.authors.join(', ');  
  const [formData, setFormData] = useState({
        id: article.id,
        title: article.title,
        content: article.content,
        author_name: initialAuthors,  
        keywords: article.keywords instanceof Array ? article.keywords : [], 
        category: article.category instanceof Object ? article.category.id : article.category, 
        tag: article.tag,
      });
  const [showKeywordsModal, setShowKeywordsModal] = useState(false);
  const [keywordData, setKeywordData] = useState<Keyword[]>([]);
  const [editedKeywords, setEditedKeywords] = useState<EditedKeyword[]>([]);
  const [keywordsChanged, setKeywordsChanged] = useState(false);  
  const [searchTerm, setSearchTerm] = useState('');
  const [keywordsConfirmed, setKeywordsConfirmed] = useState(false);  
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log(formData.keywords, "autori")


  const handleKeywordsConfirm = async (selectedKeywords: EditedKeyword[]) => {
    if (keywordsChanged){
      const selectedKeywordsIds = selectedKeywords.filter(kw => kw.selected).map(kw => kw.id);
      setFormData({ ...formData, keywords: selectedKeywordsIds });
      await updateArticleKeywords(selectedKeywords);
      setKeywordsChanged(false);  
      setKeywordsConfirmed(true);  
    }
  };
  const renderEditKeywordsButton = () => {
    if (!keywordsConfirmed) {
      return <button type="button" onClick={() => handleEditKeywordsClick()}>Edit Keywords</button>;
    }
    return null;  
  };



  const handleEditKeywordsClick = () => {
    const keywordsToEdit: EditedKeyword[] = formData.keywords.map(id => ({
      id: id,
      value: keywordMap[id] || 'Názov neznámy', 
      selected: true,
    }));
    setEditedKeywords(keywordsToEdit); 
    setShowKeywordsModal(true); 
    setKeywordsChanged(false);  
  };


  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/keywords/');
        const data = await response.json();
        setKeywordData(data); 
      } catch (error) {
        console.error('Failed to fetch keywords:', error);
      }
    };
    fetchKeywords();
  }, []);

  useEffect(() => {
    if (article) {
      const initialAuthors = article.authors.join(', ');  
      setFormData({
        id: article.id,
        title: article.title,
        content: article.content,
        author_name: initialAuthors,  
        category: article.category instanceof Object ? article.category.id : article.category,
        keywords: article.keywords instanceof Array ? article.keywords : [],
        tag: article.tag,
      });
  
      console.log('Initial form data set:', formData);
    }
  }, [article]);
    
  if (!show || !article) {
      return null;
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  }; 

  async function updateArticle(articleData: Partial<Article>) {
    try {
      const response = await fetch(`http://localhost:8000/api/articles/update/${formData.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(articleData)
      });
  
      if (response.ok) {
        Swal.fire({
          title: 'Success!',
          text: 'Your article has been updated successfully.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          onArticleUpdated(); 
          onClose(); 
        });
      } else {
        throw new Error('Failed to update article');
      }
    } catch (error) {
      console.error('Error updating article:', error);
      Swal.fire({
          title: 'Error!',
          text: 'There was a problem updating your article.',
          icon: 'error',
          confirmButtonText: 'OK'
      });
    }
  }

  async function createKeyword(keyword: string) {
    const response = await fetch('http://localhost:8000/api/create/keyword/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ keyword })
    });
    return response.json();
  }

  async function updateArticleKeywords(newKeywords: EditedKeyword[]) {
    const newKeywordsToAdd = newKeywords.filter(kw => !kw.id && kw.selected).map(kw => createKeyword(kw.value));
    const newKeywordsData = await Promise.all(newKeywordsToAdd);
  
    const existingSelectedIds = newKeywords.filter(kw => kw.id && kw.selected).map(kw => kw.id);
    const newKeywordIds = newKeywordsData.map(kwData => kwData.id);
  
    const updatedKeywordIds = [...existingSelectedIds, ...newKeywordIds];
    

    setFormData(prevFormData => ({
      ...prevFormData,
      keywords: updatedKeywordIds
    }));
  }
  

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const authorsArray = formData.author_name.split(',').map(name => name.trim());
  

    const articleData = {
      title: formData.title,
      content: formData.content,
      authors: authorsArray,
      category_id: formData.category,
      tag: formData.tag,
      keywords: formData.keywords 
    };
  

    if (keywordsChanged) {
      await updateArticleKeywords(editedKeywords); 
      setKeywordsChanged(false); 
    }
    await updateArticle(articleData);

  };

  const handleDelete = () => {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            onDelete(article.id);
            onClose();
            Swal.fire(
                'Deleted!',
                'Your article has been deleted.',
                'success'
            )
        }
    });
  };

  const keywordMap: { [key: string]: string } = keywordData.reduce((map, keyword) => {
    const key = keyword.id.toString();
    map[key] = keyword.keyword;
    return map;
  }, {} as { [key: string]: string });
  

  return (
    <div className="edit-article-modal">
      <form onSubmit={handleSubmit}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Article</h5>
            <button type="button" className="close" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Title:</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group">
              <label>Abstract:</label>
              <textarea name="content" value={formData.content} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group">
                <label htmlFor="author_name">Author Name:</label>
                <input
                    type="text"
                    id="author_name"
                    name="author_name"
                    value={formData.author_name} 
                    onChange={handleChange}  
                    className="form-control"
                />
            </div>
            <label htmlFor="categorySearch">Search Categories:</label>
                    <input
                      type="text"
                      id="categorySearch"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search categories..."
                    />
            <div className="form-group">
              <label>Category:</label>
              <select name="category" value={formData.category} onChange={handleChange} className="form-control" size={5}>
                {filteredCategories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            {showKeywordsModal  && (
              <KeywordsModal
              editedKeywords={editedKeywords}
              onConfirm={handleKeywordsConfirm}
              setKeywordsChanged={setKeywordsChanged}
              setShowKeywordsModal={setShowKeywordsModal}
            />
            )}
            {renderEditKeywordsButton()}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            <button type="submit" className="btn btn-primary">Save changes</button>
            <button type="button" onClick={handleDelete} className="btn btn-danger">Delete Article</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditArticleModal;
