FROM node:16-alpine

ENV TZ=Asia/Shanghai
ENV NODE_ENV dev

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY build /usr/src/app
WORKDIR /usr/src/app
RUN yarn install
RUN yarn prisma db push
RUN yarn prisma db seed

EXPOSE 5700
ENTRYPOINT ["node", "server.js"]