import fastify from 'fastify';
import dotenv from 'dotenv';
import path from 'path';
import fastifyStatic from '@fastify/static';
import prismaPlugin from './plugins/prisma.js';
import bcryptPlugin from './plugins/bcrypt.js';
import regionsPlugin from './plugins/regions.js';
import storagePlugin from './plugins/storage.js';
import coreService from './core/index.js';

const main = async function () {
    dotenv.config();
    const server = fastify({
        logger: {
            transport: process.env.NODE_ENV === 'dev' ? {
                target: 'pino-pretty'
            } : undefined,
            level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
        },
    });

    // plugins
    await server.register(bcryptPlugin); // global 
    await server.register(prismaPlugin); // global 
    await server.register(storagePlugin, { base: './public/uploads', urlPrefix: '/public/uploads' }); // global
    await server.register(regionsPlugin, { web: true }); // global 
    await server.register(fastifyStatic, { root: path.join(process.cwd(), './public'), prefix: '/public', }); // static service
    await server.register(coreService); // our service

    server.ready(() => {
        console.log(server.printPlugins());
        console.log(server.printRoutes({ commonPrefix: false }));
    });

    server.listen({ port: process.env.SERVER_PORT || 5600, host: '0.0.0.0' })
        .then((address) => console.log(`server listening on ${address}`))
        .catch(err => {
            server.log.error(err);
            process.exit(1);
        });
};

main();