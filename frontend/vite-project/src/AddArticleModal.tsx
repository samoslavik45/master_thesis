import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import './AddArticleModal.css'
import { Category } from './types'; // Aktualizujte cestu podľa skutočnej štruktúry vašich súborov
import KeywordsModalAdd from './KeywordsModalAdd';
import AbstractModal from './AbstractModal'; // Predpokladáme, že ste už vytvorili tento komponent
import Swal from 'sweetalert2';
import { FaPlus } from 'react-icons/fa'; // Toto musíte nainstalovat react-icons


interface AddArticleModalProps {
  show: boolean;
  onClose: () => void;
}

interface FormData {
  title: string;
  content: string;
  author_name: string;
}

interface CategoryDetails {
  name: string;
  description: string;
}


const AddArticleModal: React.FC<AddArticleModalProps> = ({ show, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    author_name: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [keywordsText, setKeywordsText] = useState<string>('');
  const [showKeywordsModal, setShowKeywordsModal] = useState(false);
  const [keywordsForEditing, setKeywordsForEditing] = useState([]);
  const [showAbstractModal, setShowAbstractModal] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const triggerFileSelectPopup = () => fileInputRef.current?.click();


  useEffect(() => {
    const fetchData = async () => {
      try {
        // Načítanie kategórií
        const categoriesResponse = await fetch('http://localhost:8000/api/categories/');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);


        // Načítanie kľúčových slov
        const keywordsResponse = await fetch('http://localhost:8000/api/keywords/');
        const keywordsData = await keywordsResponse.json();
        setSelectedKeywords(keywordsData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []); // Prázdna závislosť znamená, že tento efekt sa vykoná len pri prvom renderovaní

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file); 
      const formData = new FormData();
      formData.append('pdf_file', file);
  
      try {
        const response = await fetch('http://127.0.0.1:8000/extract-keywords/', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        setPdfUploaded(true);
        setFormData(prevState => ({
          ...prevState,
          title: data.title || '',
          author_name: data.author || '',
          content: data.abstract || prevState.content,
        }));

        if (data.abstract) {
          setShowAbstractModal(true);
        }
        if (Array.isArray(data.keywords)) {
          setKeywordsForEditing(data.keywords);
          setShowKeywordsModal(true);
      } else {
          console.error('Received keywords are not in an array format:', data.keywords);
          setPdfUploaded(false);
          setKeywordsText('');
      }
      
      } catch (error) {
        console.error('Error extracting keywords:', error);
        setKeywordsText(''); // V prípade chyby nechať pole prázdne
      }
    }
  };

  const handleAddCategory = async () => {
    const { value: formValues } = await Swal.fire<CategoryDetails>({
      title: 'Enter new category details',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Category Name">' +
        '<textarea id="swal-input2" class="swal2-textarea" placeholder="Category Description"></textarea>',
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const name = (document.getElementById('swal-input1') as HTMLInputElement).value;
        const description = (document.getElementById('swal-input2') as HTMLTextAreaElement).value;
        if (!name || !description) {
          Swal.showValidationMessage("You need to write both name and description!");
          return;
        }
        return { name, description };
      }
    });
  
    if (formValues) {
      try {
        const response = await fetch('http://localhost:8000/api/categories/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ name: formValues.name, description: formValues.description })
        });
        const result = await response.json();
        if (response.ok) {
          setCategories([...categories, result]); // Assuming the server returns the new category
          alert('Category added successfully!');
        } else {
          throw new Error('Failed to add category');
        }
      } catch (error: any) {
        console.error('Failed to add category:', error);
        alert('Failed to add category: ' + error.message);
      }
    }
  };
  
  
  
  const handleKeywordsConfirm = (confirmedKeywords: string[]) => {
    setKeywordsText(confirmedKeywords.join(', '));
    setShowKeywordsModal(false); // Skryje modálne okno
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = e.target.selectedOptions;
    const selectedValues = Array.from(selectedOptions).map(option => option.value);
    setSelectedCategories(selectedValues);
  };
  

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Add validation
    const authorsArray = formData.author_name.split(',').map(name => name.trim());  // Rozdelenie a trimovanie mien
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('content', formData.content);
    authorsArray.forEach(author => {
      formDataToSend.append('authors', author);  // Pridávanie mien autorov
    });
    // Pre každú kategóriu, tag, a kľúčové slovo, použite append v samostatnom volaní
    selectedCategories.forEach(category => {
        formDataToSend.append('categories', category);
    });
    formDataToSend.append('keywords_text', keywordsText);
    if (!file) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please select a PDF file to upload.',
      });
      return;
    }
    if (file) {
      formDataToSend.append('pdf_file', file);
    }
    try {
      const response = await fetch('http://localhost:8000/api/articles/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formDataToSend,
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        Swal.fire({
          icon: 'error',
          title: 'Upload failed',
          text: data.error || 'Something went wrong, please try again.',
        });
        return;
      }
  
      if (data.error) {
        Swal.fire({
          icon: 'error',
          title: 'Upload failed',
          text: data.error,
        });
        return;
      }
  
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Article has been successfully posted.',
      }).then((result) => {
        if (result.isConfirmed || result.isDismissed) {
          onClose(); // Zatvoriť modál, obnoviť dáta atď.
        }
      });
  
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload failed',
        text: 'An error occurred, please try again.',
      });
    }
  };

  if (!show) {
    return null;
  }
  

  return (
    <>
      <div className="modal-backdrop show" onClick={onClose}></div>
      <div className="modal show">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Add new article</h5>
              <button type="button" className="close" onClick={onClose} aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <label htmlFor="pdf_file">PDF file:</label>
                <div className="custom-file-upload">
                  <input
                    type="file"
                    id="pdf_file"
                    name="pdf_file"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                  />
                  {!pdfUploaded && (
                    <>
                  <button type='button' onClick={triggerFileSelectPopup}>
                    Select file
                  </button>
                    </>
                  )}
                  <span className="file-selected-label">
                    {file ? file.name : 'No file selected'}
                  </span>
                </div>
                {pdfUploaded && (
                  <>
                  <label htmlFor="title">Title:</label>
                  <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} />
      
                  <label htmlFor="content">Description:</label>
                  <textarea id="content" name="content" value={formData.content} onChange={handleChange} rows={5}></textarea>

                  <label htmlFor="author_name">Author name:</label>
                  <input type="text" id="author_name" name="author_name" value={formData.author_name} onChange={handleChange} />
      
                  <label htmlFor="categorySearch">Search Categories:</label>
                    <input
                      type="text"
                      id="categorySearch"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search categories..."
                    />
                  <button type="button" className="btn add-category-btn" onClick={handleAddCategory}>
                    <FaPlus />
                  </button>   
                  <label htmlFor="categories">Categories:</label>
                  <select multiple id="categories" name="categories" value={selectedCategories} onChange={handleCategoryChange}>
                    {filteredCategories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>



                  {/* Pridanie select pre kľúčové slová */}
                  <label htmlFor="keywords_text">Keywords:</label>
                  {showKeywordsModal && (
                    <KeywordsModalAdd
                      keywords={keywordsForEditing}
                      onConfirm={handleKeywordsConfirm}
                    />
                  )}       
                  </>
                )}     
              </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
              <button type="submit" className="btn btn-primary mb5">Post article</button>
            </div>
          </form>
        </div>
      </div>
      {showAbstractModal && (
        <AbstractModal
          abstract={formData.content}
          onConfirm={(confirmedAbstract: string) => {
            setFormData({ ...formData, content: confirmedAbstract });
            setShowAbstractModal(false);
          }}
          onClose={() => {
            setFormData({ ...formData, content: "" });
            setShowAbstractModal(false);
          }}
        />
      )}
    </>
  );
    };

export default AddArticleModal;