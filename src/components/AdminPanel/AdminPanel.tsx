import { useCallback, useEffect, useState } from 'react';
import type { Project, PublicAccount, Role } from '../../types/access';
import { ROLE_LABELS } from '../../access/permissions';
import { adminService } from '../../api/adminService';
import { AccessError } from '../../access/errors';
import { Modal } from '../Modal/Modal';
import { ReAuthDialog } from '../ReAuthDialog/ReAuthDialog';
import styles from './AdminPanel.module.scss';

const ROLES: Role[] = ['org_admin', 'network_analyst', 'observer', 'security_auditor'];

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel = ({ onClose }: AdminPanelProps) => {
  const [accounts, setAccounts] = useState<PublicAccount[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ownAccountId, setOwnAccountId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // отложенная операция, ожидающая повторной аутентификации
  const [pendingOp, setPendingOp] = useState<{ reason: string; run: () => Promise<void> } | null>(null);

  // форма создания пользователя
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLogin, setNewLogin] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Role>('observer');
  const [newProjectIds, setNewProjectIds] = useState<string[]>([]);

  const reload = useCallback(async () => {
    try {
      const [overview, orgProjects] = await Promise.all([
        adminService.getOrgOverview(),
        adminService.getOrgProjects(),
      ]);
      setAccounts(overview.accounts);
      setOwnAccountId(overview.ownAccountId);
      setProjects(orgProjects);
    } catch (err) {
      if (err instanceof AccessError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      }
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** Запускает операцию; при требовании повторной аутентификации — диалог. */
  const runGuarded = async (run: () => Promise<void>, successNotice: string) => {
    setError(null);
    setNotice(null);
    try {
      await run();
      setNotice(successNotice);
      await reload();
    } catch (err) {
      if (err instanceof AccessError && err.needsReAuth) {
        setPendingOp({ reason: err.message, run });
        return;
      }
      setError(err instanceof Error ? err.message : 'Операция не выполнена');
    }
  };

  const changeRole = (target: PublicAccount, role: Role) => {
    if (target.role === role) return;
    void runGuarded(
      () => adminService.changeRole(target.id, role),
      `Роль «${target.login}» изменена: ${ROLE_LABELS[role]}`,
    );
  };

  const toggleProject = (target: PublicAccount, projectId: string, enabled: boolean) => {
    const next = enabled
      ? [...target.assignedProjectIds, projectId]
      : target.assignedProjectIds.filter((id) => id !== projectId);
    void runGuarded(
      () => adminService.setAssignedProjects(target.id, next),
      enabled
        ? `Проект назначен: ${target.login}`
        : `Проект отозван: ${target.login}`,
    );
  };

  const createUser = (e: React.FormEvent) => {
    e.preventDefault();
    void runGuarded(async () => {
      await adminService.createUser({
        login: newLogin,
        displayName: newName,
        role: newRole,
        assignedProjectIds: newProjectIds,
      });
      setShowCreateForm(false);
      setNewLogin('');
      setNewName('');
      setNewRole('observer');
      setNewProjectIds([]);
    }, 'Пользователь создан');
  };

  return (
    <>
      <Modal title="Пользователи и проекты организации" onClose={onClose} wide>
        {error && <div className={styles.error}>{error}</div>}
        {notice && <div className={styles.notice}>{notice}</div>}

        <div className={styles.sectionLabel}>
          Проекты организации назначаются пользователям и определяют видимые сегменты топологии
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Роль</th>
                <th>Проекты (права)</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id} className={acc.id === ownAccountId ? styles.selfRow : ''}>
                  <td>
                    <div className={styles.userName}>{acc.displayName}</div>
                    <div className={styles.userLogin}>{acc.login}</div>
                  </td>
                  <td>
                    <select
                      className={styles.roleSelect}
                      value={acc.role}
                      onChange={(e) => changeRole(acc, e.target.value as Role)}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className={styles.projectChecks}>
                      {projects.map((project) => (
                        <label key={project.id} className={styles.projectCheck}>
                          <input
                            type="checkbox"
                            checked={acc.assignedProjectIds.includes(project.id)}
                            onChange={(e) => toggleProject(acc, project.id, e.target.checked)}
                          />
                          {project.name}
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!showCreateForm ? (
          <button className={styles.secondaryButton} onClick={() => setShowCreateForm(true)}>
            Создать пользователя
          </button>
        ) : (
          <form className={styles.createForm} onSubmit={createUser}>
            <div className={styles.sectionLabel}>Новый пользователь (только своя организация)</div>
            <div className={styles.createRow}>
              <label className={styles.field}>
                <span>Логин</span>
                <input value={newLogin} onChange={(e) => setNewLogin(e.target.value)} placeholder="user.alfa" />
              </label>
              <label className={styles.field}>
                <span>Имя</span>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Иван Петров" />
              </label>
              <label className={styles.field}>
                <span>Роль</span>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className={styles.projectChecks}>
              {projects.map((project) => (
                <label key={project.id} className={styles.projectCheck}>
                  <input
                    type="checkbox"
                    checked={newProjectIds.includes(project.id)}
                    onChange={(e) =>
                      setNewProjectIds((prev) =>
                        e.target.checked ? [...prev, project.id] : prev.filter((id) => id !== project.id),
                      )
                    }
                  />
                  {project.name}
                </label>
              ))}
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryButton}>Создать</button>
              <button type="button" className={styles.secondaryButton} onClick={() => setShowCreateForm(false)}>
                Отмена
              </button>
            </div>
            <div className={styles.hint}>
              Пароль по умолчанию demo1234; создание требует повторной аутентификации
            </div>
          </form>
        )}

        <div className={styles.sectionLabel}>Сегменты по проектам</div>
        <div className={styles.projectSegments}>
          {projects.map((project) => (
            <div key={project.id} className={styles.projectSegmentRow}>
              <strong>{project.name}:</strong>
              <span>{project.segmentIds.join(', ')}</span>
            </div>
          ))}
        </div>
      </Modal>

      {pendingOp && (
        <ReAuthDialog
          reason={pendingOp.reason}
          onSuccess={async () => {
            const run = pendingOp.run;
            setPendingOp(null);
            try {
              await run();
              setNotice('Операция выполнена');
              await reload();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Операция не выполнена');
            }
          }}
          onClose={() => setPendingOp(null)}
        />
      )}
    </>
  );
};
