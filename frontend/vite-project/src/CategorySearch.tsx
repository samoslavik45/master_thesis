import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Dropdown } from 'react-bootstrap';
import Swal from 'sweetalert2';
import './CategorySearch.css'

interface Category {
  id: number;
  name: string;
  description: string; 
}

interface CategorySearchProps {
  onCategorySelect: (categoryId: number) => void;
}

const CategorySearch: React.FC<CategorySearchProps> = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/categories/');
        if (!response.ok) {
          throw new Error('Failed to fetch categories. Status: ' + response.status);
        }
        const data = await response.json() as Category[];
        console.log("Fetched Categories: ", data); 
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories: ", error);
      }
    };
  
    fetchCategories();
  }, []);
  
  

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryInfo = (category: Category, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.stopPropagation(); 
  
    Swal.fire({
      title: category.name,
      text: category.description,
      icon: 'info',
      confirmButtonText: 'Ok'
    }).then(() => {
      setIsOpen(true);
    });
  };

  const handleSelectCategory = (categoryId: number, event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation();  
    console.log("Selected Category ID:", categoryId);
    onCategorySelect(categoryId);
  };
  


  return (
    <div className="category-search" ref={wrapperRef}>
      <input
        type="text"
        placeholder="Search for article by category..."
        value={searchTerm}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        onFocus={() => setIsOpen(true)}
        className="form-control"
      />
      {isOpen && (
        <div className="dropdown-menu show">
          {filteredCategories.map((category) => (
            <div key={category.id} className="dropdown-item d-flex justify-content-between align-items-center" onClick={(e) => handleSelectCategory(category.id, e)}>
              {category.name}
              <button onClick={(e) => handleCategoryInfo(category, e)} className="btn btn-info btn-sm">
                i
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategorySearch;
