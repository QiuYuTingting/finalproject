/**
 * 在开发环境中开启跨域支持
 * @return {middleware} 生产环境返回一个空中间件，不开启跨域；开发环境返回一个开启跨域的中间件
 */
export function corsForDevelopment() {
  // 非开发环境为了安全不允许跨域，返回一个空中间件
  if (process.env.NODE_ENV !== 'development') {
    return (_, next) => next();
  }

  // 开发环境为了方便调试，设置一些请求头以允许跨域请求
  return async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', process.env.CORS_ORIGIN);
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH'); // 允许 OPTIONS 预检很重要
    ctx.set('Access-Control-Allow-Credentials', 'true'); // 允许跨域的前端携带 Cookie
    ctx.set('Access-Control-Max-Age', '86400');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // 允许跨域的前端发送的请求头

    // 中间件是全局应用的，这个的逻辑会套用至每一次预检请求
    if (ctx.method === 'OPTIONS') {
      ctx.status = 204;
      return; // 预检请求直接返回即可
    }

    await next();
  }
}
