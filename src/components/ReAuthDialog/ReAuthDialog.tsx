import { useState } from 'react';
import { Modal } from '../Modal/Modal';
import { authService } from '../../api/authService';
import styles from './ReAuthDialog.module.scss';

interface ReAuthDialogProps {
  reason: string;
  onSuccess: () => void;
  onClose: () => void;
}

/** Повторная аутентификация перед чувствительными операциями администратора. */
export const ReAuthDialog = ({ reason, onSuccess, onClose }: ReAuthDialogProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await authService.reauthenticate(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка проверки');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Повторная аутентификация" onClose={onClose}>
      <p className={styles.reason}>{reason}</p>
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.field}>
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="demo1234"
            autoFocus
            autoComplete="current-password"
          />
        </label>
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? 'Проверка…' : 'Подтвердить личность'}
        </button>
      </form>
    </Modal>
  );
};
