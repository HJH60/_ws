import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { viewEngine, ejsEngine, oakAdapter } from "https://deno.land/x/view_engine@v10.5.1/mod.ts"
import { Session } from "https://deno.land/x/oak_sessions/mod.ts";

const db = new DB("blog.db");
// db.query("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, body TEXT)");
db.query("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, title TEXT, body TEXT)");
db.query("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)");

const router = new Router();

router.get('/', list)
  .get('/post/new', add)
  .get('/post/:id', show)
  .post('/post', create)
  .get('/public/(.*)', pub)
  .get('/signup', signupUi)
  .post('/signup', signup)
  .get('/login', loginUi)
  .post('/login', login)
  .get('/logout', logout)
  .get('/userlist',userlist)
  .get('/list/:user', listUserPosts)

const app = new Application();
app.use(Session.initMiddleware())
app.use(viewEngine(oakAdapter, ejsEngine));
app.use(router.routes());
app.use(router.allowedMethods());

function sqlcmd(sql, arg1) {
  console.log('sql:', sql)
  try {
    var results = db.query(sql, arg1)
    console.log('sqlcmd: results=', results)
    return results
  } catch (error) {
    console.log('sqlcmd error: ', error)
    throw error
  }
}
function postQuery(sql) {
  let list = []
  for (const [id, username, title, body] of sqlcmd(sql)) {
    list.push({id, username, title, body})
  }
  console.log('postQuery: list=', list)
  return list
}

function userQuery(sql) {
  let list = []
  for (const [id, username, password] of sqlcmd(sql)) {
    list.push({id, username, password})
  }
  console.log('userQuery: list=', list)
  return list
}
// function query(sql) {
//   let list = []
//   for (const [id, title, body] of db.query(sql)) {
//     list.push({id, title, body})
//   }
//   return list
// }
//===
async function parseFormBody(body) {
  const pairs = await body.form()
  const obj = {}
  for (const [key, value] of pairs) {
    obj[key] = value
  }
  return obj
}

async function signupUi(ctx) {
  // ctx.response.body = await render.signupUi();
  const user = await ctx.state.session.get('user') || null;
  ctx.render("views/signup.ejs", { user });
}

async function signup(ctx) {
  const body = ctx.request.body
  if (body.type() === "form") {
    var user = await parseFormBody(body)
    console.log('user=', user)
    var dbUsers = userQuery(`SELECT id, username, password FROM users WHERE username='${user.username}'`)
    console.log('dbUsers=', dbUsers)
    if (dbUsers.length === 0) {
      sqlcmd("INSERT INTO users (username, password) VALUES (?, ?)", [user.username, user.password]);
      // ctx.response.body = render.success()
      ctx.response.body = await ctx.render("views/success.ejs", { user });
    } else 
      // ctx.response.body = render.fail()
      ctx.response.body = await ctx.render("views/fail.ejs", { user });
    }
}

async function loginUi(ctx) {
  // ctx.response.body = await render.loginUi();
  const user = await ctx.state.session.get('user') || null;
  ctx.render("views/login.ejs", { user });

}

async function login(ctx) {
  const body = ctx.request.body
  if (body.type() === "form") {
    var user = await parseFormBody(body)
    var dbUsers = userQuery(`SELECT id, username, password FROM users WHERE username='${user.username}'`) // userMap[user.username]
    var dbUser = dbUsers[0]
    if (dbUser.password === user.password) {
      ctx.state.session.set('user', user)
      console.log('session.user=', await ctx.state.session.get('user'))
      ctx.response.redirect('/');
    } else {
      // ctx.response.body = render.fail()
      ctx.response.body = await ctx.render("views/fail.ejs", { user });
    }
  }
}

async function logout(ctx) {
   ctx.state.session.set('user', null);
   ctx.response.redirect('/');
}

async function userlist(ctx) {
  let users = userQuery("SELECT id, username, password  FROM users")
  // ctx.render("views/list.ejs", {posts});
  console.log('list:posts=', users) 
  const user = await ctx.state.session.get('user');
  console.log('list:user=', user)
  await ctx.render('views/userlist.ejs', { users, user });
}

async function listUserPosts(ctx) {
  const user = ctx.params.user;
  console.log('username=', user)
  console.log('user list:')
  let users = userQuery(`SELECT id, username, password FROM users WHERE username='${user}'`)
  console.log('list:users=', users)
  let posts = postQuery(`SELECT id, username, title, body FROM posts WHERE username='${user}'`)
  console.log('list:posts=', posts)
  // console.log('users.username:',users.username,',posts.username:',posts.username)
  if (!posts[user]) {
    posts[user] = []; 
  }
  // ctx.response.body = await render.listUserPosts(user, posts);
  await ctx.render('views/userpostlist.ejs', { posts, user });
}
//---
async function list(ctx) {
  let posts = postQuery("SELECT id, username, title, body FROM posts")
  // ctx.render("views/list.ejs", {posts});
  console.log('list:posts=', posts) 
  const user = await ctx.state.session.get('user');
  console.log('list:user=', user)
  await ctx.render('views/list.ejs', { posts, user });
}

async function add(ctx) {
  var user = await ctx.state.session.get('user')
  if (user != null) {
    ctx.render("./views/add.ejs", { user });
  } else {
    ctx.render("./views/needlogin.ejs", { user });
  }
  
}

async function show(ctx) {
  const user = await ctx.state.session.get('user') || null;
  const pid = ctx.params.id;
  let posts = postQuery(`SELECT id, username, title, body FROM posts WHERE id=${pid}`)
  let post = posts[0]
  console.log('show:post=', post)
  if (!post) ctx.throw(404, 'invalid post id');
  ctx.render('views/show.ejs', {post,user})
}

async function create(ctx) {
  const body = ctx.request.body
  if (body.type() === "form") {
    const pairs = await body.form()
    const post = {}
    for (const [key, value] of pairs) {
      post[key] = value
    }
    console.log('create:post=', post)
    // db.query("INSERT INTO posts (title, body) VALUES (?, ?)", [post.title, post.body]);
    var user = await ctx.state.session.get('user')
    if (user != null) {
      console.log('user=', user)
      sqlcmd("INSERT INTO posts (username, title, body) VALUES (?, ?, ?)", [user.username, post.title, post.body]);  
    } else {
      ctx.throw(404, 'not login yet!');
    }
    ctx.response.redirect('/');
  }
}

async function pub(ctx) { 
  // console.log(ctx.params);
  var path = ctx.params[0]
  await send(ctx, path, {
    root: Deno.cwd()+'/public',
    index: "index.html",
  });
}

console.log('Server run at http://127.0.0.1:8000')
await app.listen({ port: 8000 });
