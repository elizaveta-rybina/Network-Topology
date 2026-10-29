import React from 'react'
import type { ApiConnection, ApiNode, TopologyFilterOptions } from '../../types/topology'
import { getDeviceIcon, LEGEND_TYPES } from '../../styles/deviceIcons'
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
  incidents: ApiNode[];
  focusMode: 'all' | 'incident';
  focusNodeId: string | null;
  incidentRadius: 1 | 2;
  onFocusIncident: (nodeId: string) => void;
  onShowAll: () => void;
  onExpandIncident: () => void;
  scope: {
    roleLabel: string | null;
    orgName: string | null;
    segmentLabels: string[];
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  isLoading,
  nodesCount,
  filters,
  onFilterChange,
  selectedElement,
  scope, incidents, focusMode, focusNodeId, incidentRadius, onFocusIncident, onShowAll, onExpandIncident
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

      <div className={styles.incidentPanel}>
        <div className={styles.incidentHeader}>
          <span>Инциденты</span>
          <strong>{incidents.length}</strong>
        </div>
        {incidents.length === 0 ? (
          <div className={styles.incidentEmpty}>Проблем не обнаружено</div>
        ) : (
          <>
            <div className={styles.incidentList}>
              {incidents.map((node) => (
                <button
                  type="button"
                  key={node.id}
                  className={`${styles.incidentItem} ${focusNodeId === node.id ? styles.incidentItemActive : ''}`}
                  onClick={() => onFocusIncident(node.id)}
                >
                  <span className={`${styles.statusDot} ${node.state === 'error' ? styles.statusError : styles.statusWarning}`} />
                  <span>
                    <strong>{node.label}</strong>
                    <small>{node.problem?.title ?? (node.state === 'error' ? 'Критическая ошибка' : 'Предупреждение')}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className={styles.incidentActions}>
              {focusMode === 'incident' && <button type="button" onClick={onExpandIncident}>Расширить область ({incidentRadius === 1 ? '2 перехода' : 'максимум'})</button>}
              {focusMode === 'incident' && <button type="button" onClick={onShowAll}>Показать всю топологию</button>}
            </div>
          </>
        )}
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterLabel}>Область доступа</div>
        <div className={styles.nodeInfoPanel}>
          <div className={styles.infoRow}>
            <strong>Роль:</strong>
            <span>{scope.roleLabel ?? '—'}</span>
          </div>
          <div className={styles.infoRow}>
            <strong>Организация:</strong>
            <span>{scope.orgName ?? '—'}</span>
          </div>
          <div className={styles.infoRow}>
            <strong>Сегменты:</strong>
            <span>{scope.segmentLabels.length > 0 ? scope.segmentLabels.join(', ') : 'нет назначенных'}</span>
          </div>
        </div>
      </div>

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

        
        <div className={styles.filterSection}>
          <div className={styles.filterLabel}>Типы устройств</div>
          <div className={styles.legendGrid}>
            {LEGEND_TYPES.map((type) => {
              const icon = getDeviceIcon(type);
              return (
                <div key={type} className={styles.legendItem}>
                  <img src={icon.src} alt={icon.label} className={styles.legendIcon} />
                  <span>{icon.label}</span>
                </div>
              );
            })}
          </div>
          <div className={styles.legendHint}>
            Стойки свёрнуты: двойной клик по группе или кий в её углу разворачивает содержимое
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
                  {selectedElement.problem && (
                    <>
                      <div className={styles.problemCallout}>
                        <strong>Проблема:</strong>
                        <span>{selectedElement.problem.title}</span>
                      </div>
                      {selectedElement.problem.description && (
                        <div className={styles.infoRow}>
                          <strong>Описание:</strong>
                          <span>{selectedElement.problem.description}</span>
                        </div>
                      )}
                      {selectedElement.problem.source && (
                        <div className={styles.infoRow}>
                          <strong>Источник:</strong>
                          <span>{selectedElement.problem.source}</span>
                        </div>
                      )}
                    </>
                  )}
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