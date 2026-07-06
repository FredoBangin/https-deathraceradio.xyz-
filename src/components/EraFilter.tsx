import React from 'react';
import { useGetErasQuery } from '../services/juicewrldApi';

interface EraFilterProps {
  selectedEra: string;
  onEraChange: (era: string) => void;
}

export const EraFilter: React.FC<EraFilterProps> = ({ selectedEra, onEraChange }) => {
  const { data, isLoading } = useGetErasQuery({ page_size: 50 });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: '6px', overflowX: 'hidden', padding: '4px 0' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ width: '70px', height: '26px', borderRadius: '3px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        ))}
      </div>
    );
  }

  const eras = data?.results || [];

  return (
    <div
      style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 0', scrollbarWidth: 'none' }}
      className="era-filter-scroll"
    >
      <button
        onClick={() => onEraChange('')}
        style={{
          background: selectedEra === '' ? 'var(--accent)' : 'var(--bg-card)',
          border: '1px solid',
          borderColor: selectedEra === '' ? 'var(--accent)' : 'var(--border)',
          borderRadius: '3px',
          color: selectedEra === '' ? '#fff' : 'var(--text-secondary)',
          padding: '4px 12px',
          fontSize: '12px',
          fontWeight: selectedEra === '' ? 600 : 400,
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          whiteSpace: 'nowrap',
          boxShadow: selectedEra === '' ? '0 0 6px rgba(var(--accent-rgb),0.18)' : 'none',
        }}
      >
        All Eras
      </button>

      {eras.map((era) => (
        <button
          key={era.id}
          onClick={() => onEraChange(era.name)}
          style={{
            background: selectedEra === era.name ? 'var(--accent)' : 'var(--bg-card)',
            border: '1px solid',
            borderColor: selectedEra === era.name ? 'var(--accent)' : 'var(--border)',
            borderRadius: '3px',
            color: selectedEra === era.name ? '#fff' : 'var(--text-secondary)',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: selectedEra === era.name ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            whiteSpace: 'nowrap',
            boxShadow: selectedEra === era.name ? '0 0 6px rgba(var(--accent-rgb),0.18)' : 'none',
          }}
          title={era.description || era.name}
        >
          {era.name}
        </button>
      ))}

      <style dangerouslySetInnerHTML={{ __html: `
        .era-filter-scroll::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};
export default EraFilter;
