import constants from '../lib/constants.js';

const activities = async function (fastify, opts) {
    fastify.get('/', async (req, reply) => {
        let { userId, skip, limit } = req.query;
        userId = Number(userId);
        // admin can view every user, user can only view himself.
        if (!userId || !req.session.user.isAdmin) userId = req.session.user.id;

        const user = await fastify.db.user.findUnique({ where: { id: userId } });
        const isJsonRequest = (req.headers['content-type'] || '').startsWith('application/json');
        if (!isJsonRequest) return reply.view('activities.html', { data: { user: { id: user.id, name: user.name } } });

        skip = Number(skip) || constants.DEFAULT_PAGE_SKIP;
        limit = Number(limit) || constants.DEFAULT_PAGE_SIZE;

        const count = await fastify.db.activity.count({ where: { userId: user.id }, });
        const data = await fastify.db.activity.findMany({
            skip,
            take: limit,
            where: { userId: user.id },
            orderBy: [{ createdAt: 'desc' }]
        });
        return reply.code(200).send({ data, count, skip, limit });
    });

    fastify.get('/my', async (req, reply) => {
        let { skip, limit } = req.query;
        skip = Number(skip) || constants.DEFAULT_PAGE_SKIP;
        limit = Number(limit) || constants.DEFAULT_PAGE_SIZE;
        const data = await fastify.db.activity.findMany({
            skip,
            take: limit,
            where: { userId: req.session.user.id },
            orderBy: [{ createdAt: 'desc' }]
        });
        return reply.code(200).send({ data });
    });
};

export default activities;