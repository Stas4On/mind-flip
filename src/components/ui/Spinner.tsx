import React from 'react';
import styles from './Spinner.module.css';

interface SpinnerProps {
  fullScreen?: boolean;
  message?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  fullScreen = false, 
  message = 'Загрузка...' 
}) => {
  return (
    <div className={`${styles.spinnerContainer} ${fullScreen ? styles.fullScreen : ''}`}>
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinnerRing} />
        <div className={styles.pulseDot} />
      </div>
      {message && <p className={styles.spinnerText}>{message}</p>}
    </div>
  );
};
