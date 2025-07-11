import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Heart, MessageCircle, Share2, ArrowLeft } from 'lucide-react';
import { LaTeXRenderer, LaTeXInitializer } from '@/components/LaTeXRenderer';
import { blogApi, type BlogPost as BlogPostType } from '@/services/api';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setIsLoading(true);
      const fetchedPost = await blogApi.getPost(parseInt(id!));
      setPost(fetchedPost);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch blog post:', err);
      setError('Failed to load blog post. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      const updatedPost = await blogApi.likePost(post.id);
      setPost(updatedPost);
      setIsLiked(true);
      toast({
        title: 'Success',
        description: 'Post liked successfully!',
      });
    } catch (err) {
      console.error('Failed to like post:', err);
      toast({
        title: 'Error',
        description: 'Failed to like post. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleComment = async () => {
    if (!post || !comment.trim()) return;
    try {
      const updatedPost = await blogApi.addComment(post.id, comment);
      setPost(updatedPost);
      setComment('');
      toast({
        title: 'Success',
        description: 'Comment added successfully!',
      });
    } catch (err) {
      console.error('Failed to add comment:', err);
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error || 'Post not found'}</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Cover Image */}
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-[400px] object-cover"
          />

          {/* Content */}
          <div className="p-8">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              {post.title}
            </h1>

            {/* Author Info */}
            <div className="flex items-center mb-8">
              <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={post.author.avatar} />
                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {post.author.name}
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {post.publishedAt}
                    <span className="mx-2">•</span>
                    <Clock className="h-4 w-4 mr-1" />
                    {post.readingTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div
              className="prose dark:prose-invert max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />

            {/* Interactions */}
            <div className="flex items-center justify-between pt-8 border-t">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={isLiked ? 'text-red-500' : ''}
                >
                  <Heart className={`h-5 w-5 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                  {post.likes}
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageCircle className="h-5 w-5 mr-1" />
                  {post.comments}
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-5 w-5 mr-1" />
                  Share
                </Button>
              </div>
            </div>

            {/* Comment Form */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Add a Comment</h3>
              <div className="space-y-4">
                <Textarea
                  placeholder="Write your comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button onClick={handleComment} disabled={!comment.trim()}>
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogPost; 