import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import bcrypt from 'bcryptjs';

export default async (ctx, next) => {
  const { name, password } = ctx.request.body;

  if (!name) {
    ctx.status = 400;
    ctx.body = { msg: '请填写用户名！' };
    return;
  }
  if (!password) {
    ctx.status = 400;
    ctx.body = { msg: '请填写密码！' };
    return;
  }

  const collection = db.collection('users');
  const user = await collection.findOne({ name });

  if (user) {
    if (bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ 
        name, 
        id: user._id.toString(), 
      }, process.env.JWT_SECRET_KEY);

      if (process.env.NODE_ENV !== 'development') {
        ctx.cookies.set('token', token, {
          httpOnly: true,
          secure: true, // 仅 HTTPS 传输
          maxAge: 1000 * 60 * 60 * 24,
          sameSite: 'strict', // 不允许跨域传输 cookie
          overwrite: true,
        });
      } else {
        // 方便开发阶段调试
        ctx.cookies.set('token', token, {
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24,
          overwrite: true,
        });
      }

      ctx.body = { msg: '获取成功！', data: token };
    } else {
      ctx.status = 401;
      ctx.body = { msg: '密码错误！' };
    }
  } else {
    ctx.status = 404;
    ctx.body = { msg: '此用户不存在！' };
  }
}
