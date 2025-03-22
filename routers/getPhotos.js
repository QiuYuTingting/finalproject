import { db } from '../db.js';

function parseDate(dateString) {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 获取用户的照片列表
 * 支持的查询参数有：
 * - pagesize: 要获取的数据量，例如 `?pagesize=20`；默认返回50条记录；
 * - cursor: 用于分页的游标。第一次请求无需此条件，响应中会返回 cursor 字段，请求下一页则时则原样加上即可。例如：
 *   - 第一次请求的查询条件为 `?pagesize=20`，服务响应 { msg: '...', data: [...], cursor: 'foo' }；
 *   - 第二次请求时查询条件为 `?pagesize=20&cursor=foo`，服务响应则不会包含第一次返回过的数据；
 */
export default async (ctx, next) => {
  // 解析查询参数
  const pageSize = Math.abs(parseInt(ctx.query.pagesize)) || 50;
  const lastMtime = parseDate(ctx.query.cursor);

  const query = {
    user_id: ctx.state.currentUser?._id,
  };

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
