import { db } from '../db.js';

export default async (ctx, next) => {
  const collection = db.collection('users');
  const user = await collection.findOne({ _id: ctx.state.currentUser?._id });

  if (user) {
    delete user.password;
    delete user._id;

    ctx.body = { msg: "获取用户信息成功！", data: user };
  } else {
    ctx.status = 404;
    ctx.body = { msg: "用户不存在！" };
  }
}
