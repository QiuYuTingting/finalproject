import { db } from '../db.js';

export default async (ctx, next) => {
  const host = ctx.request.get('X-Forwarded-Host') || ctx.request.host;
  const protocol = ctx.request.get('X-Forwarded-Proto') || ctx.request.protocol;
  const baseUrl = `${protocol}://${host}`;

  const collection = db.collection('photos');

  const photos = await collection.find({ user_id: ctx.state.currentUser?._id }).toArray();

  ctx.body = {
    msg: '获取成功！',
    data: photos.map((v) => {
      v.src = `${baseUrl}/photo/${v._id}`;
      return v;
    }),
  };
};
