import { ObjectId } from 'mongodb';
import { db } from '../db.js';

/**
 * 删除相册
 * @param  {string}   ctx.params.id 要删除的相册的id
 */
export default async (ctx, next) => {
  const { id } = ctx.params;
  const albumId = ObjectId.createFromHexString(id);

  const collection = db.collection('albums');

  // 删除相册
  const result = await collection.deleteOne({ 
    user_id: ctx.state.currentUser?._id,
    _id: albumId,
  });
  
  if (result.deletedCount) {
    // 从 photos 表的 albums 数组中移除该 ID
    const photosCollection = db.collection('photos');
    await photosCollection.updateMany(
      { albums: albumId },
      { $pull: { albums: albumId } }
    );

    ctx.body = { msg: '删除成功！' };
  } else {
    ctx.status = 404;
    ctx.body = { msg: '相册不存在!' };
  }
}
