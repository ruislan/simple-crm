# Simple CRM

## 简介

不懂CRM，没有关系，你只要会做业务，就会用Simple CRM。
没有什么难以理解的概念，不需要更多的文化和知识，适合几乎所有的销售场景，
从发掘销售机会，到联系客户，管理客户，最后达到成交，以及维持关系。都是你熟悉的事情。

## Docker

docker build --pull --rm -f "Dockerfile" -t sc:latest "server"

docker run --rm -d  -p 5700:5700/tcp sc:latest

## TODO

TODO 全新的修改了数据底层，所有都要重新弄一下

1. 获取dataset的时候有个地理位置得不到
2. 表格适配手机
3. 表格去掉序号，容易引起误解