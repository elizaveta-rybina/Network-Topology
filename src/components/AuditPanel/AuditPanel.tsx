import { useCallback, useEffect, useState } from 'react';
import type { AuditEvent } from '../../types/access';
import { AUDIT_ACTION_LABELS } from '../../access/audit';
import { auditService } from '../../api/auditService';
import { AccessError } from '../../access/errors';
import { downloadFile } from '../../ utils/downloadFile';
import { Modal } from '../Modal/Modal';
import styles from './AuditPanel.module.scss';

interface AuditPanelProps {
  onClose: () => void;
}

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** Журнал событий: только чтение, поиск и выгрузка; без редактирования и удаления. */
export const AuditPanel = ({ onClose }: AuditPanelProps) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await auditService.searchEvents(q);
      setEvents(result);
    } catch (err) {
      if (err instanceof AccessError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    search('');
    // начальная загрузка: пустой запрос = полный журнал
  }, [search]);

  const exportLog = async () => {
    setError(null);
    setNotice(null);
    try {
      const { fileName, content } = await auditService.exportEvents();
      downloadFile(fileName, content);
      setNotice(`Журнал выгружен: ${fileName}`);
    } catch (err) {
      if (err instanceof AccessError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  return (
    <Modal title="Журнал событий безопасности" onClose={onClose} wide>
      {error && <div className={styles.error}>{error}</div>}
      {notice && <div className={styles.notice}>{notice}</div>}

      <div className={styles.toolbar}>
        <form
          className={styles.searchForm}
          onSubmit={(e) => {
            e.preventDefault();
            search(query);
          }}
        >
          <input
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: логин, действие, ресурс…"
          />
          <button type="submit" className={styles.searchButton} disabled={isLoading}>
            Найти
          </button>
        </form>
        <button className={styles.exportButton} onClick={exportLog}>
          Выгрузить журнал
        </button>
      </div>

      <div className={styles.hint}>
        Поиск и выгрузка фиксируются в самом журнале отдельными событиями
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Время</th>
              <th>Субъект</th>
              <th>Действие</th>
              <th>Ресурс</th>
              <th>Детали</th>
              <th>Результат</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className={event.result === 'denied' ? styles.deniedRow : ''}>
                <td className={styles.timeCell}>{formatTime(event.timestamp)}</td>
                <td>{event.actorLogin}</td>
                <td>{AUDIT_ACTION_LABELS[event.action]}</td>
                <td className={styles.monoCell}>{event.resource}</td>
                <td className={styles.detailsCell}>{event.details}</td>
                <td>
                  <span className={event.result === 'denied' ? styles.deniedBadge : styles.allowedBadge}>
                    {event.result === 'denied' ? 'отказ' : 'успех'}
                  </span>
                </td>
              </tr>
            ))}
            {!isLoading && events.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>Событий не найдено</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};
