import fs from 'fs';

const regions = JSON.parse(fs.readFileSync('./public/regions.json'));

const customers = async function (fastify, opts) {
    fastify.post('/:id/delete', async (req, reply) => {
        const id = Number(req.params.id || 0);
        // only admin can delete
        if (!req.session.user.isAdmin) return reply.code(403).send();
        const deleteRefPhotos = fastify.db.photo.deleteMany({ where: { customerId: id } });
        const deleteCustomer = fastify.db.customer.delete({ where: { id } });
        await fastify.db.$transaction([deleteRefPhotos, deleteCustomer]);
        return reply.code(200).send();
    });

    fastify.put('/:id/stage', async (req, reply) => {
        const id = Number(req.params.id || 0);
        let { stageId } = req.body;
        const customer = await fastify.db.customer.findUnique({ where: { id } });

        // admin can edit
        // others can only do it which were assigned to them
        if (!customer || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        await fastify.db.customer.update({
            where: { id },
            data: { stageId: Number(stageId) || customer.stageId },
        });
        return reply.code(200).send();
    });

    fastify.post('/:id/link', async (req, reply) => {
        const id = Number(req.params.id || 0);
        let { subject, content, typeId } = req.body;
        const customer = await fastify.db.customer.findUnique({ where: { id } });
        // TODO validate params
        // admin can add any
        // others can only do it which were assigned to them
        if (!customer || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        await fastify.db.linking.create({
            data: {
                subject,
                content,
                typeId: Number(typeId) || 0,
                userId: req.session.user.id,
                customerId: customer.id,
            },
        });
        return reply.code(200).send();
    });

    fastify.get('/:id/link', async (req, reply) => {
        const id = Number(req.params.id || 0);
        let data = [];
        const customer = await fastify.db.customer.findUnique({ where: { id } });
        // admin can view all
        // others can only view the customers which were assigned to them
        if (customer && (req.session.user.isAdmin || req.session.user.id === customer.userId)) {
            data = await fastify.db.linking.findMany({
                where: { customerId: customer.id, },
                include: {
                    type: true,
                    user: {
                        select: {
                            name: true,
                            id: true,
                        },
                    }
                },
                orderBy: [{ updatedAt: 'desc' }]
            });
        }
        return reply.code(200).send({ data });
    });

    fastify.get('/:id', async (req, reply) => {
        const id = Number(req.params.id || 0);
        const customer = await fastify.db.customer.findUnique({
            where: { id },
            include: { photos: true, stage: true, }
        });
        if (!customer) return reply.redirect('/not-found');
        // admin can view all
        // others can only view the customers which were assigned to them
        if (!req.session.user.isAdmin && req.session.user.id != customer.userId) return reply.redirect('/not-found');
        const stages = await fastify.db.stage.findMany();
        return reply.view('customers/detail.html', { data: { customer, stages } });
    });

    fastify.post('/:id/acquire', async (req, reply) => {
        const id = Number(req.params.id || 0);
        await fastify.db.customer.update({
            where: { id },
            data: { userId: req.session.user.id, stageId: 1 }
        });
        return reply.code(200).send();
    });

    fastify.get('/my', async (req, reply) => {
        const stages = await fastify.db.stage.findMany();
        return reply.view("customers/my.html", { data: { stages } });
    });

    fastify.get('/', async (req, reply) => reply.view("customers/index.html"));

    fastify.get('/search', async function (req, reply) {
        // params
        let { keyword, province, city, skip, stageId, limit, my } = req.query;
        const provinceText = province ? regions['0'][province] : null;
        const cityText = city ? regions[`0,${province}`][city] : null;
        skip = Number(skip) || 0;
        limit = Number(limit) || 15;
        my = Boolean(my) || false;
        stageId = Number(stageId) || null;
        // process
        let whereClause = { userId: null };
        if (provinceText) whereClause.province = { contains: provinceText };
        if (cityText) whereClause.city = { contains: cityText };
        if (keyword) whereClause.name = { contains: keyword };
        if (stageId) whereClause.stageId = stageId;
        if (my) whereClause.userId = req.session.user.id;

        const count = await fastify.db.customer.count({ where: whereClause });
        const data = await fastify.db.customer.findMany({
            where: whereClause,
            include: {
                photos: true,
                stage: true,
            },
            skip,
            take: limit,
        });

        for (const item of data) {
            if (!req.session.user.isAdmin && item.userId != req.session.user.id) { // 不是admin也不是自己的 掩盖 联系方式, 
                if (item.phone && item.phone.length > 3) {
                    item.phone = item.phone.substring(0, 3) + '***';
                }
            }
        }

        // result
        return reply.code(200).send({ data, count, skip, limit });
    });
};

export default customers;