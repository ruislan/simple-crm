import constants from '../lib/constants.js';

const customers = async function (fastify, opts) {
    // 创建
    fastify.post('/', async (req, reply) => {
        const { name, phone } = req.body;
        // only admin can create
        if (!req.session.user.isAdmin) return reply.code(403).send();
        const id = await fastify.db.customer.create({ data: { name, phone, creatorId: req.session.user.id } });
        return reply.code(200).send({ id });
    });
    // 修改
    fastify.put('/:id', async (req, reply) => {
        const id = Number(req.params.id || 0);
        const { name, phone, type, province, city, area, address } = req.body;
        // only admin can edit
        if (!req.session.user.isAdmin) return reply.code(403).send();
        await fastify.db.customer.update({ where: { id }, data: { name, phone, type, province, city, area, address } });
        return reply.code(200).send();
    });
    // 删除
    fastify.delete('/', async (req, reply) => {
        let { ids } = req.body || { ids: [] };
        if (ids && ids.length > 0) {
            ids = ids.map(id => Number(id)).filter(id => id);
            // only admin can delete
            if (!req.session.user.isAdmin) return reply.code(403).send();
            const deleteRefPhotos = fastify.db.photo.deleteMany({ where: { customerId: { in: ids } } });
            const deleteCustomer = fastify.db.customer.deleteMany({ where: { id: { in: ids } } });
            await fastify.db.$transaction([deleteRefPhotos, deleteCustomer]);
        }
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

    fastify.post('/:id/links', async (req, reply) => {
        const id = Number(req.params.id || 0);
        let { subject, content, typeId } = req.body;
        const customer = await fastify.db.customer.findUnique({ where: { id } });
        // TODO validate params
        // admin can add any
        // others can only do it which were assigned to them
        if (!customer || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        await fastify.db.link.create({
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

    fastify.get('/:id/links', async (req, reply) => {
        const id = Number(req.params.id || 0);
        let data = [];
        const customer = await fastify.db.customer.findUnique({ where: { id } });
        // admin can view all
        // others can only view the customers which were assigned to them
        if (customer && (req.session.user.isAdmin || req.session.user.id === customer.userId)) {
            data = await fastify.db.link.findMany({
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

    // 认领
    fastify.post('/acquire', async (req, reply) => {
        let { ids } = req.body || { ids: [] };
        if (ids && ids.length > 0) {
            ids = ids.map(id => Number(id)).filter(id => id);
            await fastify.db.customer.updateMany({
                where: { id: { in: ids } },
                data: { userId: req.session.user.id, stageId: 1 } // XXX: magic number
            });
        }
        return reply.code(200).send();
    });

    fastify.get('/my', async (req, reply) => {
        const stages = await fastify.db.stage.findMany({ orderBy: [{ createdAt: 'desc' }] });
        return reply.view("customers/my.html", { data: { stages } });
    });

    fastify.get('/', async (req, reply) => reply.view("customers/index.html"));

    fastify.get('/search', async function (req, reply) {
        // params
        let { keyword, province, city, skip, stageId, limit, my } = req.query;
        const provinceText = province ? fastify.regions['0'][province] : null;
        const cityText = city ? fastify.regions[`0,${province}`][city] : null;
        skip = Number(skip) || constants.DEFAULT_PAGE_SKIP;
        limit = Number(limit) || constants.DEFAULT_PAGE_SIZE;
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
            orderBy: [{ createdAt: 'desc' }]
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