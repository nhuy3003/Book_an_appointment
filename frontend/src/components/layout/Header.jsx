import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi';

const navLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/doctors', label: 'Chuyên khoa' },
  { to: '/tra-cuu', label: 'Tra cứu lịch hẹn' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const linkClasses = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'text-blue-600'
        : 'text-gray-700 hover:text-blue-600'
    }`;

  const mobileLinkClasses = ({ isActive }) =>
    `block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'text-blue-600 bg-blue-50'
        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <svg
              className="h-8 w-8 text-blue-600"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="32" height="32" rx="8" fill="currentColor" />
              <path
                d="M16 7C16 7 10 13 10 18a6 6 0 0 0 12 0c0-5-6-11-6-11z"
                fill="white"
                opacity="0.3"
              />
              <rect x="14" y="10" width="4" height="12" rx="1" fill="white" />
              <rect x="10" y="14" width="12" height="4" rx="1" fill="white" />
            </svg>
            <span className="text-xl font-bold text-gray-900">
              Med<span className="text-blue-600">Booking</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClasses}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Side */}
          <div className="hidden items-center gap-4 md:flex">
            <a
              href="#"
              className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-600 hover:text-white"
            >
              Dành cho Bác sĩ
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <HiX className="h-6 w-6" />
            ) : (
              <HiMenu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={mobileLinkClasses}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 border-t border-gray-100 pt-3">
            <a
              href="#"
              className="block rounded-lg border border-blue-600 px-4 py-3 text-center text-sm font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-600 hover:text-white"
            >
              Dành cho Bác sĩ
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
