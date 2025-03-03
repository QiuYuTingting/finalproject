import { db } from '../db.js';
import { ObjectId } from 'mongodb';

export default async (ctx, next) => {
  let useId;

  try {
    useId = ObjectId.createFromHexString(ctx.params.id);
  } catch (err) {
    ctx.status = 400;
    ctx.body = { msg: err.message };
    return;
  }

  const collection = db.collection('users');
  const user = await collection.findOne({ _id: useId });

  if (user) {
    delete user.password;
    ctx.body = { msg: "成功！", data: user };
  } else {
    ctx.status = 404;
    ctx.body = { msg: "用户不存在！" };
  }
}
