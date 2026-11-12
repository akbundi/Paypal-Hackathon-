import React, { useState, useRef, useEffect } from 'react';
import { usePayGuard } from '../../context/PayGuardContext';
import { ActiveTab, Language } from '../../types';
import { APP_CONTAINER_CLASS } from '../../constants/layout';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  Shield,
  LayoutDashboard,
  ScanSearch,
  Receipt,
  CreditCard,
  Users,
  Settings,
  Search,
  Bell,
  Globe,
  Menu,
  ChevronDown,
  Check,
  RotateCcw,
  X,
  Sun,
  Moon,
} from 'lucide-react';

interface TopNavProps {
  onToggleMobileMenu?: () => void;
}

export const TopNav: React.FC<TopNavProps> = () => {
  const {
    activeTab,
    setActiveTab,
    language,
    setLanguage,
    t,
    theme,
    toggleTheme,
    notifications,
    markNotificationRead,
    clearNotifications,
    searchQuery,
    setSearchQuery,
    resetDemoData,
  } = usePayGuard();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (langRef.current && !langRef.current.contains(target)) {
        setIsLangOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: t?.nav?.overview || 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'scam-detection', label: language === 'en' ? 'AI Detection' : t?.nav?.scamDetection, icon: <ScanSearch className="w-4 h-4" /> },
    { id: 'transactions', label: t?.nav?.transactions || 'Transactions', icon: <Receipt className="w-4 h-4" /> },
    { id: 'spending-guard', label: language === 'en' ? 'Spending' : t?.nav?.spendingGuard, icon: <CreditCard className="w-4 h-4" /> },
    { id: 'trusted-circle', label: t?.nav?.trustedCircle || 'Trusted Circle', icon: <Users className="w-4 h-4" /> },
    { id: 'settings', label: t?.nav?.settings || 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const languages: { code: Language; label: string; native: string; flag: string }[] = [
    { code: 'en', label: 'English', native: 'English', flag: '🇺🇸' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0A0F1D]/95 backdrop-blur-md transition-colors duration-200">
      {/* Full-width container strictly matching dashboard (<main>) and footer */}
      <div className={APP_CONTAINER_CLASS}>
        <div className="flex items-center justify-between h-15 gap-1.5 xl:gap-2 w-full min-w-0">
          {/* 1. LEFT: PayGuard logo and Sandbox badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2 focus:outline-none flex-shrink-0 group"
              aria-label="PayGuard Home"
            >
              <div className="w-8.5 h-8.5 rounded-xl bg-slate-950 dark:bg-trust-600 text-white flex items-center justify-center shadow-xs flex-shrink-0 ring-1 ring-slate-800/10 dark:ring-white/10 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="font-bold text-[17px] tracking-tight text-slate-900 dark:text-white">
                PayGuard
              </span>
            </button>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[11px] font-mono font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Sandbox
            </span>
          </div>

          {/* 2. CENTER: Overview, AI Detection, Transactions, Spending, Trusted Circle and Settings */}
          <nav className="hidden xl:flex items-center gap-0.5 2xl:gap-1 flex-shrink-0" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-1.5 py-1.5 2xl:px-2.5 rounded-lg text-[13px] whitespace-nowrap transition-colors duration-150 flex-shrink-0 ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800/90 text-trust-700 dark:text-white font-semibold ring-1 ring-slate-200 dark:ring-slate-700/60 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 font-normal'
                  }`}
                >
                  <span className={isActive ? 'text-trust-600 dark:text-trust-400' : 'text-slate-400 dark:text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 3. RIGHT: Search, Analyze Invoice, Theme, Language, Notifications and Profile */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Search Toggle Button */}
            <div className="relative" ref={searchDropdownRef}>
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-1.5 rounded-lg border transition-colors focus:outline-none flex-shrink-0 ${
                  isSearchOpen || searchQuery
                    ? 'border-trust-500 bg-trust-50 dark:bg-trust-950/40 text-trust-600 dark:text-trust-400'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300'
                }`}
                title="Search records"
                aria-label="Search records"
              >
                <Search className="w-4 h-4" />
              </button>

              {isSearchOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#0D1527] rounded-xl shadow-soft border border-slate-200 dark:border-slate-800 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search transactions, senders, IDs..."
                      className="w-full pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-slate-900 text-[13px] font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg border border-transparent focus:border-trust-500 focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        aria-label="Clear search query"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button: Analyze Invoice */}
            <button
              onClick={() => setActiveTab('scam-detection')}
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1.5 2xl:px-2.5 text-[13px] font-semibold text-white bg-trust-600 hover:bg-trust-700 rounded-lg shadow-xs transition-colors flex-shrink-0"
              title="Analyze Invoice & Payment Request"
            >
              <ScanSearch className="w-4 h-4 text-emerald-300" />
              <span>Analyze Invoice</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 transition-colors focus:outline-none flex-shrink-0"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Dark / Light Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1 px-1.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-[13px] font-medium text-slate-700 dark:text-slate-300 transition-colors flex-shrink-0"
                title="Select Language"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#0D1527] rounded-xl shadow-soft border border-slate-200 dark:border-slate-800 py-1.5 z-50">
                  <div className="px-3 py-1 text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
                    Select Language
                  </div>
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setIsLangOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] font-normal text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-slate-800 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span className="font-medium">{l.native}</span>
                        <span className="text-[11px] text-slate-400">({l.label})</span>
                      </div>
                      {language === l.code && <Check className="w-3.5 h-3.5 text-trust-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 transition-colors flex-shrink-0"
                title="Security Notifications"
                aria-label="Security Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-coral-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#0D1527] rounded-xl shadow-soft border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                        Security Alerts
                      </h4>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 text-[10px] font-medium rounded-md bg-coral-100 text-coral-700 dark:bg-coral-950 dark:text-coral-300">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[12px] font-normal text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-[13px] text-slate-400 font-normal">
                        No active alerts. Sandbox environment running smoothly.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            markNotificationRead(item.id);
                            if (item.actionPath) {
                              setActiveTab(item.actionPath as any);
                              setIsNotifOpen(false);
                            }
                          }}
                          className={`p-3.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-start gap-3 ${
                            !item.read ? 'bg-trust-50/50 dark:bg-trust-950/20' : ''
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              item.type === 'alert'
                                ? 'bg-coral-500'
                                : item.type === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[13px] text-slate-900 dark:text-slate-100 leading-tight">
                              {item.title}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-[12px] font-normal mt-0.5 leading-snug">
                              {item.message}
                            </p>
                            <span className="text-[11px] text-slate-400 mt-1 inline-block font-mono">
                              {item.timestamp}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-1 pl-1 pr-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex-shrink-0"
                aria-label="User profile"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-trust-600 text-white flex items-center justify-center font-bold text-[12px] flex-shrink-0 shadow-xs">
                  PG
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#0D1527] rounded-xl shadow-soft border border-slate-200 dark:border-slate-800 py-1.5 z-50">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">PayGuard User</p>
                    <p className="text-[12px] text-slate-400 font-mono truncate">user@sandbox.payguard</p>
                    <div className="mt-2 text-[11px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                      Env: PayPal Sandbox REST v2
                    </div>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[13px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-normal flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Security Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('trusted-circle');
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[13px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-normal flex items-center gap-2 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Trusted Contacts</span>
                    </button>
                    <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsResetConfirmOpen(true);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-[13px] text-coral-600 dark:text-coral-400 hover:bg-coral-50 dark:hover:bg-coral-950/40 rounded-lg font-normal flex items-center gap-2 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-coral-500" />
                        <span>Reset Sandbox Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile / Tablet Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 xl:hidden flex-shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 py-3 space-y-2.5">
            {/* Primary Action in Mobile Menu: Analyze Invoice */}
            <button
              onClick={() => {
                setActiveTab('scam-detection');
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[13px] font-medium text-white bg-trust-600 hover:bg-trust-700 rounded-lg shadow-xs transition-colors"
            >
              <ScanSearch className="w-4 h-4 text-emerald-300" />
              <span>Analyze Invoice & Payment Request</span>
            </button>

            {/* Search Input in Mobile Drawer */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions, rules, or alerts..."
                className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-slate-900 text-[13px] font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg border border-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Navigation Links in Mobile Menu */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] transition-colors text-left min-w-0 ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-normal'
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Reset Demo Data */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Reset Sandbox Data"
        subtitle="Restore baseline demo state"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-[14px] font-normal text-slate-600 dark:text-slate-300 leading-relaxed">
            This will reset transactions, spending limits, and contacts to their initial demo configuration in this browser.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsResetConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                resetDemoData();
                setIsResetConfirmOpen(false);
              }}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset Data
            </Button>
          </div>
        </div>
      </Modal>
    </header>
  );
};
