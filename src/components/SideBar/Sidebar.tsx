import React, { useState } from 'react'
import type { ApiConnection, ApiNode, TopologyFilterOptions, TopologyStory } from '../../types/topology'
import { getDeviceIcon, LEGEND_TYPES } from '../../styles/deviceIcons'
import styles from './Sidebar.module.scss'

const AVAILABLE_STATES = [
  { value: 'ok', label: 'Успех (OK)' },
  { value: 'warning', label: 'Предупреждение' },
  { value: 'error', label: 'Ошибка' },
];

const TYPE_LABELS: Record<string, string> = {
  gateway: 'шлюз — вход/выход в сеть',
  firewall: 'межсетевой экран — проверяет доступ',
  'load-balancer': 'балансировщик — распределяет запросы',
  server: 'сервер — выполняет приложение',
  switch: 'коммутатор — соединяет устройства',
  router: 'маршрутизатор — передаёт трафик между сетями',
};

const STATE_LABELS: Record<string, string> = {
  ok: 'Норма: работает штатно',
  warning: 'Предупреждение: есть риск или деградация',
  error: 'Ошибка: компонент не работает',
};

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
  story?: TopologyStory;
  storyStep: 'overview' | 'path' | 'failure' | 'backup' | 'impact';
  onStoryStepChange: (step: 'overview' | 'path' | 'failure' | 'backup' | 'impact') => void;
  canEditTopology: boolean;
  onAddNode: (node: ApiNode) => Promise<void>;
  onUpdateNode: (id: string, patch: Partial<ApiNode>) => Promise<void>;
  onAddConnection: (connection: ApiConnection) => Promise<void>;
  availableNodeIds: string[];
  viewMode: 'incident' | 'hierarchy';
  onViewModeChange: (mode: 'incident' | 'hierarchy') => void;
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
  scope, incidents, focusMode, focusNodeId, incidentRadius, onFocusIncident, onShowAll, onExpandIncident, story, storyStep, onStoryStepChange,
  canEditTopology, onAddNode, onUpdateNode, onAddConnection, availableNodeIds
  , viewMode, onViewModeChange
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [newNode, setNewNode] = useState({ id: '', label: '', type: 'server', state: 'ok' as ApiNode['state'] });
  const [newConnection, setNewConnection] = useState({ source: '', target: '', type: 'arrow' });
  const [editLabel, setEditLabel] = useState('');
  const [editState, setEditState] = useState<ApiNode['state']>('ok');
  
  const handleStateChange = (stateValue: string, isChecked: boolean) => {
    const currentStates = filters.states || [];
    const newStates = isChecked
      ? [...currentStates, stateValue]
      : currentStates.filter((s) => s !== stateValue);
      
    onFilterChange({ ...filters, states: newStates });
  };

  const handleSaveNode = async () => {
    if (!newNode.id || !newNode.label) return;
    await onAddNode(newNode);
    setNewNode({ id: '', label: '', type: 'server', state: 'ok' });
  };

  const handleUpdateSelected = async () => {
    if (!selectedElement || 'source' in selectedElement) return;
    await onUpdateNode(selectedElement.id, { label: editLabel || selectedElement.label, state: editState });
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.title}>Управление</div>

      <div className={styles.viewModeSwitch} aria-label="Режим отображения">
        <button type="button" className={viewMode === 'incident' ? styles.viewModeActive : ''} onClick={() => onViewModeChange('incident')}>
          Разбор инцидента
        </button>
        <button type="button" className={viewMode === 'hierarchy' ? styles.viewModeActive : ''} onClick={() => onViewModeChange('hierarchy')}>
          Иерархия сети
        </button>
      </div>

      <div className={styles.explainerPanel}>
        <div className={styles.explainerTitle}>Как читать карту</div>
        <p>Топология показывает путь запроса и помогает найти место, из-за которого сервис работает неправильно.</p>
        <ol>
          <li><strong>Кружок</strong> — устройство или сервис.</li>
          <li><strong>Линия</strong> — связь между ними.</li>
          <li><strong>Красный</strong> — проблема, жёлтый — риск.</li>
        </ol>
        <div className={styles.explainerHint}>Нажмите на проблему слева — карта оставит только её окружение.</div>
      </div>

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
            {focusMode === 'incident' && story && (
              <div className={styles.currentExplanation}>
                <strong>Что происходит сейчас</strong>
                <span>{story.impact}</span>
                <span>{story.availability}</span>
              </div>
            )}
            {focusMode === 'incident' && story && (
              <div className={styles.storySteps}>
                <strong>Показать на карте</strong>
                {([
                  ['path', '1. Путь запроса'],
                  ['failure', '2. Место ошибки'],
                  ['backup', '3. Резервный путь'],
                  ['impact', '4. Что затронуто'],
                ] as const).map(([step, label]) => (
                  <button
                    type="button"
                    key={step}
                    className={storyStep === step ? styles.storyStepActive : ''}
                    onClick={() => onStoryStepChange(step)}
                  >
                    {label}
                  </button>
                ))}
                <button type="button" className={storyStep === 'overview' ? styles.storyStepActive : ''} onClick={() => onStoryStepChange('overview')}>
                  Снять подсветку
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <button type="button" className={styles.technicalToggle} onClick={() => setShowTechnicalDetails((value) => !value)}>
        {showTechnicalDetails ? 'Скрыть технические детали' : 'Показать технические детали'}
      </button>

      {showTechnicalDetails && <div className={styles.filterSection}>
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
      </div>}

      {showTechnicalDetails && <div className={styles.filtersContainer}>
        {canEditTopology && (
          <div className={styles.editPanel}>
            <div className={styles.filterLabel}>Изменение топологии</div>
            <input placeholder="ID нового узла" value={newNode.id} onChange={(e) => setNewNode({ ...newNode, id: e.target.value })} />
            <input placeholder="Название узла" value={newNode.label} onChange={(e) => setNewNode({ ...newNode, label: e.target.value })} />
            <select value={newNode.type} onChange={(e) => setNewNode({ ...newNode, type: e.target.value })}>
              <option value="server">Сервер</option>
              <option value="router">Маршрутизатор</option>
              <option value="switch">Коммутатор</option>
              <option value="firewall">Межсетевой экран</option>
            </select>
            <button type="button" onClick={() => void handleSaveNode()}>Добавить узел</button>
            {selectedElement && !('source' in selectedElement) && (
              <>
                <input value={editLabel} placeholder={selectedElement.label} onFocus={() => setEditLabel(selectedElement.label)} onChange={(e) => setEditLabel(e.target.value)} />
                <select value={editState} onChange={(e) => setEditState(e.target.value as ApiNode['state'])}>
                  <option value="ok">Норма</option>
                  <option value="warning">Предупреждение</option>
                  <option value="error">Ошибка</option>
                </select>
                <button type="button" onClick={() => void handleUpdateSelected()}>Сохранить выбранный узел</button>
              </>
            )}
            <select value={newConnection.source} onChange={(e) => setNewConnection({ ...newConnection, source: e.target.value })}>
              <option value="">Откуда</option>
              {availableNodeIds.map((id) => <option key={id} value={id}>{id}</option>)}
            </select>
            <select value={newConnection.target} onChange={(e) => setNewConnection({ ...newConnection, target: e.target.value })}>
              <option value="">Куда</option>
              {availableNodeIds.map((id) => <option key={id} value={id}>{id}</option>)}
            </select>
            <button type="button" onClick={() => void onAddConnection({ id: `e-${Date.now()}`, ...newConnection })}>Добавить связь</button>
          </div>
        )}
        
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
            Стойки свёрнуты: двойной клик по группе или значку в её углу разворачивает содержимое
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
                    <span>{TYPE_LABELS[selectedElement.type] ?? selectedElement.type}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <strong>Статус:</strong> 
                    <span>{STATE_LABELS[selectedElement.state] ?? selectedElement.state}</span>
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

      </div>}

      <div className={styles.stats}>
        {isLoading ? 'Загрузка...' : `Отображено узлов: ${nodesCount}`}
      </div>
    </aside>
  );
};