import { db } from '../db.js';

/**
 * 获取当前用户（调用者）的所有信息
 * 获取到的信息会存储在 ctx.state.currentUser 中；
 * 会联表查询用户的角色和权限数据，后续可通过 `ctx.state.currentUser.roles` 访问用户角色；
 * 通过 `ctx.state.currentUser.permissions` 访问用户权限列表（已去重）；
 */
export function getCurrentUser() {
  return async (ctx, next) => {
    const collection = db.collection('users');

    const user = await collection.findOne({ _id: ctx.state.currentUser?._id });

    Object.assign(ctx.state.currentUser, user || {});

    next();
  };
}
