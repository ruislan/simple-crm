const tags = async function (fastify, opts) {
    fastify.get('/', async (req, reply) => reply.view('system/tags.html'));

    fastify.post('/', async (req, reply) => {
        let { id, name, color } = req.body;
        if (name && name.length < 1) return reply.code(400).send({ message: "名称至少需要1个字符" });
        if (id) {
            await fastify.db.tag.update({
                data: { name, colorHex: color },
                where: { id: Number(id) },
            });
        } else {
            await fastify.db.tag.create({ data: { name, colorHex: color } });
        }
        return reply.code(200).send();
    });

    fastify.delete('/:id', async (req, reply) => {
        const id = Number(req.params.id);
        // 直接删除即可，不需要管客户是否有这个标签
        await fastify.db.customerTagRef.deleteMany({ where: { tagId: Number(id) } });// 删除关系表内容
        await fastify.db.tag.delete({ where: { id } }); // 删除标签
        return reply.code(200).send();
    });

    fastify.get('/search', async (req, reply) => {
        let { name, skip, limit } = req.query;
        name = name || '';
        skip = Number(skip) || 0;
        limit = Number(limit) || 15;
        const count = await fastify.db.tag.count({ where: { name: { contains: name } } });
        const data = await fastify.db.tag.findMany({
            skip, take: limit,
            where: { name: { contains: name, } }
        });
        return reply.code(200).send({ data, count, skip, limit });
    })
};

export default tags;