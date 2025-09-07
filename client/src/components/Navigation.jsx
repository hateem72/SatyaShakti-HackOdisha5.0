import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mic, EyeOff, Shield, Menu, X } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/fully-anonymous', label: 'Fully Anonymous', icon: Shield },
    { path: '/anonymous-editor', label: 'Anonymity Editor', icon: EyeOff },
    { path: '/record-fake-voice', label: 'Record Fake Voice', icon: Mic },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/98 shadow-lg backdrop-blur-xl py-3' : 'bg-white/95 py-4 border-b border-teal-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo with improved design */}
            <Link
              to="/"
              className="flex items-center gap-3 group relative"
            >
              <div className="relative">
                <div className="absolute -inset-2 bg-teal-100/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-110"></div>
                <div className="bg-gradient-to-br from-teal-600 to-emerald-600 p-2.5 rounded-xl shadow-lg transform transition-all duration-300 group-hover:scale-105">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700">
                  SatyaShakti
                </span>
                <span className="text-xs text-gray-500 -mt-1 transition-all group-hover:text-teal-600">Power of Truth, Beyond Fear</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1 bg-white rounded-2xl p-1 shadow-lg border border-teal-100">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`relative px-5 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 group overflow-hidden ${location.pathname === path
                    ? 'text-white shadow-inner'
                    : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  {/* Background effect */}
                  <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${location.pathname === path
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 scale-100'
                    : 'bg-transparent group-hover:bg-teal-50 scale-95 group-hover:scale-100'
                    }`}></div>

                  <Icon className={`w-5 h-5 relative z-10 transition-transform duration-300 ${location.pathname === path ? 'scale-110' : 'group-hover:scale-110'
                    }`} />

                  <span className={`relative z-10 font-medium`}>
                    {label}
                  </span>
                </Link>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/fully-anonymous">
                <button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0">
                  Get Started
                </button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2.5 rounded-xl text-teal-700 bg-white shadow-sm border border-teal-200 hover:shadow-md transition-all hover:bg-teal-50"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white/98 backdrop-blur-lg rounded-2xl shadow-2xl border border-teal-100 mx-3 p-3 space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all duration-200 group relative ${location.pathname === path
                  ? 'text-white bg-gradient-to-r from-teal-600 to-emerald-600'
                  : 'text-gray-700 hover:bg-teal-50'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">
                  {label}
                </span>
              </Link>
            ))}

            <div className="pt-3 border-t border-teal-100 mt-2">
              <Link to="/fully-anonymous">
                <button className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-5 py-3.5 rounded-xl font-semibold shadow-lg transition-all duration-300">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Add padding to content so it doesn't hide behind fixed navbar */}
      <div className={`transition-padding duration-300 ${scrolled ? 'h-16' : 'h-20'}`}></div>
    </>
  );
};

export default Navigation;
