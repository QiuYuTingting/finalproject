import { db } from '../db.js';
import bcrypt from 'bcryptjs';

/**
 * 通过用户名和密码获取用户信息
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

  delete user.password;
  ctx.body = {
    msg: '获取用户信息成功！',
    data: user,
  };
};
