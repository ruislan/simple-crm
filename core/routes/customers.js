import constants from '../lib/constants.js';

const customers = async function (fastify, opts) {
    // 创建或修改
    fastify.post('/', async (req, reply) => {
        // only admin can create or edit
        if (!req.session.user.isAdmin) return reply.code(403).send();

        const parts = req.parts();
        let body = { photos: [] };
        for await (const part of parts) {
            if (part.file) {
                const buffer = await part.toBuffer();
                const url = await fastify.storage.store(part.filename, buffer);
                body.photos.push(url);
            } else {
                body[part.fieldname] = part.value;
            }
        }
        let { id, name, phone, type, pcode, citycode, adcode, address, deletePhotoIds, photos } = body;
        id = Number(id);
        // 解析省市区
        const province = fastify.regions.parseProvince(pcode) || '';
        const city = fastify.regions.parseProvince(citycode) || '';
        const area = fastify.regions.parseArea(adcode) || '';
        let adcode2save = pcode;
        if (citycode) adcode2save = citycode;
        if (adcode) adcode2save = adcode;

        if (id && id > 0) { // edit
            const photoIds = (deletePhotoIds?.split(',') || []).map(id => Number(id) || 0).filter(id => id !== 0);
            if (photoIds && photoIds.length > 0) {
                const photosToDelete = await fastify.db.photo.findMany({ where: { id: { in: photoIds } } });
                for await (const photoToDelete of photosToDelete) fastify.storage.delete(photoToDelete.url); // delete files on disk
                await fastify.db.photo.deleteMany({ where: { id: { in: photoIds } } }); // delete files in db
            }
            await fastify.db.customer.update({ where: { id }, data: { name, phone, type, province, city, area, adcode: adcode2save, address } });
        } else { // create
            id = await fastify.db.customer.create({ data: { name, phone, type, province, city, area, adcode: adcode2save, address, creatorId: req.session.user.id } });
        }
        // save new photos
        for (const url of photos) { // XXX createMany is not support for SQLite :(
            await fastify.db.photo.create({
                data: { url, customerId: id }
            });
        }
        return reply.code(200).send();
    });

    // 删除
    fastify.delete('/', async (req, reply) => {
        if (!req.session.user.isAdmin) return reply.code(403).send();
        let { ids } = req.body || { ids: [] };
        // only admin can delete
        if (ids && ids.length > 0) {
            ids = ids.map(id => Number(id)).filter(id => id);
            await fastify.db.photo.deleteMany({ where: { customerId: { in: ids } } });
            await fastify.db.customer.deleteMany({ where: { id: { in: ids } } });
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

    // add & edit this customer's link
    fastify.post('/:id/links', async (req, reply) => {
        const customerId = Number(req.params.id || 0);
        let { id, subject, content, typeId } = req.body;

        // TODO validate params
        const customer = await fastify.db.customer.findUnique({ where: { id: customerId } });

        // admin can add any
        // others can only do it which were assigned to them
        if (!customer || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();

        const link = { subject, content, typeId: Number(typeId) || 0, customerId: customer.id };
        if (id) {
            await fastify.db.link.update({ data: link, where: { id: Number(id) } });
        } else {
            link.userId = req.session.user.id;
            await fastify.db.link.create({ data: link });
        }
        return reply.code(200).send();
    });

    fastify.delete('/:customerId/links/:linkId', async (req, reply) => {
        const customerId = Number(req.params.customerId);
        const linkId = Number(req.params.linkId);
        const customer = await fastify.db.customer.findUnique({ where: { id: customerId } });
        // admin can delete any
        // others can only do it which were assigned to them
        if (!customer || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        await fastify.db.link.delete({ where: { id: linkId } });
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

    // 退回
    fastify.post('/:id/retreat', async (req, reply) => {
        const id = Number(req.params.id || 0);
        const customer = await fastify.db.customer.findUnique({ where: { id } });
        if (!customer || req.session.user.id !== customer.userId) return reply.code(403).send();
        await fastify.db.customer.update({
            where: { id },
            data: { userId: null },
        });
        return reply.code(200).send();
    });

    // 转移
    fastify.post('/:id/transfer', async (req, reply) => {
        const id = Number(req.params.id) || 0;
        const userId = Number(req.body.userId) || null;
        const customer = await fastify.db.customer.findUnique({ where: { id } });
        if (!userId || !customer || req.session.user.id !== customer.userId) return reply.code(403).send();
        await fastify.db.customer.update({
            where: { id },
            data: { userId },
        });
        return reply.code(200).send();
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
        const provinceText = fastify.regions.parseProvince(province);
        const cityText = fastify.regions.parseCity(city);
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