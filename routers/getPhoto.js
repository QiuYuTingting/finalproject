import path from 'path';
import fs from 'fs';
import { db } from '../db.js';
import { ObjectId } from 'mongodb';

export default async (ctx, next) => {
  const { id } = ctx.params;

  const collection = db.collection('photos');

  const photo = await collection.findOne({
    user_id: ctx.state.currentUser?._id,
    _id: ObjectId.createFromHexString(id),
  });

  if (!photo) {
    ctx.status = 404;
    ctx.body = { msg: `图片 ${id} 不存在` };
    return;
  }

  const { filepath_segments, mimetype } = photo;

  const filepath = path.join(process.env.FILE_UPLOAD_DIR, ...filepath_segments);

  ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
  ctx.type = mimetype;
  ctx.body = fs.createReadStream(filepath);
};
