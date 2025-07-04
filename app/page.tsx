'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Staff, CheckInState } from '../types/staff';
import { parseCSVToStaff } from '../utils/csvParser';
import { csvData } from '../data/staffData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import SearchBar from '../components/SearchBar';
import StaffCard from '../components/StaffCard';
import StaffDetail from '../components/StaffDetail';
import CheckedInDetail from '../components/CheckedInDetail';

type View = 'pending' | 'completed' | 'detail' | 'checked-in-detail';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [currentView, setCurrentView] = useState<View>('pending');
  
  // Load initial staff data
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [checkedInStaffIds, setCheckedInStaffIds] = useLocalStorage<string[]>('checkedInStaff', []);

  // Initialize staff data on mount
  useEffect(() => {
    const staffData = parseCSVToStaff(csvData);
    setAllStaff(staffData);
  }, []);

  // Compute pending and checked-in staff
  const { pendingStaff, checkedInStaff } = useMemo(() => {
    const pending: Staff[] = [];
    const checkedIn: Staff[] = [];

    allStaff.forEach(staff => {
      if (checkedInStaffIds.includes(staff.id)) {
        checkedIn.push({ ...staff, checkedIn: true });
      } else {
        pending.push({ ...staff, checkedIn: false });
      }
    });

    return { pendingStaff: pending, checkedInStaff: checkedIn };
  }, [allStaff, checkedInStaffIds]);

  // Filter staff based on search query
  const filteredPendingStaff = useMemo(() => {
    if (!searchQuery.trim()) return pendingStaff;
    
    const query = searchQuery.toLowerCase();
    return pendingStaff.filter(staff =>
      staff.name.toLowerCase().includes(query) ||
      staff.email.toLowerCase().includes(query) ||
      staff.country.toLowerCase().includes(query) ||
      staff.igreja.toLowerCase().includes(query) ||
      staff.area.toLowerCase().includes(query) ||
      staff.quarto.toLowerCase().includes(query)
    );
  }, [pendingStaff, searchQuery]);

  const filteredCheckedInStaff = useMemo(() => {
    if (!searchQuery.trim()) return checkedInStaff;
    
    const query = searchQuery.toLowerCase();
    return checkedInStaff.filter(staff =>
      staff.name.toLowerCase().includes(query) ||
      staff.email.toLowerCase().includes(query) ||
      staff.country.toLowerCase().includes(query) ||
      staff.igreja.toLowerCase().includes(query) ||
      staff.area.toLowerCase().includes(query) ||
      staff.quarto.toLowerCase().includes(query)
    );
  }, [checkedInStaff, searchQuery]);

  const handleStaffSelect = (staff: Staff) => {
    setSelectedStaff(staff);
    if (staff.checkedIn) {
      setCurrentView('checked-in-detail');
    } else {
      setCurrentView('detail');
    }
  };

  const handleCheckIn = (staff: Staff) => {
    setCheckedInStaffIds(prev => [...prev, staff.id]);
    setCurrentView('pending');
    setSelectedStaff(null);
  };

  const handleUncheck = (staff: Staff) => {
    setCheckedInStaffIds(prev => prev.filter(id => id !== staff.id));
    setCurrentView('completed');
    setSelectedStaff(null);
  };

  const handleBack = () => {
    if (currentView === 'checked-in-detail') {
      setCurrentView('completed');
    } else {
      setCurrentView('pending');
    }
    setSelectedStaff(null);
  };

  const handleViewChange = (view: View) => {
    if (view !== 'detail' && view !== 'checked-in-detail') {
      setCurrentView(view);
      setSelectedStaff(null);
    }
  };

  // Show staff detail view
  if (currentView === 'detail' && selectedStaff) {
    return (
      <StaffDetail
        staff={selectedStaff}
        onCheckIn={handleCheckIn}
        onBack={handleBack}
      />
    );
  }

  // Show checked-in staff detail view
  if (currentView === 'checked-in-detail' && selectedStaff) {
    return (
      <CheckedInDetail
        staff={selectedStaff}
        onUncheck={handleUncheck}
        onBack={handleBack}
      />
    );
  }

  // Main list view
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-200 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Staff Check-In</h1>
          
          {/* Search Bar */}
          <SearchBar onSearch={setSearchQuery} />
          
          {/* Tab Navigation */}
          <div className="flex bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => handleViewChange('pending')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                currentView === 'pending'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Pending ({filteredPendingStaff.length})
            </button>
            <button
              onClick={() => handleViewChange('completed')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                currentView === 'completed'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Checked In ({filteredCheckedInStaff.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {currentView === 'pending' ? (
          <>
            {filteredPendingStaff.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  {searchQuery ? 'No matching staff found' : 'All staff checked in!'}
                </h3>
                <p className="text-neutral-500">
                  {searchQuery ? 'Try adjusting your search terms' : 'Great job! Everyone has been checked in.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPendingStaff.map((staff) => (
                  <StaffCard
                    key={staff.id}
                    staff={staff}
                    onSelect={handleStaffSelect}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {filteredCheckedInStaff.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  {searchQuery ? 'No matching checked-in staff found' : 'No staff checked in yet'}
                </h3>
                <p className="text-neutral-500">
                  {searchQuery ? 'Try adjusting your search terms' : 'Staff members will appear here after checking in.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCheckedInStaff.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => handleStaffSelect(staff)}
                    className="w-full text-left card-checked hover:bg-primary-100 transition-colors duration-200 active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-neutral-900 truncate">
                          {staff.name}
                        </h3>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-neutral-600">
                            {staff.country} {staff.igreja && `• ${staff.igreja}`}
                          </p>
                          {staff.email && (
                            <p className="text-sm text-neutral-500 truncate">
                              {staff.email}
                            </p>
                          )}
                          {staff.area && (
                            <p className="text-sm text-neutral-500">
                              Area: {staff.area}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 