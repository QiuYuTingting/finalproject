import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

/**
 * 从 ctx.cookies 获取 token 并解析
 * 若解析失败则返回 302 重定向到登录页面
 * @examples
 * router.get('/users/me', authorizeByCookie(), ...);
 */
export function authorizeByCookie() {
  return async (ctx, next) => {
    const token = ctx.cookies.get('token');

    try {
      const { name, id } = jwt.verify(token, process.env.JWT_SECRET_KEY);

      ctx.state.currentUser = {
        name,
        id,
        _id: ObjectId.createFromHexString(id),
      };
    } catch (err) {
      ctx.status = 302;
      ctx.redirect('/login');
      return;
    }

    await next();
  }
}
