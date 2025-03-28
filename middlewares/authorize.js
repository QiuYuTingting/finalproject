import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

/**
 * 从 ctx.headers['authorization'] 获取 token 并解析
 * @examples
 * router.get('/users/me', authorize(), ...);
 */
export function authorize() {
  return async (ctx, next) => {
    const authorization = ctx.headers['authorization'];

    const token = authorization?.split(' ')[1];

    try {
      const { name, id, is_admin } = jwt.verify(token, process.env.JWT_SECRET_KEY);

      ctx.state.currentUser = {
        name,
        id,
        is_admin,
        _id: ObjectId.createFromHexString(id),
      };
    } catch (err) {
      ctx.status = 401;
      ctx.body = { msg: '未授权！' };
      return;
    }

    await next();
  }
}
