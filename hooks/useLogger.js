import { useRef, useState, useCallback } from 'react';

export const useLogger = () => {
  const logsRef = useRef([]);
  const [logCount, setLogCount] = useState(0);

  const log = useCallback((level, category, message, data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      category,
      message,
      data: data ? JSON.parse(JSON.stringify(data, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      )) : null
    };
    
    logsRef.current.push(logEntry);
    setLogCount(prev => prev + 1);
    
    const prefix = `[${timestamp}] [${level}] [${category}]`;
    if (level === 'ERROR') {
      console.error(prefix, message, data || '');
    } else if (level === 'WARN') {
      console.warn(prefix, message, data || '');
    } else {
      console.log(prefix, message, data || '');
    }
  }, []);

  const downloadLogs = useCallback(() => {
    const logsText = logsRef.current.map(log => {
      let entry = `[${log.timestamp}] [${log.level}] [${log.category}] ${log.message}`;
      if (log.data) {
        entry += '\n' + JSON.stringify(log.data, null, 2);
      }
      return entry;
    }).join('\n\n' + '='.repeat(80) + '\n\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prophecy-logs-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const clearLogs = useCallback(() => {
    logsRef.current = [];
    setLogCount(0);
    log('INFO', 'SYSTEM', 'Logs cleared');
  }, [log]);

  return { log, logCount, downloadLogs, clearLogs };
};
