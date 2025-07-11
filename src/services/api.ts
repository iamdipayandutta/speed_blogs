import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export interface Author {
  id: number;
  name: string;
  email: string;
  role: 'Editor' | 'Writer';
  posts: number;
  avatar: string;
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  author: Author;
  publishedAt: string;
  readingTime: string;
  tags: string[];
  likes: number;
  comments: number;
  coverImage: string;
  content?: string;
}

export interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  monthlyViews: number;
  totalLikes: number;
  monthlyLikes: number;
}

export interface RecentPost {
  id: number;
  title: string;
  status: 'published' | 'draft';
  author: string;
  publishedAt: string | null;
  views: number;
  likes: number;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const blogApi = {
  // Get all blog posts
  getAllPosts: async (): Promise<BlogPost[]> => {
    const response = await api.get('/posts');
    return response.data;
  },

  // Get a single blog post by ID
  getPost: async (id: number): Promise<BlogPost> => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  // Create a new blog post
  createPost: async (post: Omit<BlogPost, 'id'>): Promise<BlogPost> => {
    const response = await api.post('/posts', post);
    return response.data;
  },

  // Update a blog post
  updatePost: async (id: number, post: Partial<BlogPost>): Promise<BlogPost> => {
    const response = await api.put(`/posts/${id}`, post);
    return response.data;
  },

  // Delete a blog post
  deletePost: async (id: number): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },

  // Like a blog post
  likePost: async (id: number): Promise<BlogPost> => {
    const response = await api.post(`/posts/${id}/like`);
    return response.data;
  },

  // Add a comment to a blog post
  addComment: async (id: number, comment: string): Promise<BlogPost> => {
    const response = await api.post(`/posts/${id}/comments`, { content: comment });
    return response.data;
  },

  // Get all comments for a blog post
  getComments: async (id: number): Promise<Comment[]> => {
    const response = await api.get(`/posts/${id}/comments`);
    return response.data;
  },

  // Dashboard endpoints
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await fetch('/api/dashboard/stats');
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  getRecentPosts: async (): Promise<RecentPost[]> => {
    const response = await fetch('/api/dashboard/recent-posts');
    if (!response.ok) throw new Error('Failed to fetch recent posts');
    return response.json();
  },

  getAuthors: async (): Promise<Author[]> => {
    const response = await fetch('/api/dashboard/authors');
    if (!response.ok) throw new Error('Failed to fetch authors');
    return response.json();
  }
};

export default blogApi; 