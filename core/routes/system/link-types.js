const linkTypes = async function (fastify, opts) {
    fastify.get('/', async (req, reply) => reply.view('system/link-types.html'));

    fastify.post('/', async (req, reply) => {
        let { id, name } = req.body;
        if (id) {
            await fastify.db.linkType.update({
                data: { name },
                where: { id: Number(id) },
            });
        } else {
            // validate the field name ?
            await fastify.db.linkType.create({ data: { name } });
        }
        return reply.code(200).send();
    });

    fastify.delete('/:id', async (req, reply) => {
        const id = Number(req.params.id);

        const count = await fastify.db.link.count({ where: { typeId: id } });
        if (count > 0) return reply.code(400).send({ message: '无法删除：该类别下还有联系信息，请先将联系信息的类别进行转换。' });
        await fastify.db.linkType.delete({ where: { id } });

        return reply.code(200).send();
    });

    fastify.get('/search', async (req, reply) => {
        let { name } = req.query;
        const data = await fastify.db.linkType.findMany({
            where: {
                name: {
                    contains: name || '',
                }
            }
        });
        return reply.code(200).send({ data });
    })
};

export default linkTypes;