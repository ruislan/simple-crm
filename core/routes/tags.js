const tags = async function (fastify, opts) {
    fastify.get('/', async (req, reply) => {
        let { customerId } = req.query;
        const refs = await fastify.db.customerTagRef.findMany({ where: { customerId: Number(customerId) } });
        const tagIds = refs.map(ref => ref.tagId);
        let condition = { take: 15 };
        if (tagIds.length > 0) condition.where = { NOT: { id: { in: tagIds } } };
        const data = await fastify.db.tag.findMany(condition);
        return reply.code(200).send({ data });
    });
};

export default tags;