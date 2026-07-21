import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Menu, X, ChevronDown, User, Shield, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, profile, logout, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  // Close profile dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'PT';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navLinks = isAdmin
    ? [{ path: '/admin', label: 'Admin Dashboard' }]
    : [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/tests', label: 'Tests' },
        { path: '/resume', label: 'Resume' },
        { path: '/certifications', label: 'Certifications' },
        { path: '/skills', label: 'Skills' },
      ];

  // Active link helper function
  const activeClass = ({ isActive }) =>
    `h-full flex items-center px-3 border-b-2 text-sm font-medium transition-colors ${
      isActive
        ? 'border-primary text-primary'
        : 'border-transparent text-text-secondary hover:text-text-primary'
    }`;

  return (
    <nav className="sticky top-0 z-50 h-16 bg-white border-b border-border-default">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left Side: Brand Logo */}
        <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center space-x-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            <span className="text-lg">🎯</span>
          </div>
          <span className="text-lg font-semibold text-text-primary">PrepTracker</span>
        </Link>

        {/* Center Navigation Links (Hidden on Mobile) */}
        <div className="hidden md:flex h-full space-x-2">
          {navLinks.map((link) => (
            <NavLink key={link.path} to={link.path} className={activeClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right Side: Profile dropdown & Mobile Hamburger */}
        <div className="flex items-center space-x-4">
          {/* User Profile Info & Dropdown */}
          {user && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-50 focus:outline-none transition-colors"
              >
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-border-default"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                    {getInitials(profile?.fullName)}
                  </div>
                )}
                <span className="hidden sm:inline text-sm font-medium text-text-primary max-w-[120px] truncate">
                  {profile?.fullName || 'User'}
                </span>
                <ChevronDown className="w-4 h-4 text-text-secondary" />
              </button>

              {/* Profile Dropdown Box */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-border-default rounded-xl shadow-lg py-1 z-50 animate-fadeIn">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 mr-2.5 text-text-secondary" />
                    Profile
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                    >
                      <Shield className="w-4 h-4 mr-2.5 text-text-secondary" />
                      Admin Dashboard
                    </Link>
                  )}

                  <hr className="my-1 border-border-default" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-danger hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 mr-2.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors focus:outline-none"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Slides down) */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-border-default shadow-lg py-4 px-6 z-40 space-y-3 flex flex-col transition-all duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-medium text-text-secondary hover:text-primary py-2 transition-colors border-b border-gray-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
