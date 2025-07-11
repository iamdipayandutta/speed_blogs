from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from dotenv import load_dotenv
import sqlite3
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///blog.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Models
class Author(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    avatar = db.Column(db.String(500))
    bio = db.Column(db.String(500))
    posts = db.relationship('BlogPost', backref='author', lazy=True)

class BlogPost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.String(500))
    author_id = db.Column(db.Integer, db.ForeignKey('author.id'), nullable=False)
    published_at = db.Column(db.String(10), nullable=False)
    reading_time = db.Column(db.String(20))
    tags = db.Column(db.String(500))  # Store as comma-separated string
    likes = db.Column(db.Integer, default=0)
    comments = db.Column(db.Integer, default=0)
    cover_image = db.Column(db.String(500))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'excerpt': self.excerpt,
            'author': {
                'name': self.author.name,
                'avatar': self.author.avatar,
                'bio': self.author.bio
            },
            'publishedAt': self.published_at,
            'readingTime': self.reading_time,
            'tags': self.tags.split(',') if self.tags else [],
            'likes': self.likes,
            'comments': self.comments,
            'coverImage': self.cover_image
        }

# Create tables
with app.app_context():
    db.create_all()

def init_db():
    db = get_db()
    try:
        # Create posts table
        db.execute('''
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                status TEXT CHECK(status IN ('published', 'draft')) NOT NULL,
                author_id INTEGER,
                date TEXT NOT NULL,
                views INTEGER DEFAULT 0,
                likes INTEGER DEFAULT 0,
                FOREIGN KEY (author_id) REFERENCES authors (id)
            )
        ''')

        # Create authors table
        db.execute('''
            CREATE TABLE IF NOT EXISTS authors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                role TEXT CHECK(role IN ('Editor', 'Writer')) NOT NULL,
                avatar TEXT
            )
        ''')

        # Insert some sample data if tables are empty
        if db.execute('SELECT COUNT(*) FROM authors').fetchone()[0] == 0:
            db.execute('''
                INSERT INTO authors (name, email, role, avatar) VALUES
                ("Dr. Sarah Chen", "sarah@bloghub.com", "Editor", "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"),
                ("Alex Rodriguez", "alex@bloghub.com", "Writer", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"),
                ("Maria Santos", "maria@bloghub.com", "Writer", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face")
            ''')

        if db.execute('SELECT COUNT(*) FROM posts').fetchone()[0] == 0:
            db.execute('''
                INSERT INTO posts (title, content, status, author_id, date, views, likes) VALUES
                ("Advanced Machine Learning with LaTeX Documentation", "Sample content", "published", 1, date('now'), 1250, 142),
                ("Building Scalable React Applications", "Sample content", "draft", 2, date('now'), 0, 0),
                ("The Future of Web Development", "Sample content", "published", 3, date('now', '-5 days'), 890, 67)
            ''')

        db.commit()
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

def get_db():
    db = sqlite3.connect('blog.db')
    db.row_factory = sqlite3.Row
    return db

# Initialize database on startup
init_db()

# Routes
@app.route('/api/posts', methods=['GET'])
def get_posts():
    posts = BlogPost.query.order_by(BlogPost.published_at.desc()).all()
    return jsonify([post.to_dict() for post in posts])

@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    post = BlogPost.query.get_or_404(post_id)
    return jsonify(post.to_dict())

@app.route('/api/posts', methods=['POST'])
def create_post():
    data = request.json

    # Create or get author
    author = Author.query.filter_by(name=data['author']['name']).first()
    if not author:
        author = Author(
            name=data['author']['name'],
            avatar=data['author']['avatar'],
            bio=data['author']['bio']
        )
        db.session.add(author)
        db.session.commit()

    # Create post
    post = BlogPost(
        title=data['title'],
        content=data['content'],
        excerpt=data['excerpt'],
        author_id=author.id,
        published_at=data['publishedAt'],
        reading_time=data['readingTime'],
        tags=','.join(data['tags']),
        likes=data['likes'],
        comments=data['comments'],
        cover_image=data['coverImage']
    )
    db.session.add(post)
    db.session.commit()

    return jsonify(post.to_dict()), 201

@app.route('/api/posts/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    post = BlogPost.query.get_or_404(post_id)
    data = request.json

    # Update post fields
    post.title = data.get('title', post.title)
    post.content = data.get('content', post.content)
    post.excerpt = data.get('excerpt', post.excerpt)
    post.published_at = data.get('publishedAt', post.published_at)
    post.reading_time = data.get('readingTime', post.reading_time)
    post.tags = ','.join(data['tags']) if 'tags' in data else post.tags
    post.cover_image = data.get('coverImage', post.cover_image)

    db.session.commit()
    return jsonify(post.to_dict())

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    post = BlogPost.query.get_or_404(post_id)
    db.session.delete(post)
    db.session.commit()
    return '', 204

@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
def like_post(post_id):
    post = BlogPost.query.get_or_404(post_id)
    post.likes += 1
    db.session.commit()
    return jsonify(post.to_dict())

@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
def add_comment(post_id):
    post = BlogPost.query.get_or_404(post_id)
    post.comments += 1
    db.session.commit()
    return jsonify(post.to_dict())

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    db = get_db()
    try:
        # Get post stats
        post_stats = db.execute('''
            SELECT 
                COUNT(*) as total_posts,
                SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_posts,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_posts
            FROM posts
        ''').fetchone()

        # Get view stats
        view_stats = db.execute('''
            SELECT 
                SUM(views) as total_views,
                SUM(CASE 
                    WHEN date >= date('now', '-30 days') THEN views 
                    ELSE 0 
                END) as monthly_views
            FROM posts
        ''').fetchone()

        # Get like stats
        like_stats = db.execute('''
            SELECT 
                SUM(likes) as total_likes,
                SUM(CASE 
                    WHEN date >= date('now', '-30 days') THEN likes 
                    ELSE 0 
                END) as monthly_likes
            FROM posts
        ''').fetchone()

        return jsonify({
            'totalPosts': post_stats['total_posts'] or 0,
            'publishedPosts': post_stats['published_posts'] or 0,
            'draftPosts': post_stats['draft_posts'] or 0,
            'totalViews': view_stats['total_views'] or 0,
            'monthlyViews': view_stats['monthly_views'] or 0,
            'totalLikes': like_stats['total_likes'] or 0,
            'monthlyLikes': like_stats['monthly_likes'] or 0
        })
    except Exception as e:
        print(f"Error getting dashboard stats: {e}")
        return jsonify({'error': 'Failed to fetch dashboard stats'}), 500
    finally:
        db.close()

@app.route('/api/dashboard/recent-posts', methods=['GET'])
def get_recent_posts():
    db = get_db()
    try:
        posts = db.execute('''
            SELECT 
                p.id,
                p.title,
                p.status,
                a.name as author,
                p.date as publishedAt,
                p.views,
                p.likes
            FROM posts p
            LEFT JOIN authors a ON p.author_id = a.id
            ORDER BY p.date DESC
            LIMIT 5
        ''').fetchall()

        return jsonify([{
            'id': post['id'],
            'title': post['title'],
            'status': post['status'],
            'author': post['author'],
            'publishedAt': post['publishedAt'] if post['status'] == 'published' else None,
            'views': post['views'],
            'likes': post['likes']
        } for post in posts])
    except Exception as e:
        print(f"Error getting recent posts: {e}")
        return jsonify({'error': 'Failed to fetch recent posts'}), 500
    finally:
        db.close()

@app.route('/api/dashboard/authors', methods=['GET'])
def get_authors():
    db = get_db()
    try:
        authors = db.execute('''
            SELECT 
                a.id,
                a.name,
                a.email,
                a.role,
                a.avatar,
                COUNT(p.id) as posts
            FROM authors a
            LEFT JOIN posts p ON p.author_id = a.id
            GROUP BY a.id
        ''').fetchall()

        return jsonify([{
            'id': author['id'],
            'name': author['name'],
            'email': author['email'],
            'role': author['role'],
            'posts': author['posts'],
            'avatar': author['avatar']
        } for author in authors])
    except Exception as e:
        print(f"Error getting authors: {e}")
        return jsonify({'error': 'Failed to fetch authors'}), 500
    finally:
        db.close()

if __name__ == '__main__':
    app.run(debug=True) 