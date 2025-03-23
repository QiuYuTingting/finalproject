import { db } from '../db.js';
import { ObjectId } from 'mongodb';

/**
 * 获取用户信息
 * @param  {string} ctx.params.id 要获取的用户的ID
 * @description
 * 权限要求：ctx.params.id 和当前用户（调用者）的id一致；或者当前用户具有 VIEW_USERS 权限；
 */
export default async (ctx, next) => {
  const collection = db.collection('users');
  const user = await collection.findOne({ _id: ObjectId.createFromHexString(ctx.params.id) });

  if (user) {
    delete user.password;
    ctx.body = { msg: "成功！", data: user };
  } else {
    ctx.status = 404;
    ctx.body = { msg: "用户不存在！" };
  }
}
