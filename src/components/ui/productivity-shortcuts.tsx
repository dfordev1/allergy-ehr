import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Zap, 
  Calendar, 
  User, 
  Plus, 
  Settings, 
  BarChart3,
  Keyboard,
  Command as CommandIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Shortcut {
  id: string;
  label: string;
  description: string;
  keys: string[];
  action: () => void;
  category: 'navigation' | 'booking' | 'patient' | 'general';
  icon: React.ReactNode;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
  keywords: string[];
}

export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl/Cmd + key combinations
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const isAlt = event.altKey;

      shortcuts.forEach(shortcut => {
        const keys = shortcut.keys;
        let matches = true;

        // Check if all required keys are pressed
        if (keys.includes('ctrl') && !isCtrlOrCmd) matches = false;
        if (keys.includes('shift') && !isShift) matches = false;
        if (keys.includes('alt') && !isAlt) matches = false;

        // Check the main key
        const mainKey = keys.find(key => !['ctrl', 'shift', 'alt'].includes(key));
        if (mainKey && event.key.toLowerCase() !== mainKey.toLowerCase()) matches = false;

        if (matches) {
          event.preventDefault();
          shortcut.action();
          toast.success(`Shortcut: ${shortcut.label}`);
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export const CommandPalette: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  quickActions: QuickAction[];
  onAction: (action: QuickAction) => void;
}> = ({ isOpen, onClose, quickActions, onAction }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredActions = quickActions.filter(action =>
    action.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedActions = filteredActions.reduce((groups, action) => {
    const category = action.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(action);
    return groups;
  }, {} as Record<string, QuickAction[]>);

  const handleAction = (action: QuickAction) => {
    onAction(action);
    onClose();
    setSearchTerm('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <CommandIcon className="h-5 w-5" />
            Quick Actions
          </DialogTitle>
        </DialogHeader>
        
        <Command className="border-0">
          <CommandInput
            placeholder="Search for actions, patients, bookings..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="border-0 border-b"
          />
          <CommandList className="max-h-96">
            <CommandEmpty>No actions found.</CommandEmpty>
            
            {Object.entries(groupedActions).map(([category, actions]) => (
              <CommandGroup key={category} heading={category.charAt(0).toUpperCase() + category.slice(1)}>
                {actions.map((action) => (
                  <CommandItem
                    key={action.id}
                    onSelect={() => handleAction(action)}
                    className="flex items-center gap-3 p-3 cursor-pointer"
                  >
                    <div className="p-1 rounded bg-gray-100">
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{action.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export const ShortcutHelper: React.FC<{
  shortcuts: Shortcut[];
  className?: string;
}> = ({ shortcuts, className }) => {
  const [isVisible, setIsVisible] = useState(false);

  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, Shortcut[]>);

  const formatKeys = (keys: string[]) => {
    return keys.map(key => {
      switch (key) {
        case 'ctrl':
          return '⌘';
        case 'shift':
          return '⇧';
        case 'alt':
          return '⌥';
        default:
          return key.toUpperCase();
      }
    }).join(' + ');
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className={cn('fixed bottom-4 right-4 z-50', className)}
      >
        <Keyboard className="h-4 w-4 mr-2" />
        Shortcuts
      </Button>

      <Dialog open={isVisible} onOpenChange={setIsVisible}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="font-semibold mb-3 capitalize">{category}</h3>
                <div className="grid gap-2">
                  {shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded bg-gray-100">
                          {shortcut.icon}
                        </div>
                        <div>
                          <div className="font-medium">{shortcut.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {shortcut.description}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {formatKeys(shortcut.keys)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const QuickActionBar: React.FC<{
  actions: Array<{
    label: string;
    icon: React.ReactNode;
    action: () => void;
    shortcut?: string;
    color?: string;
  }>;
  className?: string;
}> = ({ actions, className }) => {
  return (
    <Card className={cn('fixed bottom-20 right-4 z-40 shadow-lg', className)}>
      <CardContent className="p-2">
        <div className="flex flex-col gap-1">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={action.action}
              className={cn(
                'justify-start gap-2 h-8',
                action.color && `hover:bg-${action.color}-50 hover:text-${action.color}-700`
              )}
              title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
            >
              {action.icon}
              <span className="text-xs">{action.label}</span>
              {action.shortcut && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {action.shortcut}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Smart Search with Recent Items
export const SmartQuickSearch: React.FC<{
  placeholder?: string;
  onSearch: (term: string) => void;
  recentItems?: Array<{
    id: string;
    label: string;
    type: string;
    action: () => void;
  }>;
  className?: string;
}> = ({ placeholder = "Quick search...", onSearch, recentItems = [], className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    onSearch(term);
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Badge variant="outline" className="text-xs">
            ⌘K
          </Badge>
        </div>
      </div>

      {/* Recent Items Dropdown */}
      {isFocused && recentItems.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
          <CardContent className="p-2">
            <div className="text-xs text-muted-foreground mb-2 px-2">Recent</div>
            {recentItems.slice(0, 5).map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8"
                onClick={item.action}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm">{item.label}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.type}
                </Badge>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Power User Dashboard
export const PowerUserDashboard: React.FC<{
  quickStats: Array<{
    label: string;
    value: number;
    change?: number;
    action: () => void;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    action?: () => void;
  }>;
}> = ({ quickStats, recentActivity }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Quick Stats */}
      <Card className="lg:col-span-2">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Quick Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            {quickStats.map((stat, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-3 justify-start"
                onClick={stat.action}
              >
                <div className="text-left">
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  <div className="text-xl font-bold">{stat.value}</div>
                  {stat.change !== undefined && (
                    <div className={cn(
                      'text-xs',
                      stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {stat.change >= 0 ? '+' : ''}{stat.change}%
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {recentActivity.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className={cn(
                  'p-2 rounded text-sm cursor-pointer hover:bg-muted',
                  activity.action && 'cursor-pointer'
                )}
                onClick={activity.action}
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {activity.timestamp}
                  </span>
                </div>
                <div className="mt-1">{activity.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};