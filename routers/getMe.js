import { db } from '../db.js';

/**
 * 获取当前用户（调用者）自己的信息
 */
export default async (ctx, next) => {
  const collection = db.collection('users');

  const user = await collection.findOne({ _id: ctx.state.currentUser?._id });

  if (!user) {
    ctx.status = 404;
    ctx.body = { msg: "用户不存在！" };
    return;
  }

  delete user.password;

  ctx.body = {
    msg: "获取用户信息成功！",
    data: user,
  };
}
