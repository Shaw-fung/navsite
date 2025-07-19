## NavSite

### 具体安装步骤演示：

1、登录CloudFlare，点击左侧“存储和数据库”，进入“KV”，点击右上角创建KV命名空间（Create Instance），输入命名空间名称（如：MyHomePage_DB），点击创建。

![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/1.jpg?raw=true)![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/2.jpg?raw=true)

2、依次点击左侧“计算 （Workers）”、Workers 和 Pages，在点击右上角的创建按钮，点击“从Hello World！开始”后面的“开始项目”，然后进行修改或不修改名称，点击部署。

![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/3.jpg?raw=true)![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/4.jpg?raw=true)![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/5.jpg?raw=true)

3、部署成功后，点击右上角的编辑代码，然后将原始代码全部删除，粘贴进本项目开源的worker.js的所有代码，然后点击部署。

![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/6.jpg?raw=true)![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/7.jpg?raw=true)

4、部署成功后，点击返回，再点击“绑定”，然后点击“添加绑定”，弹出对话框，选择KV命名空间，最后点击添加绑定。

![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/8.jpg?raw=true)![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/9.jpg?raw=true)![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/10.jpg?raw=true)

5、开始进行KV命名空间绑定：变量名称填“NAV_DB”，KV命名空间选择我们之前创建的命名空间名称（如：MyHomePage_DB），然后点击“添加绑定”。

![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/11.jpg?raw=true)

6、最后一步，因为一些特殊原因咱们无法直接访问workers.dev域名，建议绑定我们自己的域名，操作见下图：

![avatar](https://github.com/Shaw-fung/navsite/blob/main/Screenshot/12.jpg?raw=true)


---

### 7. 访问及后台管理
完成以上步骤后，用绑定域名或 Worker 默认域名访问你的导航站。  
后台默认登录账号：admin  
默认密码：admin123  
请第一时间进入后台修改账号密码！