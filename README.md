# Speedo Blogs

A modern blog platform built with React and Flask, featuring a beautiful UI and rich text editing capabilities.

## Features

- 🎨 Modern and responsive UI
- 📝 Rich text editor with LaTeX support
- 🏷️ Tag-based categorization
- 👥 Multi-author support
- ❤️ Like and comment functionality
- 📊 Reading time estimation
- 🌓 Dark mode support

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Shadcn UI components
- React Router for navigation
- Axios for API calls

### Backend
- Flask for the REST API
- SQLite for database
- SQLAlchemy as ORM
- Flask-CORS for cross-origin support

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/speedo-blogs.git
   cd speedo-blogs
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   python app.py
   ```
   The backend will run on http://localhost:5000

2. In a new terminal, start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend will run on http://localhost:5173

## Project Structure

```
speedo-blogs/
├── backend/
│   ├── app.py
│   └── requirements.txt
├── src/
│   ├── components/
│   │   ├── BlogPostCard.tsx
│   │   ├── LaTeXRenderer.tsx
│   │   ├── RichTextEditor.tsx
│   │   └── ui/
│   ├── pages/
│   │   ├── Admin.tsx
│   │   ├── BlogPost.tsx
│   │   └── Index.tsx
│   └── services/
│       └── api.ts
└── public/
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
