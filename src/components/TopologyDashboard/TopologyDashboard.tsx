import { useMemo, useRef, useState } from 'react';
import { filterTopologyData } from '../../features/filterTopology';
import { mapToCytoscapeElements } from '../../features/mapTopology';
import { getIncidentNodes, getIncidentTopology, type IncidentRadius } from '../../features/incidentTopology';
import { useCytoscape } from '../../hooks/useCytoscape';
import { useTopologyData } from '../../hooks/useTopologyData';
import { useDashboardState } from '../../hooks/useDashboardState';
import { useGraphControls } from '../../hooks/useGraphControls';
import { useSession } from '../../hooks/useSession';
import { canRole, ROLE_LABELS } from '../../access/permissions';
import { topologyService } from '../../api/topologyService';
import { authService } from '../../api/authService';
import { downloadFile } from '../../ utils/downloadFile';

import { Header } from '../Header/Header';
import { Sidebar } from '../SideBar/Sidebar';
import { GraphArea } from '../GraphArea/GraphArea';
import { AdminPanel } from '../AdminPanel/AdminPanel';
import { AuditPanel } from '../AuditPanel/AuditPanel';
import styles from './TopologyDashboard.module.scss';

export const TopologyDashboard = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { account, org, segmentLabels } = useSession();

  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAuditPanelOpen, setIsAuditPanelOpen] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [focusMode, setFocusMode] = useState<'all' | 'incident'>('incident');
  const [viewMode, setViewMode] = useState<'incident' | 'hierarchy'>('incident');
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [incidentRadius, setIncidentRadius] = useState<IncidentRadius>(1);
  const [storyStep, setStoryStep] = useState<'overview' | 'path' | 'failure' | 'backup' | 'impact'>('overview');

  const { data, isLoading, error, accessError, refetch: refetchTopology } = useTopologyData(account);

  const {
    theme, toggleTheme,
    filters, handleFilterChange,
    selectedElement, setSelectedElement
  } = useDashboardState();

  const incidents = useMemo(() => (data ? getIncidentNodes(data).sort((a, b) => (a.state === 'error' ? -1 : 1) - (b.state === 'error' ? -1 : 1)) : []), [data]);

  const activeFocusNodeId = focusNodeId && incidents.some((node) => node.id === focusNodeId)
    ? focusNodeId
    : incidents[0]?.id ?? null;

  const cyElements = useMemo(() => {
    if (!data) return [];
    const safeData = filterTopologyData(data, filters);
    if (focusMode === 'incident' && activeFocusNodeId) {
      return mapToCytoscapeElements(getIncidentTopology(safeData, activeFocusNodeId, incidentRadius));
    }
    return mapToCytoscapeElements(safeData);
  }, [data, filters, focusMode, activeFocusNodeId, incidentRadius]);

  const { cyRef, isGraphReady } = useCytoscape({
    containerRef,
    elements: cyElements,
    theme,
    onElementClick: setSelectedElement,
    focusNodeId: focusMode === 'incident' ? activeFocusNodeId : null,
    highlightNodeIds: focusMode === 'incident' && data?.story
      ? storyStep === 'path' ? data.story.pathNodeIds
        : storyStep === 'failure' ? data.story.failureNodeIds
          : storyStep === 'backup' ? data.story.backupNodeIds
            : storyStep === 'impact' ? data.story.impactNodeIds : []
      : [],
    hierarchyMode: viewMode === 'hierarchy',
  });

  const { handleZoomIn, handleZoomOut } = useGraphControls(cyRef);

  // дашборд монтируется только при активной сессии (гейт в App),
  // здесь остаётся защита типов
  if (!account) {
    return null;
  }

  const showToast = (kind: 'ok' | 'err', text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 5000);
  };

  const handleExportTopology = async () => {
    try {
      const { fileName, content } = await topologyService.exportTopology();
      downloadFile(fileName, content);
      showToast('ok', `Топология выгружена: ${fileName}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Экспорт не выполнен';
      showToast('err', message);
    }
  };

  const handleLogout = () => {
    setIsAdminPanelOpen(false);
    setIsAuditPanelOpen(false);
    void authService.logout();
  };

  const handleFocusIncident = (nodeId: string) => {
    setFocusNodeId(nodeId);
    setIncidentRadius(1);
    setStoryStep('overview');
    setFocusMode('incident');
    setViewMode('incident');
    setSelectedElement(null);
  };

  const handleViewModeChange = (mode: 'incident' | 'hierarchy') => {
    setViewMode(mode);
    setFocusMode(mode === 'incident' ? 'incident' : 'all');
    setStoryStep('overview');
    setSelectedElement(null);
  };

  const handleExpandIncident = () => {
    setIncidentRadius(2);
  };

  const handleAddNode = async (node: import('../../types/topology').ApiNode) => {
    try {
      await topologyService.addNode(node);
      await refetchTopology();
      showToast('ok', `Узел «${node.label}» добавлен`);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Не удалось добавить узел');
    }
  };

  const handleUpdateNode = async (id: string, patch: Partial<import('../../types/topology').ApiNode>) => {
    try {
      await topologyService.updateNode(id, patch);
      await refetchTopology();
      showToast('ok', 'Узел сохранён');
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Не удалось сохранить узел');
    }
  };

  const handleAddConnection = async (connection: import('../../types/topology').ApiConnection) => {
    try {
      await topologyService.addConnection(connection);
      await refetchTopology();
      showToast('ok', 'Связь добавлена');
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Не удалось добавить связь');
    }
  };

  const handleStoryStepChange = (step: 'overview' | 'path' | 'failure' | 'backup' | 'impact') => {
    if (step === 'path' || step === 'backup') setIncidentRadius(2);
    setStoryStep(step);
  };

  return (
    <div className={styles.layout}>
      <Header
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        theme={theme}
        onToggleTheme={toggleTheme}
        userName={account.displayName}
        roleLabel={ROLE_LABELS[account.role]}
        orgName={org?.name ?? null}
        canExportTopology={canRole(account.role, 'topology:export')}
        canManageOrg={canRole(account.role, 'users:read')}
        canViewAudit={canRole(account.role, 'audit:read')}
        onExportTopology={() => void handleExportTopology()}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenAuditPanel={() => setIsAuditPanelOpen(true)}
        onLogout={handleLogout}
      />

      <div className={styles.workspace}>
        <Sidebar
          isLoading={isLoading}
          nodesCount={cyElements.filter(e => e.data && !e.data.source).length}
          filters={filters}
          onFilterChange={handleFilterChange}
          selectedElement={selectedElement}
          incidents={incidents}
          focusMode={focusMode}
          focusNodeId={activeFocusNodeId}
          incidentRadius={incidentRadius}
          onFocusIncident={handleFocusIncident}
          onShowAll={() => setFocusMode('all')}
          onExpandIncident={handleExpandIncident}
          story={data?.story}
          storyStep={storyStep}
          onStoryStepChange={handleStoryStepChange}
          canEditTopology={canRole(account.role, 'topology:write')}
          onAddNode={handleAddNode}
          onUpdateNode={handleUpdateNode}
          onAddConnection={handleAddConnection}
          availableNodeIds={data?.nodes.map((node) => node.id) ?? []}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          scope={{
            roleLabel: ROLE_LABELS[account.role],
            orgName: org?.name ?? null,
            segmentLabels,
          }}
        />

        <GraphArea
          ref={containerRef}
          isGraphReady={isGraphReady}
          isLoading={isLoading}
          hasData={!!data}
          error={error ? String(error) : null}
          noAccess={accessError}
          story={data?.story}
          showStory={viewMode === 'incident'}
          storyStep={storyStep}
        />
      </div>

      {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />}
      {isAuditPanelOpen && <AuditPanel onClose={() => setIsAuditPanelOpen(false)} />}

      {toast && (
        <div className={`${styles.toast} ${toast.kind === 'err' ? styles.toastError : ''}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
};
