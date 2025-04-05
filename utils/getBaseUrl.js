/**
 * 获取当前服务的域名
 */
export function getBaseUrl(ctx) {
  if (!ctx) return '';
  const host = ctx.request.get('X-Forwarded-Host') || ctx.request.host;
  const protocol = ctx.request.get('X-Forwarded-Proto') || ctx.request.protocol;
  return `${protocol}://${host}`;
}
