const products = async function (fastify, opts) {
    // 展示页面
    fastify.get('/', async (req, reply) => reply.view('system/products.html'));

    // 创建或者更新
    fastify.post('/', async (req, reply) => {
        let { id, name, unit, sku, description, price, available } = req.body;
        // validate fields?
        const data = {
            name,
            unit,
            sku,
            description,
            available,
            price: Number(price) || 0,
        };
        if (id) {
            await fastify.db.product.update({
                data,
                where: { id: Number(id) },
            });
        } else {
            await fastify.db.product.create({ data });
        }
        return reply.code(200).send();
    });

    // 上架
    fastify.post('/:id/available', async (req, reply) => {
        const id = Number(req.params.id);
        await fastify.db.product.update({
            data: { available: true },
            where: { id: Number(id) },
        });
        return reply.code(200).send();
    });

    // 下架
    fastify.post('/:id/unavailable', async (req, reply) => {
        const id = Number(req.params.id);
        await fastify.db.product.update({
            data: { available: false },
            where: { id: Number(id) },
        });
        return reply.code(200).send();
    });

    // 删除
    fastify.delete('/:id', async (req, reply) => {
        const id = Number(req.params.id);
        const usedCount = await fastify.db.contractProduct.count({ where: { productId: id } });
        if (usedCount > 0) return reply.code(400).send({ message: '无法删除：该产品有合同在使用。' });
        await fastify.db.product.delete({ where: { id } });
        return reply.code(200).send();
    });

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