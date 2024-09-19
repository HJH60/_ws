import { Application } from "https://deno.land/x/oak/mod.ts";

const app = new Application();

app.use((ctx) => {
  console.log('url=', ctx.request.url)
  let pathname = ctx.request.url.pathname
  if (pathname == '/') {
    ctx.response.body = `<html>
<body>
<h1>我的自我介紹</h1>
<ol>
<li><a href="/name">姓名:胡佳慧</a></li>
<li><a href="/age">年齡:21</a></li>
<li><a href="/gender">性別:女</a></li>
<li><a href="/school">學校:NQU</a></li>
</ol>
</body>
</html>
`
  } else if (pathname == '/name') {
    ctx.response.body = '胡佳慧'
  } else if (pathname == '/age') {
    ctx.response.body = '21 years old'
  } else if (pathname == '/gender') {
    ctx.response.body = '女'
  } else if (pathname == '/school') {
    ctx.response.body = 'NQU 國立金門大學'
  } else {
    ctx.response.body = 'Not Found!'
  }
});

console.log('start at : http://127.0.0.1:8000')
await app.listen({ port: 8000 })