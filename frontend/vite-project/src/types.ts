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
    search_rank?: number;
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

export interface RecommendedArticle extends Article {
  score?: number;
}
  
export interface GroupMemberLite {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
}

export interface GroupChatArticleRef {
  id: number;
  title: string;
}

export interface GroupMessage {
  id: number;
  group: number;
  user: number;
  author_name: string;
  article: number | null;
  article_title: string | null;
  parent_id: number | null;
  parent_preview: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  can_delete: boolean;
  mentioned_user_ids: number[];
  mentioned_usernames: string[];
  replies_count: number;
}

export type FullTextMode = "phrase" | "intelligent";

export interface GroupNotification {
  id: number;
  notification_type: "mention";
  is_read: boolean;
  created_at: string;
  group: number;
  group_name: string;
  message: number;
  message_content: string;
  sender: number;
  sender_name: string;
}