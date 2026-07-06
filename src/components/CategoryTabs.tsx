import React from 'react';

interface CategoryTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { value: '', label: 'All' },
  { value: 'released', label: 'Released' },
  { value: 'unreleased', label: 'Unreleased' },
  { value: 'recording_session', label: 'Sessions' },
  { value: 'unsurfaced', label: 'Unsurfaced' },
];

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeTab, onTabChange }) => (
  <div className="category-tabs" role="tablist" aria-label="Track categories">
    {TABS.map(tab => (
      <button
        key={tab.value}
        className={`category-tab${activeTab === tab.value ? ' active' : ''}`}
        onClick={() => onTabChange(tab.value)}
        type="button"
        role="tab"
        aria-selected={activeTab === tab.value}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default CategoryTabs;
