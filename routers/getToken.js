import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import bcrypt from 'bcryptjs';

/**
 * 获取token（即登录）
 * @param  {string} ctx.request.body.name 用户名
 * @param  {string} ctx.request.body.password 密码
 */
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

  if (!user) {
    ctx.status = 404;
    ctx.body = { msg: '此用户不存在！' };
    return;
  }

  if (!bcrypt.compareSync(password, user.password)) {
    ctx.status = 401;
    ctx.body = { msg: '密码错误！' };
    return;
  }

  const ONE_DAY = 1000 * 60 * 60 * 24;

  const token = jwt.sign(
    {
      name: user.name,
      id: user._id.toString(),
      is_admin: !!user.is_admin,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: ONE_DAY,
    }
  );

  if (process.env.NODE_ENV !== 'development') {
    ctx.cookies.set('token', token, {
      httpOnly: true,
      secure: true, // 仅 HTTPS 传输
      maxAge: ONE_DAY,
      sameSite: 'strict', // 不允许跨域传输 cookie
      overwrite: true,
    });
  } else {
    // 方便开发阶段调试
    ctx.cookies.set('token', token, {
      httpOnly: true,
      maxAge: ONE_DAY,
      overwrite: true,
    });
  }

  ctx.body = {
    msg: '获取成功！',
    data: token,
  };
}
