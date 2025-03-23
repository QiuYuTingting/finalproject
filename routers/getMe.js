/**
 * 获取当前用户（调用者）自己的信息
 */
export default async (ctx, next) => {
  const user = structuredClone(ctx.state.currentUser || null);

  if (user) {
    delete user.password;
    delete user._id;

    ctx.body = { msg: "获取用户信息成功！", data: user };
  } else {
    ctx.status = 404;
    ctx.body = { msg: "用户不存在！" };
  }
}
