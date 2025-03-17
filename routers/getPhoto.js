import path from 'path';
import fs from 'fs';
import { db } from '../db.js';
import { ObjectId } from 'mongodb';

export default async (ctx, next) => {
  const { id } = ctx.params;

  if (!id || typeof id !== 'string' || id.length !== 24 ) {
    ctx.status = 400;
    ctx.body = { msg: '未知图片 id' };
    return;
  }

  const collection = db.collection('photos');

  const photo = await collection.findOne({
    user_id: ctx.tokenPayload?.userId,
    _id: ObjectId.createFromHexString(id),
  });

  if (!photo) {
    ctx.status = 404;
    ctx.body = { msg: `图片 ${id} 不存在` };
    return;
  }

  const { filepath_segments, mimetype } = photo;

  const filepath = path.join(process.env.FILE_UPLOAD_DIR, ...filepath_segments);

  ctx.type = mimetype;
  ctx.body = fs.createReadStream(filepath);
};
