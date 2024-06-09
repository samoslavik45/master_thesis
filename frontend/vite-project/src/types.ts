export interface Article {
    id: number;
    title: string;
    authors: string[]; 
    category: number | string| Category;
    categories: Category[]; 
    keywords: string[];
    content: string;
    pdf_file: string;
    added_by_id: number;
    created_at: string;
    tag: string;
  }

  export interface Category {
    id: number; 
    name: string;
    description: string;
  }
  
  export interface Tag {
    id: string; 
    name: string;
  }
  
  export interface Keyword {
    id: string; 
    name: string;
  }
  export interface EditedKeyword {
    id: string;
    value: string;
    selected: boolean;
  }
  export interface Author {
    id: number;
    name: string;
}
  