import { db } from '../db.js';
import { getBaseUrl } from '../utils/getBaseUrl.js';

/**
 * 获取当前用户的所有相册，并为每个相册查询一个默认封面
 */
export default async (ctx, next) => {
  const albumsCollection = db.collection('albums');
  const photosCollection = db.collection('photos');

  const albums = await albumsCollection
    .find({ user_id: ctx.state.currentUser?._id })
    .toArray();

  for (const album of albums) {
    const coverPhoto = await photosCollection.findOne({ albums: album._id });
    if (coverPhoto) {
      album.cover = `${getBaseUrl(ctx)}/photo/${coverPhoto._id}`;
    }
  }

  ctx.body = { 
    msg: '获取成功！', 
    data: albums,
  };
}
