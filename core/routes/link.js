const link = async function (fastify, opts) {
    fastify.get('/types', async (req, reply) => {
        const data = await fastify.db.linkType.findMany();
        return reply.code(200).send({ data });
    });
};

export default link;