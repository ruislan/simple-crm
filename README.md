# Simple CRM

## 简介

不懂CRM，没有关系，你只要会做业务，就会用Simple CRM。
没有什么难以理解的概念，不需要更多的文化和知识，适合中小微企业。
从寻找客户，联系客户，管理客户，最后达到成交，以及维持关系。都是你熟悉的事情。

## 技术栈

* Language: NodeJS v16.17.1
* Framework: Fastify
* Database: SQLite
* ORM: Prisma
* Styling: Bootstrap v5

## 环境和工具

* OS: macOS Monterey
* IDE: Visual Studio Code
* DBTool: Beekeeper Studio

## 功能

### 用户

1. 用户列表 O
2. 用户的添加、编辑和删除 O
3. 用户的登录和登出 O
4. 用户的基本信息修改 O
5. 用户的密码修改 O
6. 用户的锁定和解锁 O
7. 用户操作记录，便于审计

### 客户

1. 客户列表 O
2. 客户明细 O
3. 客户上传、删除图片 O
4. 转交客户 O
5. 退回客户 O
6. 编辑客户 O
7. 删除客户 O
8. 对客户添加、修改和删除联系 O
9. 数据获取 G和B （O）
10. 向客户添加和删除标签 O
11. 标签增加颜色，方便辨识 O
12. 未认领客户，筛选时可以进行屏蔽 O
13. 客户阶段增加颜色，方便辨识 O
14. 客户位置地图展示

### 收益

1. 客户收益创建
2. 客户收益编辑
3. 客户收益删除
4. 收益统计
5. 收益预测

### 配置

1. 联系类型的创建、编辑和删除 O
2. 客户阶段的创建、编辑和删除 O
3. 客户标签的创建、编辑和删除 O

### 待思考功能

1. 客户联系可以直接发邮件（对接邮件服务器？）
2. 客户联系可以直接打电话（对接call center？）
3. 客户联系可以直接开视频会议（对接视频会议？）

## 截图

<div>
    <img src="./docs/screenshots/screenshot_dashboard.png" width="25%">
    <img src="./docs/screenshots/screenshot_customers.png" width="25%">
    <img src="./docs/screenshots/screenshot_my_customers.png" width="25%">
    <img src="./docs/screenshots/screenshot_customer_detail.png" width="25%">
    <img src="./docs/screenshots/screenshot_customer_detail_2.png" width="25%">
    <img src="./docs/screenshots/screenshot_system_dataset.png" width="25%">
    <img src="./docs/screenshots/screenshot_system_link_type.png" width="25%">
    <img src="./docs/screenshots/screenshot_system_user.png" width="25%">
</div>

## 运行

修改.env.example为.env，并且填入两个地图对应的的API调用KEY，是服务端KEY，这个可以到对应的地图开发者页面免费申请。没有KEY也可以使用，只是不能收集数据。

```shell
git clone https://github.com/ruislan/simple-crm.git
cd simple-crm
yarn install
yarn prisma db push
yarn prisma db seed
yarn start:dev
```

Win环境下注意修改命令start:dev，将NODE_ENV单独设置为dev。
启动成功后访问：<http://localhost:5600>

```text
Admin User
User: admin
Pass: 123123

Normal User
User: user1
Pass: 123123
```

## Docker

docker build --pull --rm -f "Dockerfile" -t simple-crm:latest "server"

docker run --rm -d  -p 5700:5700/tcp simple-crm:latest
