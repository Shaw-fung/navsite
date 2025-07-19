# NavSite

## 项目简介
NavSite 是一个基于 Cloudflare Worker 和 Cloudflare KV 快速搭建的高交互导航站，支持在线后台管理，适合个人或团队快速部署自己的网址导航。  
项目地址：[Shaw-fung/navsite](https://github.com/Shaw-fung/navsite)

---

## 功能特色
- **极简部署**：无需服务器，依托 Cloudflare Worker 搭建，资源消耗低，维护便捷。
- **数据持久化**：所有导航数据存储在 Cloudflare KV，安全可靠，支持高并发读取。
- **后台管理**：自带美观易用的后台管理系统，支持分类管理、添加、修改、删除导航项。
- **多主题切换**：主页支持明亮/暗黑模式一键切换，界面美观，适应不同使用习惯。
- **自定义域名**：可绑定自己的域名，打造专属导航站点。
- **安全登录**：支持后台账号密码登录，初次登录后建议及时修改密码以确保安全。
- **移动端适配**：页面适配各类主流设备，手机、平板、PC均有良好体验。

---

## 项目截图

****

明亮模式主页：

![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/home-light.jpg?raw=true)

暗黑模式主页：

![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/home-dark.jpg?raw=true)

后台登录页面：

![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/admin-login.jpg?raw=true)

后台管理页面：

![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/admin-dashboard.jpg?raw=true)

---

## 快速部署指南

### 1. 创建 KV 命名空间
登录 Cloudflare，进入 **存储和数据库 > KV**，创建一个新的命名空间（如：MyHomePage_DB）。

### 2. 新建 Worker 服务
依次点击 **计算 > Workers 和 Pages**，点击右上角“创建”，选择“从 Hello World！开始”，新建 Worker 项目。

### 3. 替换 Worker 代码
进入 Worker 编辑页面，将默认代码替换为本项目 `worker.js` 的全部内容，然后点击部署。

### 4. 绑定 KV 命名空间
在 Worker 服务的绑定设置中，添加 KV 命名空间绑定，变量名填写 `NAV_DB`，选择刚才创建的命名空间。

### 5. 绑定自定义域名（可选）
为 Worker 服务绑定自己的域名，提升访问体验。

### 6. 访问及后台管理
完成以上步骤后，用绑定域名或 Worker 默认域名访问你的导航站。  
后台默认登录账号：admin  
默认密码：admin123  
请第一时间进入后台修改账号密码！

### 详细安装步骤演示：[查看](https://github.com/Shaw-fung/navsite/blob/main/install.md)。
---

## 常见问题

如遇到部署问题或功能疑问，欢迎提交 [Issues](https://github.com/Shaw-fung/navsite/issues/new)。

---


> 技术让导航更简单，欢迎 Star & Fork！