export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && 
                 date.getMonth() === now.getMonth() && 
                 date.getFullYear() === now.getFullYear();
                 
  const isThisYear = date.getFullYear() === now.getFullYear();

  const timeString = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  if (isToday) {
    return timeString;
  }
  
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  if (isThisYear) {
    return `${month}-${day} ${timeString}`;
  }
  
  return `${date.getFullYear()}-${month}-${day} ${timeString}`;
}

export function shouldShowTimestamp(current: number, previous?: number): boolean {
  if (!previous) return true;
  
  const diff = current - previous;
  // 5 minutes in milliseconds
  return diff > 5 * 60 * 1000;
}
