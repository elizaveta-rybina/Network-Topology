import React from 'react'
import type { ApiConnection, ApiNode, TopologyFilterOptions } from '../../types/topology'
import styles from './Sidebar.module.scss'

const AVAILABLE_STATES = [
  { value: 'ok', label: 'Успех (OK)' },
  { value: 'warning', label: 'Предупреждение' },
  { value: 'error', label: 'Ошибка' },
];

interface SidebarProps {
  isLoading: boolean;
  nodesCount: number;
  filters: TopologyFilterOptions;
  onFilterChange: (newFilters: TopologyFilterOptions) => void;
  selectedElement: ApiNode | ApiConnection | null; 
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isLoading, 
  nodesCount, 
  filters, 
  onFilterChange,
  selectedElement
}) => {
  
  const handleStateChange = (stateValue: string, isChecked: boolean) => {
    const currentStates = filters.states || [];
    const newStates = isChecked
      ? [...currentStates, stateValue]
      : currentStates.filter((s) => s !== stateValue);
      
    onFilterChange({ ...filters, states: newStates });
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.title}>Управление</div>
      
      <div className={styles.filtersContainer}>
        
        <div className={styles.filterSection}>
          <div className={styles.filterLabel}>Статус</div>
          <div className={styles.checkboxList}>
            {AVAILABLE_STATES.map((state) => {
              const isChecked = (filters.states || []).includes(state.value);
              return (
                <label key={state.value} className={styles.checkboxItem}>
                  <input 
                    type="checkbox" 
                    className={styles.checkboxInput}
                    checked={isChecked}
                    onChange={(e) => handleStateChange(state.value, e.target.checked)}
                  />
                  {state.label}
                </label>
              );
            })}
          </div>
        </div>

        
        {selectedElement && (
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>
              {'source' in selectedElement ? 'Информация о связи' : 'Информация об узле'}
            </div>
            
            <div className={styles.nodeInfoPanel}>
              <div className={styles.infoRow}>
                <strong>ID:</strong> 
                <span>{selectedElement.id}</span>
              </div>
              
              
              {'source' in selectedElement ? (
                <>
                  <div className={styles.infoRow}>
                    <strong>Тип:</strong> 
                    <span>{selectedElement.type || 'по умолчанию'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <strong>Откуда (Source):</strong> 
                    <span>{selectedElement.source}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <strong>Куда (Target):</strong> 
                    <span>{selectedElement.target}</span>
                  </div>
                </>
              ) : (
                
                <>
                  <div className={styles.infoRow}>
                    <strong>Название:</strong> 
                    <span>{selectedElement.label}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <strong>Тип:</strong> 
                    <span>{selectedElement.type}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <strong>Статус:</strong> 
                    <span>{selectedElement.state}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>

      <div className={styles.stats}>
        {isLoading ? 'Загрузка...' : `Отображено узлов: ${nodesCount}`}
      </div>
    </aside>
  );
};