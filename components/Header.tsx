import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './ui/Icon.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Card } from './ui/Card.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';
import { AboutModal } from './AboutModal.tsx';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onReplayTour: () => void;
  onReset: () => void;
}

interface MenuItem {
    id?: string;
    label: string;
    icon: string;
    action: () => void;
}

const getInitials = (name?: string): string => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const Header: React.FC<HeaderProps> = ({ isDarkMode, onToggleDarkMode, onOpenHelp, onOpenSettings, onReplayTour, onReset }) => {
  const { t } = useTranslation(['common']);
  const { user, graphData, logout, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Build menu items array, conditionally including settings for admin users only
  const menuItems: MenuItem[] = [
    { label: t('common:header.menu.toggleTheme'), icon: isDarkMode ? 'sun' : 'moon', action: onToggleDarkMode },
    { id: 'replay-tutorial-button', label: t('common:header.menu.replayTutorial'), icon: 'sparkles', action: onReplayTour },
    { label: t('common:header.menu.help'), icon: 'help', action: onOpenHelp },
    { label: t('common:header.menu.resetData'), icon: 'refresh', action: onReset },
    // Settings is only available to admin users
    ...(isAdmin ? [{ label: t('common:header.menu.settings'), icon: 'settings', action: onOpenSettings }] : []),
  ];

  return (
    <>
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
             <Icon name="logo" className="h-10 w-10 text-primary flex-shrink-0"/>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Meeting Notes Generator</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500 text-white">Beta</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">Drive consistency and impact in every meeting.</p>
            </div>
          </div>
          <div id="user-profile-menu" className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900 transition-colors"
              aria-label="Open user menu"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
            >
                <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{graphData?.displayName || user?.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{graphData?.jobTitle || graphData?.mail || user?.username}</span>
                </div>
              {graphData?.photoUrl ? (
                <img src={graphData.photoUrl} alt="User profile" className="h-9 w-9 rounded-full" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {getInitials(graphData?.displayName || user?.name)}
                </div>
              )}
            </button>
            {isMenuOpen && (
              <div ref={menuRef} className="absolute right-0 mt-2 w-64 origin-top-right z-50 animate-fade-in">
                <Card className="p-1.5">
                  <div className="py-1">
                    {/* Toggle Theme */}
                    <button key={menuItems[0].label} id={menuItems[0].id} onClick={() => { menuItems[0].action(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50">
                      <Icon name={menuItems[0].icon} className="h-5 w-5 text-slate-500 dark:text-slate-400"/>
                      <span>{menuItems[0].label}</span>
                    </button>
                    {/* Language Selector - inserted between Toggle Theme and Replay Tutorial */}
                    <LanguageSelector variant="menu" />
                    {/* Remaining menu items */}
                    {menuItems.slice(1).map(item => (
                       <button key={item.label} id={item.id} onClick={() => { item.action(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50">
                          <Icon name={item.icon} className="h-5 w-5 text-slate-500 dark:text-slate-400"/>
                          <span>{item.label}</span>
                       </button>
                    ))}
                  </div>
                  <div className="my-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                  <div className="py-1">
                     <button onClick={() => { setShowAbout(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50">
                        <Icon name="info" className="h-5 w-5 text-slate-500 dark:text-slate-400"/>
                        <span>{t('common:header.menu.about')}</span>
                     </button>
                  </div>
                  <div className="my-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                  <div className="py-1">
                     <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Icon name="logout" className="h-5 w-5"/>
                        <span>{t('common:header.menu.signOut')}</span>
                     </button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    {/* About Modal - rendered outside header */}
    {showAbout && <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} user={user} graphData={graphData} />}
    </>
  );
};
