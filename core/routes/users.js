const users = async function (fastify, opts) {
    fastify.get('/', async (req, reply) => {
        const data = await fastify.db.user.findMany({
            select: {
                id: true,
                name: true,
                phone: true,
            },
        });
        return reply.code(200).send({ data });
    });
};

export default users;