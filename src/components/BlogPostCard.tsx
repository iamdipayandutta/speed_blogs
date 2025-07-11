
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Author {
  name: string;
  avatar: string;
  bio: string;
}

interface BlogPost {
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
}

interface BlogPostCardProps {
  post: BlogPost;
  featured?: boolean;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post, featured = false }) => {
  const navigate = useNavigate();

  // If post is undefined, return null or a placeholder
  if (!post) {
    return null;
  }

  const handleNavigateToBlogPost = () => {
    navigate(`/blog/${post.id}`);
  };

  // Use a placeholder image if coverImage is undefined
  const coverImage = post.coverImage || '/placeholder.svg';

  if (featured) {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={handleNavigateToBlogPost}>
        <div className="md:flex">
          <div className="md:w-1/2">
            <img
              src={coverImage}
              alt={post.title}
              className="w-full h-64 md:h-full object-cover"
            />
          </div>
          <div className="md:w-1/2 p-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
            
            <h2 className="text-2xl font-bold mb-4 hover:text-primary transition-colors">
              {post.title}
            </h2>
            
            <p className="text-muted-foreground mb-6">
              {post.excerpt}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author?.avatar} />
                  <AvatarFallback>{post.author?.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{post.author?.name || 'Anonymous'}</p>
                  <div className="flex items-center text-sm text-muted-foreground space-x-4">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {post.publishedAt}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {post.readingTime}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-muted-foreground">
                <span className="flex items-center">
                  <Heart className="h-4 w-4 mr-1" />
                  {post.likes || 0}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {post.comments || 0}
                </span>
                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer" onClick={handleNavigateToBlogPost}>
      <div className="aspect-video overflow-hidden">
        <img
          src={coverImage}
          alt={post.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <CardHeader>
        <div className="flex flex-wrap gap-2 mb-2">
          {post.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
          ))}
        </div>
        
        <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
          {post.title}
        </CardTitle>
        
        <CardDescription className="line-clamp-3">
          {post.excerpt}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.author?.avatar} />
              <AvatarFallback>{post.author?.name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{post.author?.name || 'Anonymous'}</p>
              <div className="flex items-center text-xs text-muted-foreground space-x-2">
                <span>{post.publishedAt}</span>
                <span>•</span>
                <span>{post.readingTime}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-sm text-muted-foreground">
            <span className="flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              {post.likes || 0}
            </span>
            <span className="flex items-center">
              <MessageCircle className="h-3 w-3 mr-1" />
              {post.comments || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogPostCard;
