// src/components/layout/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="border-b border-border bg-white/80 dark:bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ClubHub
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-foreground hover:text-primary">
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-primary/90"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}