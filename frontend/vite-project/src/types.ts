export interface Article {
    id: number;
    title: string;
    authors: string[]; // Ak backend posiela pole mien autorov ako reťazce
    category: number | string| Category;
    categories: Category[]; // Pridané pre podporu viacerých kategórií
    keywords: string[];
    content: string;
    pdf_file: string;
    added_by_id: number;
    created_at: string;
    tag: string;
  }

  export interface Category {
    id: number; // alebo number
    name: string;
  }
  
  export interface Tag {
    id: string; // alebo number
    name: string;
  }
  
  export interface Keyword {
    id: string; // alebo number
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
  