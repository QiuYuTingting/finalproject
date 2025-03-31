import { db } from '../db.js';
import { ObjectId } from 'mongodb';

function parseDate(dateString) {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 获取用户的照片列表
 * 支持的查询参数有：
 * - pagesize: 要获取的数据量。例如 `?pagesize=20`；默认返回50条记录；
 * - cursor: 用于分页的游标。第一次请求无需此条件，响应中会返回 cursor 字段，请求下一页则时则原样加上即可。例如：
 *   - 第一次请求的查询条件为 `?pagesize=20`，服务响应 { msg: '...', data: [...], cursor: 'foo' }；
 *   - 第二次请求时查询条件为 `?pagesize=20&cursor=foo`，服务响应则不会包含第一次返回过的数据；
 * - mode: 照片状态。
 *   - 'all': 获取所有未删除的照片（已删除的照片status字段为'deleted'，即软删除的概念）；例如 `?pagesize=20&mode=all`
 *   - 'trashed': 获取所有移至回收站中的照片（回收站中的照片status字段为'trashed'）；例如 `?mode=trashed`
 *   - 'default': 获取所有正常状态的照片（未移至回收站且未软删除）
 *   - 不传递mode参数则视为default
 * - person_id: 人物id。查询包含某个特定人物的照片。
 */
export default async (ctx, next) => {
  // 解析查询参数
  const pageSize = Math.abs(parseInt(ctx.query.pagesize)) || 50;
  const lastMtime = parseDate(ctx.query.cursor);
  const personId = ObjectId.isValid(ctx.query.person_id) ? ObjectId.createFromHexString(ctx.query.person_id) : '';
  const queryMode = ['all', 'trashed'].includes(ctx.query.mode)
    ? ctx.query.mode
    : 'default';

  const query = {
    user_id: ctx.state.currentUser?._id,
  };

  if (personId) {
    // personId 是 ObjectId 类型
    // photos 表的记录中，有字段 faces: [{ who: ObjectId('xxx')}, ... ]
    // 我的需求：只要 faces 中存在一个 face 的 who 属性和 personId 匹配，则添加到查询结果中
    query['faces.who'] = personId;
  }

  if (queryMode === 'all') {
    // 获取所有未软删除的照片
    // - status 字段不存在
    // - status 字段存在，但值不为 'deleted'
    query.$or = [
      { status: { $exists: false } },
      { status: { $ne: 'deleted' } }
    ];
  }
  else if (queryMode === 'default') {
    // 获取正常状态的照片
    // - status 字段不存在
    // - status 字段存在，但值不为 'deleted' 或 'trashed'
    query.$or = [
      { status: { $exists: false } },
      { status: { $nin: ['deleted', 'trashed'] } }
    ];
  }
  else if (queryMode === 'trashed') {
    // 获取回收站中的照片
    // - status 字段存在，且值为 'trashed'
    query.status = 'trashed';
  }

  if (lastMtime) {
    query.mtime = { $lt: lastMtime };
  }

  // 执行查询操作
  const collection = db.collection('photos');

  const photos = await collection
    .find(query)
    .sort({
      mtime: -1,
    })
    .limit(pageSize)
    .toArray();

  const nextCursor = photos.length ? photos.at(-1).mtime : null;

  // 获取当前服务的域名
  const host = ctx.request.get('X-Forwarded-Host') || ctx.request.host;
  const protocol = ctx.request.get('X-Forwarded-Proto') || ctx.request.protocol;
  const baseUrl = `${protocol}://${host}`;

  ctx.body = {
    msg: '获取成功！',
    data: photos.map((v) => {
      v.src = `${baseUrl}/photo/${v._id}`;
      return v;
    }),
    cursor: nextCursor,
  };
};
