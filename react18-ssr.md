### react18-ssr

#### 一、服务端渲染

我们的页面DOM结构由服务端产生的，就是服务端渲染。

```js
const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("<html><body><h2>hello</h2></body></html>");
});
app.listen(8300, () => {
  console.log("程序运行在8300接口");
});
```

#### 二、客户端渲染

+ 页面上的内容由于浏览器执行js脚本而渲染到页面上。
  - 浏览器访问服务器，服务器返回空的HTML页面，里边有一个js脚本client
  - 浏览器下载js代码，并在浏览器中运行。
  - 内容呈现在页面上。

##### 1、客户端的缺点

+ 首屏速度加载慢。
+ 不支持SEO和搜索引擎优化。
+ 首页需要请求来初始化数据。

#### 三、同构渲染

##### 1、什么是同构渲染？

+ 同构渲染的项目支持服务端渲染和客户端渲染。

+ 第一次访问是服务端渲染（ssr），后边的路由切换访问是客户端渲染（SPA），可以支持爬虫（SEO）。
+ 客户端和服务端同构可以复用一部分代码。

#### 四、创建项目

##### 1、安装依赖

```bash
npm install react react-dom webpack webpack-cli babel-loader @babel/core  @babel/preset-env @babel/preset-react --save
```

+ babel-loader  的作用是相对于一个交通指挥， 只是在webpack打包时遇到js文件，交给babel处理 。
+  @babel/core是我们使用Bable进行转码的核心npm包 
+  @babel/preset-env 这是一个智能预设，它允许你使用最新的 JavaScript 语法，而无需对目标环境需要哪些语法转换进行管理。 
+ @babel/preset-react 将react转换成js文件包。

##### 2、配置webpck.config.js文件

```js
const path = require("path");

module.exports = {
  mode: "development",
  devtool: false,
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "build"),
  },
  watch: true,
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-env", "@babel/preset-react"],
        },
      },
    ],
  },
};
```

##### 3、配置编译命令

```json
"scripts": {"build": "webpack"}
```

#### 五、水合（hydrateRoot）

+ 水合是指其他物质溶于水发生化学反应
+ 此处水合是指后端数据达到前端后，js绑定事件，才能够响应用户的操作或者DOM的更新。
+ 工作流程（将事件比作水）
  - 组件在服务器拉取数据，并在服务端首次渲染。
  - 脱水，对组件进行脱水，变成HTML字符串，脱去交互事件，成为风干标本快照。
  - 注水，发送到客户端后，重新注入数据（交互的事件），重新变成可交互组件。

此过程类似于银耳，长成后晒干，然后加入水再泡发。

```js
import React from "react";
import App from "./page/App/index.jsx";
import { hydrateRoot } from "react-dom/client";

const root = document.getElementById("root");
const element = <App />
hydrateRoot(root, element);
```

#### 六、以前的服务端渲染

##### 1、工作流程

+ 服务器内部获取数据。
+ 服务器内部渲染HTML.
+ 客户端从远程加载代码。
+ 客户端开始水合。

##### 2、缺点

+ 一切都是串行的，一个没有结束，后边都要等待。
+ 这个操作必须是整体性的，而水合的过程比较慢，会引起卡顿。

##### 3、项目代码

+ service.js文件

```js
const express = require("express");
const register = require("@babel/register");
register({
  ignore: [/node_modules/],
  presets: ["@babel/preset-env", "@babel/preset-react"],
  plugins: ["@babel/plugin-transform-modules-commonjs"],
});
const static = require('serve-static');
const webpack = require("webpack");
const render = require("./oldRender");
const webpackConfig = require("./webpack.config");

webpack(webpackConfig, (error, status) => {
  const statusJson = status.toJson({ assets: true });
  const assets = statusJson.assets.reduce((item, { name }) => {
    item[name] = `/${name}`;
    return item;
  }, {});
  console.log(assets, 'assets')
  const app = express();
  app.get("/", (req, res) => {
    render(req, res, assets);
  });
  app.use(static('build'));
  app.listen(8100, () => {
    console.log("运行在8100端口");
  });
});

```

+ render函数代码

```js
import React from "react";
import App from "./src/page/App";
import { renderToString } from "react-dom/server";

function render(req, res, assets) {
  const html = renderToString(<App />);
  res.statusCode = "200";
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ssr</title>
    </head>
    <body>
      <div id="root">${html}</div>
      <script src="${assets["main.js"]}"></script>
    </body>
    </html>`
  );
}

module.exports = render;

```

**注意： 由于render函数中即使用了commonjs，又使用了es的代码，所以，servicejs文件中使用了@babel/register插件进行转换，将es转换成commonjs进行执行。**

#### 七、react18的ssr

##### 1、特性

+ 选择性水合，可以在局部进行水合。
+ 像流水一样，打造一个从服务端到客户端的持续不断的渲染管线。而不是renderToString那样一次性渲染。

+ 服务端渲染把简单的res.send改为```res.socket```这样就把一次渲染转变为持续性行为。
+ 打破了以前串行的限制，优化前端的加载速度和可交互所需等待时间。
+ 服务器端的流式HTML使用 ```renderToPipeableStream``` 
+ 客户端的水合使用 hydrateRoot ，需要调用接口组件使用```<Suspense/>```包裹。

+ 需要请求的组件会先返回一个```<template></template>```占位，然后再替换。

##### 2、新版ssr代码：

+ service.js文件不变，render函数做出如下修改：

```js
import React from "react";
import App from "./src/page/App";
import { renderToPipeableStream } from "react-dom/server";

function render(req, res, assets) {
  console.log(req.url, "asaaaa");
  const { pipe } = renderToPipeableStream(<App />, {
    bootstrapScripts: [assets["main.js"]],
    onShellReady() {
      res.statusCode = "200";
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.write(`<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ssr</title>
      </head>
      <body>
        <div id="root">`);
      pipe(res);
      res.write(`</div>
    </body>
    </html>`);
    },
  });
}

module.exports = render;
```

#### 八、useId

+ 客户端和服务端保持一致的id

#### 九、项目搭建附录

##### 1、安装插件

```bash
npm install @babel/core @babel/preset-env  @babel/preset-react babel-loader express react-router-dom webpack webpack-cli @babel/plugin-transform-modules-commonjs @babel/register cross-env nodemon react react-dom --save
```

##### 2、webpack.config.js

```js
const path = require("path");

module.exports = {
  mode: "development",
  devtool: false,
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "build"),
  },
  watch: true,
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-env", "@babel/preset-react"],
        },
      },
    ],
  },
};

```

