const stages = async function (fastify, opts) {
    fastify.get('/', async (req, reply) => reply.view('system/stages.html'));

    fastify.post('/', async (req, reply) => {
        let { id, name, sequence, color } = req.body;
        if (id) {
            await fastify.db.stage.update({
                data: { name, sequence: Number(sequence) || 100, colorHex: color },
                where: { id: Number(id) },
            });
        } else {
            // validate the field name ?
            await fastify.db.stage.create({ data: { name, sequence: Number(sequence) || 100, colorHex: color } });
        }
        return reply.code(200).send();
    });

    fastify.delete('/:id', async (req, reply) => {
        const id = Number(req.params.id);

        const customerCount = await fastify.db.customer.count({ where: { stageId: id } });
        if (customerCount > 0) return reply.code(400).send({ message: '无法删除：该阶段下还有客户，请先将客户的阶段进行转移。' });

        await fastify.db.stage.delete({ where: { id } });
        return reply.code(200).send();
    });

    fastify.get('/search', async (req, reply) => {
        let { name } = req.query;
        const data = await fastify.db.stage.findMany({
            where: {
                name: {
                    contains: name || '',
                }
            }
        });
        return reply.code(200).send({ data });
    })
};

export default stages;