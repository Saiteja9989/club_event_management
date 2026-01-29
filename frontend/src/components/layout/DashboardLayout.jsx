// src/components/layout/DashboardLayout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/button';

export default function DashboardLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header with Toggle */}
        <header className="border-b border-border bg-card sticky top-0 z-40 md:hidden">
          <div className="flex h-16 items-center px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <h1 className="text-xl font-semibold text-foreground flex-1">{title || 'Dashboard'}</h1>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="border-b border-border bg-card sticky top-0 z-40 hidden md:block">
          <div className="flex h-16 items-center px-6">
            <h1 className="text-xl font-semibold text-foreground">{title || 'Dashboard'}</h1>
            <div className="ml-auto flex items-center gap-4">
              {/* Add user avatar/notifications here later */}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}