import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';

// Demo admin credentials
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin123";

const Landing = () => {
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt with:", { email, password });
    setLoginError('');

    // For demo purposes, check if using admin credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Admin login
      console.log("Admin login successful");
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', 'Admin User');
      localStorage.setItem('isAdmin', 'true');
      setIsLoginOpen(false);
      console.log("Navigating to home page as admin");
      
      // Try navigate first, then fallback to direct location change
      try {
        navigate('/');
        // Add a fallback in case navigation doesn't trigger properly
        setTimeout(() => {
          if (window.location.pathname !== '/') {
            console.log("Fallback: forcing page reload");
            window.location.href = '/';
          }
        }, 500);
      } catch (error) {
        console.error("Navigation error:", error);
        window.location.href = '/';
      }
      
      // Show a message with a direct link
      toast({
        title: "Login Successful",
        description: (
          <div>
            <p>If you're not redirected automatically, click <a href="/" className="text-blue-600 underline">here</a> to go to the home page.</p>
          </div>
        ),
        duration: 5000,
      });
      
      return;
    }

    // For demo purposes, accept any non-empty email/password
    if (email && password) {
      console.log("Regular login successful");
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', email.split('@')[0]);
      setIsLoginOpen(false);
      console.log("Navigating to home page as regular user");
      
      // Try navigate first, then fallback to direct location change
      try {
        navigate('/');
        // Add a fallback in case navigation doesn't trigger properly
        setTimeout(() => {
          if (window.location.pathname !== '/') {
            console.log("Fallback: forcing page reload");
            window.location.href = '/';
          }
        }, 500);
      } catch (error) {
        console.error("Navigation error:", error);
        window.location.href = '/';
      }
      
      // Show a message with a direct link
      toast({
        title: "Login Successful",
        description: (
          <div>
            <p>If you're not redirected automatically, click <a href="/" className="text-blue-600 underline">here</a> to go to the home page.</p>
          </div>
        ),
        duration: 5000,
      });
    } else {
      console.log("Login failed: Empty email or password");
      setLoginError('Please enter both email and password');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For demo purposes, accept any non-empty values
    if (name && email && password) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', name);
      setIsLoginOpen(false);
      navigate('/');
    } else {
      setLoginError('Please fill in all fields');
    }
  };

  const handleGuestAccess = () => {
    // Allow users to browse as guests
    console.log("Guest access requested");
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', 'Guest');
    
    // Try navigate first, then fallback to direct location change
    try {
      navigate('/');
      // Add a fallback in case navigation doesn't trigger properly
      setTimeout(() => {
        if (window.location.pathname !== '/') {
          console.log("Fallback: forcing page reload");
          window.location.href = '/';
        }
      }, 500);
    } catch (error) {
      console.error("Navigation error:", error);
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold">BlogHub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setIsLoginOpen(true)}
              >
                Sign in
              </Button>
              <Button 
                onClick={() => setIsLoginOpen(true)}
              >
                Get started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-8 md:p-16 lg:p-24 flex flex-col justify-center">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold mb-6 text-gray-900">
            Human stories & ideas
          </h2>
          <p className="text-xl md:text-2xl text-gray-700 mb-8">
            A place to read, write, and deepen your understanding
          </p>
          <div>
            <Button 
              size="lg" 
              className="px-8 py-6 text-lg"
              onClick={() => setIsLoginOpen(true)}
            >
              Start reading
            </Button>
          </div>
        </div>
        <div className="w-full md:w-1/2 bg-[#4caf50] relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              {/* Decorative elements */}
              <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-[#66bb6a] opacity-80"></div>
              <div className="absolute bottom-1/3 left-1/3 w-32 h-32 rounded-full bg-white opacity-20"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-white opacity-30"></div>
              
              {/* Stars and decorative lines */}
              <div className="absolute top-1/4 right-1/3 text-white text-2xl">*</div>
              <div className="absolute bottom-1/4 right-1/4 text-white text-2xl">*</div>
              <div className="absolute top-1/3 left-1/3 text-white text-2xl">*</div>
              <div className="absolute bottom-1/3 left-1/4 text-white text-2xl">*</div>
              
              {/* Abstract shape */}
              <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-white opacity-20 transform rotate-45"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#faf9f6] py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center text-sm text-gray-500 space-x-6">
            <a href="#" className="hover:text-gray-900">Help</a>
            <a href="#" className="hover:text-gray-900">Status</a>
            <a href="#" className="hover:text-gray-900">About</a>
            <a href="#" className="hover:text-gray-900">Careers</a>
            <a href="#" className="hover:text-gray-900">Press</a>
            <a href="#" className="hover:text-gray-900">Blog</a>
            <a href="#" className="hover:text-gray-900">Privacy</a>
            <a href="#" className="hover:text-gray-900">Terms</a>
            <a href="#" className="hover:text-gray-900">Text to speech</a>
          </div>
        </div>
      </footer>

      {/* Login/Signup Dialog */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">Welcome to BlogHub</DialogTitle>
            <DialogDescription className="text-center">
              Sign in or create an account to continue
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {loginError && (
                    <p className="text-sm text-red-500">{loginError}</p>
                  )}
                  <div className="text-sm text-gray-500">
                    <p>Demo Admin Login:</p>
                    <p>Email: admin@example.com</p>
                    <p>Password: admin123</p>
                  </div>
                  <Button type="submit" className="w-full">Sign In</Button>
                </div>
              </form>
              
              <div className="mt-4 text-center">
                <a href="#" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </a>
              </div>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" type="button">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" type="button">
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                  Facebook
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <Button variant="link" onClick={handleGuestAccess}>
                  Continue as guest
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {loginError && (
                    <p className="text-sm text-red-500">{loginError}</p>
                  )}
                  <Button type="submit" className="w-full">Create Account</Button>
                </div>
              </form>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" type="button">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" type="button">
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                  Facebook
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <Button variant="link" onClick={handleGuestAccess}>
                  Continue as guest
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="sm:justify-center">
            <p className="text-xs text-center text-gray-500">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing; 