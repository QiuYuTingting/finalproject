import { db } from '../db.js';

// TODO: 等待重构
export default async (ctx, next) => {
  const { id } = ctx.request.params;

  if (id !== ctx.state.currentUser?.id) {
    ctx.status = 403;
    ctx.body = { msg: `你没有权限修改此用户 ${id} 信息！` };
    return;
  }

  const { birth_date } = ctx.request.body;

  const updateData = {};

  if (birth_date) {
    updateData.birth_date = new Date(birth_date);
  }

  const collection = db.collection('users');

  const result = await collection.updateOne(
    { _id: ctx.state.currentUser?._id },
    { $set: updateData },
  );

  if (result.acknowledged && result.matchedCount) {
    ctx.body = { msg: `更新 ${result.modifiedCount} 条信息成功` };
  } else {
    ctx.status = 404;
    ctx.body = { msg: `更新用户 ${id} 的信息失败：未找到用户！` };
  }
}
