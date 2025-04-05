import { db } from '../db.js';
import { ObjectId } from 'mongodb';
import { getBaseUrl } from '../utils/getBaseUrl.js';

export default async (ctx, next) => {
  const { id } = ctx.params;

  const albumsCollection = db.collection('albums');

  const album = await albumsCollection.findOne({
    user_id: ctx.state.currentUser?._id,
    _id: ObjectId.createFromHexString(id), 
  });

  if (!album) {
    ctx.status = 404;
    ctx.body = { msg: `相册 ${id} 不存在` };
    return;
  }

  const photosCollection = db.collection('photos');
  const coverPhoto = await photosCollection.findOne({ albums: album._id });
  if (coverPhoto) {
    album.cover = `${getBaseUrl(ctx)}/photo/${coverPhoto._id}`;
  }

  ctx.body = { 
    msg: '获取成功！', 
    data: album,
  };
}
