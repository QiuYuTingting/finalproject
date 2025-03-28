import { db } from '../db.js';
import bcrypt from 'bcryptjs';

/**
 * 创建用户（即注册）
 * @param  {string} ctx.request.body.name 用户名
 * @param  {string} ctx.request.body.password 密码
 */
export default async (ctx, next) => {
  const { name, password } = ctx.request.body;

  if (!name || !/^[a-zA-Z0-9_-]{2,15}$/.test(name)) {
    ctx.status = 400;
    ctx.body = { msg: '用户名只能由英文字母、数字、下划线和短横组成，且长度应为 2-15 个字符' };
    return;
  }

  if (!password || password.length < 8 || password.length > 72) {
    ctx.status = 400;
    ctx.body = { msg: '密码长度应为 8-72 个字符' };
    return;
  }

  const collection = db.collection('users');
  const user = await collection.findOne({ name });

  if (user) {
    ctx.status = 409;
    ctx.body = { msg: '用户已存在！' };
  } else {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    await collection.insertOne({ 
      name,
      password: hash,
      created_at: new Date(),
      update_at: new Date(),
    });

    ctx.status = 201;
    ctx.body = {msg: '创建成功！'};
  }
}
