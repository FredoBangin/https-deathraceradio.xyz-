import React from 'react';

interface CategoryTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { value: '', label: 'All' },
    { value: 'released', label: 'Released' },
    { value: 'unreleased', label: 'Unreleased' },
    { value: 'recording_session', label: 'Sessions' },
    { value: 'unsurfaced', label: 'Unsurfaced' },
  ];

  return (
    <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border)', overflowX: 'auto' }}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === tab.value ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-2px',
            color: activeTab === tab.value ? 'var(--text-primary)' : 'var(--text-secondary)',
            textShadow: activeTab === tab.value ? '0 0 8px rgba(255,85,0,0.6)' : 'none',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === tab.value ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
export default CategoryTabs;
