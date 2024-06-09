import React, { useState, useEffect } from 'react'; 
import {useLocation } from 'react-router-dom';
import {Form, FormControl, Button } from 'react-bootstrap';
import SearchComponent from './SearchComponent';
import axios from 'axios';
import ArticlesList from './ArticlesList';
import { Article, Category } from './types'; 
import CategorySearch from './CategorySearch'; 


interface MainContentProps {
    setIsLoggedIn: (value: boolean) => void;
  }

interface MainContentProps {
      setIsLoggedIn: (value: boolean) => void;
  }

  const MainContent: React.FC<MainContentProps> = ({ setIsLoggedIn }) => {
    const [articles, setArticles] = useState<Article[]>([]); 
    const [groups, setGroups] = useState<Array<{ id: number; name: string }>>([])
    const [isLoggedIn, setIsLoggedInState] = useState<boolean>(false); 
    const [categories, setCategories] = useState<Category[]>([]);
    const [isArticleListExpanded, setIsArticleListExpanded] = useState(false);
    const [keywords, setKeywords] = useState([]);



    let location = useLocation();

    useEffect(() => {
      const accessToken = localStorage.getItem('accessToken');
      setIsLoggedInState(!!accessToken); 

      if (accessToken) {
        const fetchGroups = async () => {
          try {
            const response = await fetch('http://localhost:8000/api/groups/', {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            });
            if (!response.ok) {
              throw new Error('Problém pri načítaní skupín.');
            }
            const data = await response.json();
            setGroups(data); 
          } catch (error) {
            console.error(error);
          }
        };
  
        fetchGroups();
      const fetchCategories = async () => {
        console.log("som tu");
        const accessToken = localStorage.getItem('accessToken');
        try {
          const response = await fetch('http://localhost:8000/api/categories/', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          if (!response.ok) {
            throw new Error('Problém pri načítaní kategórií.');
          }
          const data = await response.json();
          console.log('Načítané kategórie:', data); 
          setCategories(data); 
        } catch (error) {
          console.error(error);
        }
      };
      fetchCategories();
    }
    }, []);

    
  
    const handleSearch = async (query: string) => {
      const accessToken = localStorage.getItem('accessToken');
      const config = accessToken ? {
        headers: { Authorization: `Bearer ${accessToken}` }
      } : {};
      try {
        const response = await axios.get(`http://localhost:8000/main/search_articles/?q=${query}`, config);
        setArticles(response.data.articles);
      } catch (error) {
        console.error("Chyba pri vyhľadávaní:", error);
      }
    };
    
const handleCategorySearch = async (categoryId: number) => {
  try {
    const response = await axios.get(`http://localhost:8000/api/articles/by_category/${categoryId}/`);
    if (response.status === 200) {
      console.log("Articles loaded for category:", categoryId, response.data);
      setArticles(response.data);  
    } else {
      console.error("Failed to fetch articles for category:", categoryId, response);
    }
  } catch (error) {
    console.error("Error fetching articles by category:", categoryId, error);
  }
};

    
  
  
    return (
      <>
        {location.pathname === '/' && (
          <>
            <div className="intro-text"> {/**/}
              <h1>Article searching database</h1>
              <p>Find the best articles on various topics right here.</p>
            </div>
            <SearchComponent onSearch={handleSearch} />
            <CategorySearch onCategorySelect={handleCategorySearch} />
            <ArticlesList articles={articles} isLoggedIn={isLoggedIn} groups={groups} categories={categories} />
          </>
        )}
      </>
    );
};

export default MainContent;
