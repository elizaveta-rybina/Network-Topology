/** Скачивание файла, сформированного сервисом (экспорт топологии/журнала). */
export const downloadFile = (fileName: string, content: string, mime = 'application/json'): void => {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
