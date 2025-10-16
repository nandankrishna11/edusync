/**
 * Modern Main Layout Component
 */
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar />
      <Header />
      <main className="ml-64 pt-20 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;