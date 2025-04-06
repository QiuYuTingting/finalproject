import { db } from '../db.js';
import { ObjectId } from 'mongodb';
import { parseDateString } from '../utils/parseDateString.js';

/**
 * 获取用户列表
 * 权限要求：管理员 TODO
 * 支持的查询参数有：
 * - pagesize: 要获取的数据量，默认50条数据；
 * - cursor: 基于游标的分页；
 * - mode: 查询模式：
 *   - 'all': 所有用户，包括已软删除的用户；
 *   - 'deleted': 已软删除的用户；
 *   - 'default': 所有正常状态的用户；
 *   - 不传mode参数视为default
 */
export default async (ctx, next) => {
  // 解析查询参数
  const pageSize = Math.abs(parseInt(ctx.query.pagesize)) || 50;
  const createdAt = parseDateString(ctx.query.cursor);
  const queryMode = ['all', 'deleted'].includes(ctx.query.mode) ? ctx.query.mode : 'default';

  // 构建查询操作符
  const query = {};

  if (queryMode === 'all') {
    // 获取所有用户
    // Does nothing
  } else if (queryMode === 'deleted') {
    // 获取已删除的用户
    query.status = 'deleted';
  } else if (queryMode === 'default') {
    // 获取正常状态的用户
    // - status 字段不存在
    // - status 字段存在，但值不为 'deleted'
    query.$or = [
      { status: { $exists: false } },
      { status: { $nin: ['deleted'] } },
    ];
  }

  if (createdAt) {
    query.created_at = { $lt: createdAt };
  }

  // 执行查询操作
  const collection = db.collection('users');

  const users = await collection
    .find(query)
    .sort({
      created_at: -1,
    })
    .limit(pageSize)
    .toArray();

  const nextCursor = users.length ? users.at(-1).created_at : null;

  ctx.body = {
    msg: '获取成功！',
    data: users,
    cursor: nextCursor,
  };
};
