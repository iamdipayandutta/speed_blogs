
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import BlogPost from "./pages/BlogPost";
import Landing from "./pages/Landing";

const queryClient = new QueryClient();

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

// Error boundary component to catch rendering errors
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-w-full max-h-[50vh] text-sm">
            {this.state.error && this.state.error.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Auth wrapper component props
interface AuthRouteProps {
  isLoggedIn: boolean;
  element: React.ReactNode;
  redirectTo: string;
}

// Auth wrapper component
const AuthRoute: React.FC<AuthRouteProps> = ({ isLoggedIn, element, redirectTo }) => {
  console.log("AuthRoute rendering with isLoggedIn:", isLoggedIn, "redirectTo:", redirectTo);
  return isLoggedIn ? <>{element}</> : <Navigate to={redirectTo} replace />;
};

// Public route component
const PublicRoute: React.FC<AuthRouteProps> = ({ isLoggedIn, element, redirectTo }) => {
  console.log("PublicRoute rendering with isLoggedIn:", isLoggedIn, "redirectTo:", redirectTo);
  return !isLoggedIn ? <>{element}</> : <Navigate to={redirectTo} replace />;
};

const App = () => {
  // State to track authentication
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = () => {
      try {
        console.log("Checking auth status...");
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        console.log("Auth check - isLoggedIn:", loggedIn);
        setIsLoggedIn(loggedIn);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setAuthError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for storage changes (for when login/logout happens in another tab)
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Authentication Error</p>
          <p>{authError}</p>
        </div>
      </div>
    );
  }

  console.log("Rendering App with auth state:", { isLoggedIn });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              {/* Public route - Landing page */}
              <Route 
                path="/landing" 
                element={<PublicRoute isLoggedIn={isLoggedIn} element={<Landing />} redirectTo="/" />} 
              />
              
              {/* Protected routes - require authentication */}
              <Route 
                path="/" 
                element={<AuthRoute isLoggedIn={isLoggedIn} element={<Index />} redirectTo="/landing" />} 
              />
              <Route 
                path="/admin" 
                element={<AuthRoute isLoggedIn={isLoggedIn} element={<Admin />} redirectTo="/landing" />} 
              />
              <Route 
                path="/blog/:id" 
                element={<AuthRoute isLoggedIn={isLoggedIn} element={<BlogPost />} redirectTo="/landing" />} 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
