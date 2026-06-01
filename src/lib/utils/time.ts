/** 消息时间格式化：今天→HH:mm / 昨天→昨天 HH:mm / 年内→MM月DD日 HH:mm / 跨年→YYYY年MM月DD日 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  if (target.getTime() === today.getTime()) return time;
  if (target.getTime() === yesterday.getTime()) return '昨天 ' + time;

  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (date.getFullYear() === now.getFullYear()) {
    return month + '月' + day + '日 ' + time;
  }
  return date.getFullYear() + '年' + month + '月' + day + '日 ' + time;
}

/** 会话列表时间：今天→HH:mm / 昨天→昨天 / 天内→X天前 / 更早→MM月DD日 */
export function formatConvTime(dateString: string): string {
  const date = new Date(dateString);
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return minutes + '分钟前';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + '小时前';
  const days = Math.floor(hours / 24);
  if (days === 1) return '昨天';
  if (days < 7) return days + '天前';
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (date.getFullYear() === new Date().getFullYear()) return month + '月' + day + '日';
  return date.getFullYear() + '年' + month + '月' + day + '日';
}
