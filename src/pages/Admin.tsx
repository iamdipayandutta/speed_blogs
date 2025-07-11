import React, { useState, useEffect, ErrorInfo, Component } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PenTool, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Calendar,
  Clock,
  BookOpen,
  Filter,
  MoreHorizontal,
  Save
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import RichTextEditor from '@/components/RichTextEditor';
import SimpleEditor from '@/components/SimpleEditor';
import WordLikeEditor from '@/components/WordLikeEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { blogApi, type BlogPost, type DashboardStats, type RecentPost, type Author } from '@/services/api';
import { toast } from '@/components/ui/use-toast';

// Add interface for user settings
interface UserSettings {
  displayName: string;
  email: string;
  bio: string;
  notifications: {
    comments: boolean;
    likes: boolean;
    follows: boolean;
  };
}

// Error boundary component to catch errors in the editor
class ErrorBoundary extends Component<{ children: React.ReactNode, fallback?: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode, fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Component error caught:", error);
    console.error("Component stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <h3 className="font-bold mb-2">Something went wrong</h3>
          <p className="text-sm">{this.state.error?.message || 'Unknown error'}</p>
          <button 
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const Admin = () => {
  console.log("Admin component rendering");
  
  const [activeTab, setActiveTab] = useState('new-post');
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postTags, setPostTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    displayName: '',
    email: '',
    bio: '',
    notifications: {
      comments: false,
      likes: false,
      follows: false,
    }
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
    monthlyViews: 0,
    totalLikes: 0,
    monthlyLikes: 0
  });
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = () => {
      // For now, we'll load from localStorage. In a real app, this would come from an API
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    };
    loadSettings();
  }, []);

  // Handle settings changes
  const handleSettingChange = (field: keyof Omit<UserSettings, 'notifications'>, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field: keyof UserSettings['notifications']) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: !prev.notifications[field]
      }
    }));
  };

  const handleSaveSettings = () => {
    // In a real app, this would be an API call
    localStorage.setItem('userSettings', JSON.stringify(settings));
    toast({
      title: 'Success',
      description: 'Settings saved successfully!',
    });
  };

  useEffect(() => {
    console.log("Admin component mounted");
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const fetchedPosts = await blogApi.getAllPosts();
      setPosts(fetchedPosts);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePost = async (publish = false) => {
    if (!postTitle.trim() || !postContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both title and content.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const newPost: Omit<BlogPost, 'id'> = {
        title: postTitle,
        content: postContent,
        excerpt: postContent.substring(0, 150) + '...',
        author: {
          name: localStorage.getItem('userName') || 'Anonymous',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
          bio: 'Author',
        },
        publishedAt: new Date().toISOString().split('T')[0],
        readingTime: Math.ceil(postContent.split(' ').length / 200) + ' min read',
        tags: postTags,
        likes: 0,
        comments: 0,
        coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop',
      };

      const savedPost = await blogApi.createPost(newPost);
      toast({
        title: 'Success',
        description: publish ? 'Post published successfully!' : 'Draft saved successfully!',
      });

      // Reset form
      setPostTitle('');
      setPostContent('');
      setPostTags([]);

      // Refresh posts list
      fetchPosts();

      // Switch to posts tab
      setActiveTab('posts');
    } catch (err) {
      console.error('Failed to save post:', err);
      toast({
        title: 'Error',
        description: 'Failed to save post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    try {
      await blogApi.deletePost(id);
      toast({
        title: 'Success',
        description: 'Post deleted successfully!',
      });
      fetchPosts();
    } catch (err) {
      console.error('Failed to delete post:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete post. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleTagSelect = (tag: string) => {
    if (!postTags.includes(tag)) {
      setPostTags([...postTags, tag]);
    }
  };

  const handleTagRemove = (tag: string) => {
    setPostTags(postTags.filter(t => t !== tag));
  };

  // Log when tab changes
  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
  }, [activeTab]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (activeTab !== 'dashboard') return;
      
      setIsDashboardLoading(true);
      setDashboardError(null);
      
      try {
        const [stats, posts, authorsList] = await Promise.all([
          blogApi.getDashboardStats(),
          blogApi.getRecentPosts(),
          blogApi.getAuthors()
        ]);
        
        setDashboardStats(stats);
        setRecentPosts(posts);
        setAuthors(authorsList);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setDashboardError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsDashboardLoading(false);
      }
    };

    loadDashboardData();
  }, [activeTab]);

  // Mock data
  const userStats = {
    totalPosts: 47,
    publishedPosts: 32,
    draftPosts: 15,
    totalViews: 12500,
    monthlyViews: 3200,
    totalLikes: 890
  };

  const categories = [
    "Technology",
    "Science",
    "Mathematics",
    "Programming",
    "Machine Learning",
    "Web Development",
    "Data Science",
    "Artificial Intelligence"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                BlogHub Admin
              </h1>
              <Badge variant="secondary">Admin Panel</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <a href="/">View Site</a>
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
                <AvatarFallback>AR</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-6">
            <div className="space-y-2">
              <Button
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('dashboard')}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              
              <Button
                variant={activeTab === 'posts' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('posts')}
              >
                <FileText className="mr-2 h-4 w-4" />
                All Posts
              </Button>
              
              <Button
                variant={activeTab === 'new-post' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('new-post')}
              >
                <PenTool className="mr-2 h-4 w-4" />
                Write New Post
              </Button>
              
              <Button
                variant={activeTab === 'authors' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('authors')}
              >
                <Users className="mr-2 h-4 w-4" />
                Authors
              </Button>
              
              <Button
                variant={activeTab === 'guide' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('guide')}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Formatting Guide
              </Button>
              
              <Button
                variant={activeTab === 'settings' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
                <p className="text-gray-600">Overview of your blog's performance and activity</p>
              </div>

              {dashboardError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                  {dashboardError}
                </div>
              )}

              {isDashboardLoading ? (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="h-24 bg-gray-100 animate-pulse rounded-md" />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.totalPosts}</div>
                        <p className="text-xs text-muted-foreground">
                          {dashboardStats.publishedPosts} published, {dashboardStats.draftPosts} drafts
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.totalViews.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          {dashboardStats.monthlyViews.toLocaleString()} this month
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                        <div className="h-4 w-4 text-red-500">♥</div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.totalLikes}</div>
                        <p className="text-xs text-muted-foreground">
                          {dashboardStats.monthlyLikes} this month
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Authors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{authors.length}</div>
                        <p className="text-xs text-muted-foreground">
                          Active contributors
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Posts */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Posts</CardTitle>
                      <CardDescription>Your latest articles and their performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentPosts.map((post) => (
                          <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{post.title}</h4>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>By {post.author}</span>
                                <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                  {post.status}
                                </Badge>
                                {post.publishedAt && (
                                  <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {post.publishedAt}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Eye className="h-4 w-4 mr-1" />
                                {post.views}
                              </span>
                              <span className="flex items-center">
                                <div className="h-4 w-4 text-red-500 mr-1">♥</div>
                                {post.likes}
                              </span>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* All Posts */}
          {activeTab === 'posts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">All Posts</h2>
                  <p className="text-gray-600">Manage all blog posts from all authors</p>
                </div>
                <Button onClick={() => setActiveTab('new-post')}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input placeholder="Search posts..." className="pl-10" />
                    </div>
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Posts Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {recentPosts.map((post, index) => (
                      <div key={post.id} className={`p-6 ${index !== recentPosts.length - 1 ? 'border-b' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">{post.title}</h4>
                              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                {post.status}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>By {post.author}</span>
                              {post.publishedAt && (
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {post.publishedAt}
                                </span>
                              )}
                              <span className="flex items-center">
                                <Eye className="h-3 w-3 mr-1" />
                                {post.views} views
                              </span>
                              <span className="flex items-center">
                                <div className="h-3 w-3 text-red-500 mr-1">♥</div>
                                {post.likes} likes
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* New Post Editor */}
          {activeTab === 'new-post' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Write New Post</h2>
                <p className="text-gray-600">Create a new blog post</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Write New Post</CardTitle>
                  <CardDescription>Create a new blog post</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        placeholder="Enter post title"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Tags</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {postTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => handleTagRemove(tag)}
                          >
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                      <Select onValueChange={handleTagSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tags" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category}
                              value={category}
                              disabled={postTags.includes(category)}
                            >
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Content</label>
                      <ErrorBoundary>
                        <RichTextEditor
                          value={postContent}
                          onChange={setPostContent}
                        />
                      </ErrorBoundary>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handleSavePost(false)}
                        disabled={isSaving}
                      >
                        Save as Draft
                      </Button>
                      <Button
                        onClick={() => handleSavePost(true)}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Publishing...' : 'Publish'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Authors Management */}
          {activeTab === 'authors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Authors</h2>
                  <p className="text-gray-600">Manage contributors and their permissions</p>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Author
                </Button>
              </div>

              <div className="grid gap-6">
                {authors.map((author) => (
                  <Card key={author.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={author.avatar} />
                            <AvatarFallback>{author.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-gray-900">{author.name}</h4>
                            <p className="text-gray-500">{author.email}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <Badge variant={author.role === 'Editor' ? 'default' : 'secondary'}>
                                {author.role}
                              </Badge>
                              <span className="text-sm text-gray-500">{author.posts} posts</span>
                            </div>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                            <DropdownMenuItem>Change Role</DropdownMenuItem>
                            <DropdownMenuItem>View Posts</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Remove Access</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Formatting Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Formatting Guide</h2>
                <p className="text-gray-600">Learn how to format your posts with Markdown and LaTeX</p>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>MS Word-like Editor</CardTitle>
                    <CardDescription>Our advanced editor provides a familiar Microsoft Word experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>The Word-like editor offers professional document editing capabilities:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Rich Text Formatting:</strong> Bold, italic, underline, font family, font size, text color, and highlighting</li>
                      <li><strong>Paragraph Styling:</strong> Left, center, right, and justify alignment options</li>
                      <li><strong>Lists:</strong> Bulleted and numbered lists with indentation control</li>
                      <li><strong>Media:</strong> Image insertion with positioning options (left, right, center, inline)</li>
                      <li><strong>Links:</strong> Insert and edit hyperlinks with custom text</li>
                      <li><strong>Mathematics:</strong> LaTeX equations for both inline and block math formulas</li>
                      <li><strong>Layout:</strong> Full-screen editing mode and preview capabilities</li>
                      <li><strong>History:</strong> Undo/redo functionality for all changes</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>LaTeX Math Support</CardTitle>
                    <CardDescription>Professional mathematical notation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Inline Math</h4>
                      <code className="text-sm bg-gray-100 p-2 rounded block mb-2">
                        {'\\(x^2 + y^2 = z^2\\)'}
                      </code>
                      <p className="text-sm text-gray-600">Renders as an inline equation within your text.</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Block Math</h4>
                      <code className="text-sm bg-gray-100 p-2 rounded block mb-2">
                        {'\\[\\sum\\limits_{i=1}^{n} i = \\frac{n(n+1)}{2}\\]'}
                      </code>
                      <p className="text-sm text-gray-600">Renders as a centered block equation with proper spacing.</p>
                    </div>
                    
                    <p>Click the "LaTeX" button in the toolbar to easily insert math formulas.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Image Positioning</CardTitle>
                    <CardDescription>Control how images appear in your posts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>Our Word-like editor provides professional image handling:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Inline:</strong> Images flow with the text (default)</li>
                      <li><strong>Left aligned:</strong> Text wraps around the right side of the image</li>
                      <li><strong>Center aligned:</strong> Image is centered with text above and below</li>
                      <li><strong>Right aligned:</strong> Text wraps around the left side of the image</li>
                      <li><strong>Alt text:</strong> Add descriptive text for accessibility and SEO</li>
                    </ul>
                    <p className="text-sm text-gray-600">Click the "Image" button in the toolbar to insert and position images.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Auto-Save Feature</CardTitle>
                    <CardDescription>Never lose your work with automatic saving</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>The WordLikeEditor includes an advanced auto-save feature:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Automatic Saving:</strong> Content is saved automatically as you type</li>
                      <li><strong>Save Indicators:</strong> Visual indicators show when content is being saved</li>
                      <li><strong>Local Storage:</strong> Drafts are stored locally in case of browser crashes</li>
                      <li><strong>Version History:</strong> Access previous versions of your content</li>
                    </ul>
                    <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-2">
                      <p className="text-sm text-yellow-800 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                        </svg>
                        You can still manually save using the "Save Draft" button for important checkpoints.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Settings</h2>
                <p className="text-gray-600">Configure your blog preferences</p>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>Manage your author profile</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Display Name</label>
                        <Input 
                          placeholder="Your name" 
                          value={settings.displayName}
                          onChange={(e) => handleSettingChange('displayName', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Email</label>
                        <Input 
                          placeholder="your@email.com" 
                          type="email" 
                          value={settings.email}
                          onChange={(e) => handleSettingChange('email', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Bio</label>
                      <Input 
                        placeholder="Tell readers about yourself..." 
                        value={settings.bio}
                        onChange={(e) => handleSettingChange('bio', e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSaveSettings} className="mt-4">
                      Save Profile
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>Choose what updates you receive</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="comments" 
                        className="rounded"
                        checked={settings.notifications.comments}
                        onChange={() => handleNotificationChange('comments')}
                      />
                      <label htmlFor="comments" className="text-sm">Email me when someone comments on my posts</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="likes" 
                        className="rounded"
                        checked={settings.notifications.likes}
                        onChange={() => handleNotificationChange('likes')}
                      />
                      <label htmlFor="likes" className="text-sm">Email me when someone likes my posts</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="follows" 
                        className="rounded"
                        checked={settings.notifications.follows}
                        onChange={() => handleNotificationChange('follows')}
                      />
                      <label htmlFor="follows" className="text-sm">Email me when someone follows me</label>
                    </div>
                    <Button onClick={handleSaveSettings} className="mt-4">
                      Save Notification Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin;
