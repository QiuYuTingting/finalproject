/**
 * 解析字符串为日期，
 * @param  {string} dateString 表示日期的字符串
 * @return {Date | null} 成功则返回日期对象，失败则返回null
 */
export function parseDateString(dateString) {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}
