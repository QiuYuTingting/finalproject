import dotenv from 'dotenv';
import Koa from 'koa';
import { koaBody } from 'koa-body';
import Router from 'koa-router';
import { shutdown } from './db.js';
import { validateParamsId } from './middlewares/validateParamsId.js';
import { authorize } from './middlewares/authorize.js';
import { permission } from './middlewares/permission.js';
import { authorizeByCookie } from './middlewares/authorizeByCookie.js';
import { corsForDevelopment } from './middlewares/corsForDevelopment.js';
import createUser from './routers/createUser.js';
import getToken from './routers/getToken.js';
import createAlbum from './routers/createAlbum.js';
import getAlbums from './routers/getAlbums.js';
import deleteAlbum from './routers/deleteAlbum.js';
import getUser from './routers/getUser.js';
import getAlbum from './routers/getAlbum.js';
import uploadPhotos from './routers/uploadPhotos.js';
import getPhoto from './routers/getPhoto.js';
import getPhotos from './routers/getPhotos.js';
import getMe from './routers/getMe.js';
import patchPhotos from './routers/patchPhotos.js';
import deleteTrashedPhotos from './routers/deleteTrashedPhotos.js';
import getPeople from './routers/getPeople.js';
import getPerson from './routers/getPerson.js';
import patchPeople from './routers/patchPeople.js';
import getPhotoRecord from './routers/getPhotoRecord.js';
import patchAlbums from './routers/patchAlbums.js';
import patchUsers from './routers/patchUsers.js';
import getUsers from './routers/getUsers.js';

dotenv.config();

var app = new Koa();
var router = new Router();

app.use(corsForDevelopment());

app.use(koaBody());

router.get('/', (ctx, next) => {
  ctx.body = { msg: 'Welcome!' };
});

router.post('/users', createUser);
router.post('/token', getToken);
router.get('/users/me', authorize(), getMe); // 不能放在 GET /users/:id 之后
router.get('/users/:id', authorize(), validateParamsId(), getUser);
router.get('/users', authorize(), permission('admin-only'), getUsers);
router.patch('/users', authorize(), patchUsers);
router.post('/albums', authorize(), createAlbum);
router.get('/albums', authorize(), getAlbums);
router.get('/albums/:id', authorize(), validateParamsId(), getAlbum);
router.delete('/albums/:id', authorize(), validateParamsId(), deleteAlbum);
router.patch('/albums', authorize(), patchAlbums);
router.post('/photos', authorize(), uploadPhotos);
router.patch('/photos', authorize(), patchPhotos);
router.get('/photos', authorize(), getPhotos);
router.delete('/photos/trashed', authorize(), deleteTrashedPhotos);
router.get('/photos/:id', authorize(), validateParamsId(), getPhotoRecord);
router.get('/photo/:id', authorizeByCookie(), validateParamsId(), getPhoto);
router.get('/people', authorize(), getPeople);
router.get('/people/:id', authorize(), validateParamsId(), getPerson);
router.patch('/people', authorize(), patchPeople);

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
