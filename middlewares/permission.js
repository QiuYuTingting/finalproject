/**
 * 路由级别的权限控制
 * @param  {string} mode 权限模式；'admin-only'表示仅管理员访问
 */
export function permission(mode) {
  return async (ctx, next) => {
    if (mode === 'admin-only' && !ctx.state.currentUser?.is_admin) {
      ctx.status = 403;
      ctx.body = {
        msg: '您无权访问当前资源！',
      };
      return;
    }
    await next();
  };
}
