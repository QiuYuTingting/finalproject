import { db } from '../db.js';
import { ObjectId } from 'mongodb';

export default async (ctx, next) => {
  const collection = db.collection('users');
  const user = await collection.findOne({ _id: ctx.tokenPayload?.userId });

  if (user) {
    delete user.password;
    ctx.body = { msg: "获取用户信息成功！", data: user };
  } else {
    ctx.status = 404;
    ctx.body = { msg: "用户不存在！" };
  }
}
