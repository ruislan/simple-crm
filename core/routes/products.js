const products = async function (fastify, opts) {
    // 查询
    fastify.get('/search', async (req, reply) => {
        let { name, available } = req.query;
        const whereClause = { name: { contains: name || '' } };
        if (available) whereClause.available = available === 'true';
        const data = await fastify.db.product.findMany({ where: whereClause });
        return reply.code(200).send({ data });
    })
};

export default products;