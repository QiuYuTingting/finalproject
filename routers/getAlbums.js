import { db } from '../db.js';

export default async (ctx, next) => {
  const collection = db.collection('albums');
  const albums = await collection.find({ user_id: ctx.state.currentUser?._id }).toArray();

  ctx.body = { 
    msg: '获取成功！', 
    data: albums.map((item) => {
      return { 
        name: item.name,
        id: item._id.toString(),
      };
    }),
  };
}
