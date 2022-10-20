import constants from '../lib/constants.js';

const activities = async function (fastify, opts) {
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