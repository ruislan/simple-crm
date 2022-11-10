import path from 'path';
import fastifyView from '@fastify/view';
import fastifySession from '@fastify/session';
import fastifyCookie from '@fastify/cookie';
import fastifyFormbody from '@fastify/formbody';
import fastifyMultipart from '@fastify/multipart';
import fastifyWebSocket from '@fastify/websocket';
import nunjucks from 'nunjucks';
import minifier from 'html-minifier';
import auth from './lib/auth.js';
import events from './lib/events.js';
import customers from './routes/customers.js';
import home from './routes/home.js';
import settings from './routes/settings.js';
import system from './routes/system/index.js';
import links from './routes/links.js';
import users from './routes/users.js';
import tags from './routes/tags.js';
import activities from './routes/activities.js';
import statistic from './routes/statistic.js';

const scService = async function (fastify, opts) {
    await fastify.register(fastifyView, {
        engine: { nunjucks },
        root: path.join(process.cwd(), './views'),
        options: {
            watch: process.env.NODE_ENV === 'dev' ? true : false,
            useHtmlMinifier: minifier,
            htmlMinifierOptions: {
                removeComments: true,
                removeCommentsFromCDATA: true,
                collapseWhitespace: true,
                collapseBooleanAttributes: true,
                removeAttributeQuotes: false,
                removeEmptyAttributes: false
            }
        }
    });
    await fastify.register(fastifyFormbody);
    await fastify.register(fastifyCookie);
    await fastify.register(fastifySession, {
        secret: process.env.SESSION_SECRET,
        expires: Number(process.env.SESSION_EXPIRES_IN) || 1800000,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
        },
    });
    await fastify.register(fastifyMultipart, {
        limits: {
            fileSize: Number(process.env.MULTIPART_FILE_SIZE_LIMIT) || 12582912  // 12MB,
        }
    });
    await fastify.register(fastifyWebSocket);

    // init some useful functions
    fastify.addHook('onRequest', async (req, reply) => {
        req.isJsonRequest = function () {
            return req && (req.headers['content-type'] || '').includes('application/json');
        };
        req.isJsonResponse = function () {
            return req && (req.headers['accept'] || '').includes('application/json');
        };
    });
    // init auth
    auth.config({
        forbiddenUrl: '/forbidden',
        loginUrl: '/login',
        excludes: [
            '/not-found'
        ]
    });
    fastify.addHook('onRequest', auth.requireAuth);

    events.init(fastify); // init event handlers

    // init routes
    await fastify.register(home, { prefix: '/' });
    await fastify.register(customers, { prefix: '/customers' });
    await fastify.register(settings, { prefix: '/settings' });
    await fastify.register(links, { prefix: '/links' });
    await fastify.register(users, { prefix: '/users' });
    await fastify.register(tags, { prefix: '/tags' });
    await fastify.register(activities, { prefix: '/activities' });
    await fastify.register(statistic, { prefix: '/statistic' });
    await fastify.register(system, { prefix: '/system' });

    // init error handler
    fastify.setNotFoundHandler(function (req, reply) {
        const isJsonResponse = req.isJsonResponse();
        isJsonResponse ? reply.status(404).send() : reply.redirect('/not-found');
    });
};

export default scService;