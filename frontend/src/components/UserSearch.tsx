'use client';

import React, { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { apiService } from '@/services/api';
import { User } from '@/types';
import { Search, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserSearchProps {
  onStartConversation: (userId: string) => void;
}

// Debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function UserSearch({ onStartConversation }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuthStore();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const users = await apiService.searchUsers(query);
        setSearchResults(users || []);
      } catch (error) {
        console.error('Search failed:', error);
        toast.error('فشل في البحث عن المستخدمين');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500), // 500ms delay
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    debouncedSearch(query);
  };

  const handleStartConversation = async (userId: string, userName: string) => {
    try {
      await onStartConversation(userId);
      setSearchTerm('');
      setSearchResults([]);
      toast.success(`تم بدء محادثة مع ${userName}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('حدث خطأ أثناء إنشاء المحادثة');
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <div className="relative mb-4">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="ابحث عن مستخدم بالاسم أو البريد الإلكتروني..."
          className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   text-right placeholder-gray-500"
          dir="rtl"
        />
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-2">نتائج البحث:</p>
          {searchResults.map((searchUser) => (
            <div 
              key={searchUser._id} 
              className="flex items-center justify-between p-3 bg-white rounded-lg 
                       border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {searchUser.avatarUrl ? (
                    <img
                      src={searchUser.avatarUrl}
                      alt={searchUser.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {searchUser.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {searchUser.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {searchUser.email}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleStartConversation(searchUser._id, searchUser.name)}
                className="flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 
                         bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 
                         transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <MessageCircle className="h-4 w-4" />
                <span>محادثة</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">لم يتم العثور على مستخدمين</p>
        </div>
      )}

      {/* Search Instructions */}
      {searchTerm.length === 0 && (
        <div className="text-center py-2 text-gray-400">
          <p className="text-xs">اكتب على الأقل حرفين للبحث عن المستخدمين</p>
        </div>
      )}
    </div>
  );
}
