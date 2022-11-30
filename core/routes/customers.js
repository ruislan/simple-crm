import constants from '../lib/constants.js';
import events from '../lib/events.js';

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
            fastify.events.emit(events.names.CUSTOMER_UPDATE, { user: req.session.user, customer: { id, name } });
        } else { // create
            const newCustomer = await fastify.db.customer.create({ data: { name, phone, type, province, city, area, adcode: adcode2save, address, creatorId: req.session.user.id } });
            id = newCustomer.id;
            fastify.events.emit(events.names.CUSTOMER_CREATE, { user: req.session.user, customer: { id, name } });
        }
        // save new photos
        for (const url of photos) { // XXX createMany is not supported for SQLite :(
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
        const { stageId } = req.body;
        const customer = await fastify.db.customer.findUnique({ where: { id: Number(req.params.id || 0) } });
        const stage = await fastify.db.stage.findUnique({ where: { id: Number(stageId) || 0 } });
        // admin can edit
        // others can only do it which were assigned to them
        if (!customer || !stage || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        await fastify.db.customer.update({
            where: { id: customer.id },
            data: { stageId: stage.id },
        });
        fastify.events.emit(events.names.CUSTOMER_STAGE_CHANGE, { user: req.session.user, customer, stage });
        return reply.code(200).send();
    });

    // tags
    fastify.get('/:id/tags', async (req, reply) => {
        const customerId = Number(req.params.id || 0);
        const refs = await fastify.db.customerTagRef.findMany({ where: { customerId }, include: { tag: true } });
        const tags = refs.map(ref => ref.tag);
        return reply.code(200).send({ data: tags });
    });

    fastify.post('/:id/tags', async (req, reply) => {
        const customerId = Number(req.params.id || 0);
        let { name, color } = req.body;
        if (!name && name.length < 1) return reply.code(400).send({ message: '标签至少1个字符' });
        if (!color) color = '#000000'; // black as default
        const customer = await fastify.db.customer.findUnique({ where: { id: customerId } });
        let tag = await fastify.db.tag.findUnique({ where: { name } });
        // admin can add any
        // others can only do it which were assigned to them
        if (!customer || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        if (!tag) tag = await fastify.db.tag.create({ data: { name, colorHex: color } }); // no tag ? create one.

        const ref = { customerId, tagId: tag.id, };
        await fastify.db.customerTagRef.upsert({
            create: ref,
            update: ref,
            where: { customerId_tagId: { customerId, tagId: tag.id } }
        }); // use upsert to avoid duplicate errors

        return reply.code(200).send();
    });

    fastify.delete('/:customerId/tags/:tagId', async (req, reply) => {
        const customerId = Number(req.params.customerId);
        const tagId = Number(req.params.tagId);
        const customer = await fastify.db.customer.findUnique({ where: { id: customerId } });
        const tag = await fastify.db.tag.findUnique({ where: { id: tagId } });
        // admin can delete any
        // others can only do it which were assigned to them
        if (!customer || !tag || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        await fastify.db.customerTagRef.delete({ where: { customerId_tagId: { customerId, tagId: tag.id } } }); // delete relationship
        return reply.code(200).send();
    });
    // end tags

    // this customer's activities
    fastify.get('/:id/activities', async (req, reply) => {
        const id = Number(req.params.id || 0);
        let { skip, limit } = req.query;
        skip = Number(skip) || constants.DEFAULT_PAGE_SKIP;
        limit = Number(limit) || constants.DEFAULT_PAGE_SIZE;
        const customer = await fastify.db.customer.findUnique({ where: { id } });
        // admin can view all
        // others can only view the customers which were assigned to them
        if (!customer || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        let count = await fastify.db.activity.count({ where: { targetId: customer.id } });
        let data = await fastify.db.activity.findMany({
            where: { targetId: customer.id, },
            skip,
            take: limit,
            orderBy: [{ createdAt: 'desc' }]
        });
        return reply.code(200).send({ data, skip, limit, count });
    });

    // end activities

    // this customer's contracts
    fastify.post('/:id/contracts', async (req, reply) => {
        const customerId = Number(req.params.id || 0);
        let { id, number, name, amount, remark, contractProductList } = req.body;
        const customer = await fastify.db.customer.findUnique({ where: { id: customerId } });

        // admin can add any
        // others can only do it which were assigned to them
        if (!customer || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();

        const contract = { number, name, amount: Number(amount) || 0, remark, customerId: customer.id };
        if (!number || number.length < 1) contract.number = '' + new Date().getTime();

        if (id) {
            contract.id = Number(id);
            await fastify.db.contract.update({ data: contract, where: { id: contract.id } });
            fastify.events.emit(events.names.CUSTOMER_CONTRACT_UPDATE, { user: req.session.user, customer, contract });
        } else {
            contract.userId = req.session.user.id;
            contract.id = (await fastify.db.contract.create({ data: contract })).id;
            fastify.events.emit(events.names.CUSTOMER_CONTRACT_CREATE, { user: req.session.user, customer, contract });
        }

        // delete old contract products, and add new contract products
        // 注意代码顺序，可能是新建合同，所以合同的ID在这里才能确保存在
        await fastify.db.contractProduct.deleteMany({ where: { contractId: contract.id } });
        for (let i = 0; i < contractProductList?.length || 0; i++) {
            const item = contractProductList[i];
            const productId = Number(item.productId) || 0;
            if (productId === 0) continue;
            await fastify.db.contractProduct.create({
                data: {
                    name: item.name,
                    productId: Number(item.productId) || 0,
                    contractId: contract.id,
                    sku: item.sku,
                    unit: item.unit,
                    purchase: Number(item.purchase) || 0,
                    price: Number(item.price) || 0,
                    quantity: Number(item.quantity) || 0,
                    discount: Number(item.discount) || 0,
                }
            });
        }
        return reply.code(200).send();
    });

    fastify.get('/:id/contracts', async (req, reply) => {
        const id = Number(req.params.id || 0); // todo pagination
        let data = [];
        const customer = await fastify.db.customer.findUnique({ where: { id } });
        // admin can view all
        // others can only view the customers which were assigned to them
        if (customer && (req.session.user.isAdmin || req.session.user.id === customer.userId)) {
            data = await fastify.db.contract.findMany({
                where: { customerId: customer.id, },
                orderBy: [{ updatedAt: 'desc' }],
                include: { receivables: { include: { paymentMethod: true } } }
            });
        }
        return reply.code(200).send({ data });
    });

    fastify.post('/:customerId/contracts/:contractId/receivables', async (req, reply) => {
        const customerId = Number(req.params.customerId);
        const contractId = Number(req.params.contractId);
        let { paymentMethodId, amount, date, remark } = req.body;
        const customer = await fastify.db.customer.findUnique({ where: { id: customerId } });
        const contract = await fastify.db.contract.findUnique({ where: { id: contractId } });
        // admin or owner can do this
        if (!customer || !contract || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        const receivable = await fastify.db.receivable.create({
            data: {
                customerId: customer.id,
                contractId: contract.id,
                userId: customer.userId, // 这个客户的负责人也是这个回款的负责人
                paymentMethodId: Number(paymentMethodId) || null,
                date: new Date(date) || new Date(),
                amount: Number(amount) || 0,
                remark
            }
        });
        fastify.events.emit(events.names.CUSTOMER_RECEIVABLE_CREATE, { user: req.session.user, customer, contract, receivable });
        return reply.code(200).send();
    });

    fastify.delete('/:customerId/contracts/:contractId/receivables/:receivableId', async (req, reply) => {
        const customerId = Number(req.params.customerId);
        const contractId = Number(req.params.contractId);
        const receivableId = Number(req.params.receivableId);
        const customer = await fastify.db.customer.findUnique({ where: { id: customerId } });
        const contract = await fastify.db.contract.findUnique({ where: { id: contractId } });
        const receivable = await fastify.db.receivable.findUnique({ where: { id: receivableId } });
        // admin or owner can do this
        if (!customer || !contract || !receivable || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        await fastify.db.receivable.delete({ where: { id: receivable.id } });
        fastify.events.emit(events.names.CUSTOMER_RECEIVABLE_DELETE, { user: req.session.user, customer, contract, receivable });
        return reply.code(200).send();
    });

    fastify.post('/:customerId/contracts/:contractId/abandon', async (req, reply) => {
        const customerId = Number(req.params.customerId);
        const contractId = Number(req.params.contractId);
        const customer = await fastify.db.customer.findUnique({ where: { id: customerId } });
        const contract = await fastify.db.contract.findUnique({ where: { id: contractId } });
        // admin or owner can do this
        if (!customer || !contract || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        await fastify.db.contract.update({ data: { isAbandoned: true }, where: { id: contract.id } });
        fastify.events.emit(events.names.CUSTOMER_CONTRACT_ABANDON, { user: req.session.user, customer, contract });
        return reply.code(200).send();
    });

    fastify.post('/:customerId/contracts/:contractId/complete', async (req, reply) => {
        const customerId = Number(req.params.customerId);
        const contractId = Number(req.params.contractId);
        const customer = await fastify.db.customer.findUnique({ where: { id: customerId } });
        const contract = await fastify.db.contract.findUnique({ where: { id: contractId } });
        // admin or owner can do this
        if (!customer || !contract || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        await fastify.db.contract.update({ data: { isCompleted: true }, where: { id: contract.id } });
        // add product's total sales, maybe this could be put into the event?
        const contractProducts = await fastify.db.contractProduct.findMany({ where: { contractId: contract.id } });
        for (const item of contractProducts) await fastify.db.product.update({ where: { id: item.productId }, data: { totalSales: { increment: item.purchase * item.quantity } } });
        fastify.events.emit(events.names.CUSTOMER_CONTRACT_COMPLETE, { user: req.session.user, customer, contract });
        return reply.code(200).send();
    });

    fastify.get('/:customerId/contracts/:contractId/products', async (req, reply) => {
        const customerId = Number(req.params.customerId);
        const contractId = Number(req.params.contractId);
        const customer = await fastify.db.customer.findUnique({ where: { id: customerId } });
        const contract = await fastify.db.contract.findUnique({ where: { id: contractId } });
        // admin or owner can do this
        if (!customer || !contract || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        const data = await fastify.db.contractProduct.findMany({ where: { contractId } });
        return reply.code(200).send({ data });
    });
    // end contracts

    // add & edit this customer's link
    fastify.post('/:id/links', async (req, reply) => {
        const customerId = Number(req.params.id || 0);
        let { id, subject, content, typeId } = req.body;

        // TODO validate params
        const customer = await fastify.db.customer.findUnique({ where: { id: customerId } });

        // admin can add any
        // others can only do it which were assigned to them
        if (!customer || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();

        let link = { subject, content, typeId: Number(typeId) || 0, customerId: customer.id };
        if (id) {
            link = await fastify.db.link.update({ data: link, where: { id: Number(id) } });
            fastify.events.emit(events.names.CUSTOMER_LINK_UPDATE, { user: req.session.user, customer, link });
        } else {
            link.userId = req.session.user.id;
            link = await fastify.db.link.create({ data: link });
            fastify.events.emit(events.names.CUSTOMER_LINK_CREATE, { user: req.session.user, customer, link });
        }
        // load the link and its ref
        link = await fastify.db.link.findUnique({
            where: { id: link.id, },
            include: {
                type: true,
                user: {
                    select: {
                        name: true,
                        id: true,
                    },
                }
            },
        });
        return reply.code(200).send({ data: link });
    });

    fastify.delete('/:customerId/links/:linkId', async (req, reply) => {
        const customerId = Number(req.params.customerId);
        const linkId = Number(req.params.linkId);
        const customer = await fastify.db.customer.findUnique({ where: { id: customerId } });
        const link = await fastify.db.link.findUnique({ where: { id: linkId } });
        // admin can delete any
        // others can only do it which were assigned to them
        if (!customer || !link || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        await fastify.db.link.delete({ where: { id: link.id } });
        fastify.events.emit(events.names.CUSTOMER_LINK_DELETE, { user: req.session.user, customer, link });
        return reply.code(200).send();
    });

    fastify.get('/:id/links', async (req, reply) => {
        const id = Number(req.params.id || 0);
        let { skip, limit } = req.query;
        skip = Number(skip) || constants.DEFAULT_PAGE_SKIP;
        limit = Number(limit) || constants.DEFAULT_PAGE_SIZE;

        const customer = await fastify.db.customer.findUnique({ where: { id } });
        // admin can view all
        // others can only view the customers which were assigned to them
        if (!customer || (!req.session.user.isAdmin && req.session.user.id !== customer.userId)) return reply.code(403).send();
        const count = await fastify.db.link.count({ where: { customerId: customer.id } });
        const data = await fastify.db.link.findMany({
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
            skip,
            take: limit,
            orderBy: [{ updatedAt: 'desc' }]
        });
        return reply.code(200).send({ data, count, skip, limit });
    });

    // if json return json
    fastify.get('/:id', async (req, reply) => {
        const id = Number(req.params.id || 0);
        const customer = await fastify.db.customer.findUnique({
            where: { id },
            include: { photos: true, stage: true }
        });

        const isJsonRequest = req.isJsonRequest();
        if (!customer) return isJsonRequest ? reply.code(404).send() : reply.redirect('/not-found');

        // admin can view all
        // others can only view the customers which were assigned to them
        if (!req.session.user.isAdmin && req.session.user.id !== customer.userId) return isJsonRequest ? reply.code(404).send() : reply.redirect('/not-found');
        if (isJsonRequest) {
            return reply.code(200).send(customer);
        } else {
            const stages = await fastify.db.stage.findMany({ orderBy: [{ sequence: 'asc' }] });
            return reply.view('customers/detail.html', { data: { customer, stages } });
        }
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
        fastify.events.emit(events.names.CUSTOMER_RETREAT, { user: req.session.user, customer });
        return reply.code(200).send();
    });

    // 转移
    fastify.post('/:id/transfer', async (req, reply) => {
        const customer = await fastify.db.customer.findUnique({ where: { id: Number(req.params.id) || 0 } });
        const toUser = await fastify.db.user.findUnique({ where: { id: Number(req.body.userId) || 0 } });
        if (!toUser || !customer || req.session.user.id !== customer.userId) return reply.code(403).send();
        await fastify.db.customer.update({
            where: { id: customer.id },
            data: { userId: toUser.id },
        });
        fastify.events.emit(events.names.CUSTOMER_TRANSFER, { user: req.session.user, customer, toUser });
        return reply.code(200).send();
    });

    // 隐藏
    fastify.post('/hide', async (req, reply) => {
        let { ids } = req.body || { ids: [] };
        if (ids && ids.length > 0) {
            ids = ids.map(id => Number(id)).filter(id => id);
            for (const id of ids) {
                await fastify.db.userCustomerHiddenRef.create({
                    data: {
                        userId: req.session.user.id,
                        customerId: id,
                    },
                });
            }
        }
        return reply.code(200).send();
    });

    // 取消隐藏
    fastify.post('/unhide', async (req, reply) => {
        let { ids } = req.body || { ids: [] };
        if (ids && ids.length > 0) {
            ids = ids.map(id => Number(id)).filter(id => id);
            for (const id of ids) {
                await fastify.db.userCustomerHiddenRef.delete({
                    where: {
                        customerId_userId: { customerId: id, userId: req.session.user.id }
                    },
                });
            }
        }
        return reply.code(200).send();
    });

    // 认领
    fastify.post('/acquire', async (req, reply) => {
        let { ids } = req.body || { ids: [] };
        if (ids && ids.length > 0) {
            ids = ids.map(id => Number(id)).filter(id => id);
            await fastify.db.customer.updateMany({
                where: { id: { in: ids } },
                data: { userId: req.session.user.id, stageId: 1 } // FIXME: magic number
            });
            ids = ids.slice(0, 5);
            const customers = await fastify.db.customer.findMany({ where: { id: { in: ids } } });
            fastify.events.emit(events.names.CUSTOMER_ACQUIRE, { user: req.session.user, customers });
        }
        return reply.code(200).send();
    });

    fastify.get('/my', async (req, reply) => {
        const stages = await fastify.db.stage.findMany({ orderBy: [{ sequence: 'asc' }] });
        return reply.view("customers/my.html", { data: { stages } });
    });

    fastify.get('/', async (req, reply) => reply.view("customers/index.html"));

    fastify.get('/search', async function (req, reply) {
        // params
        let { keyword, province, city, skip, stageId, hide, limit, my } = req.query;
        const provinceText = fastify.regions.parseProvince(province || null);
        const cityText = fastify.regions.parseCity(city || null);
        skip = Number(skip) || constants.DEFAULT_PAGE_SKIP;
        limit = Number(limit) || constants.DEFAULT_PAGE_SIZE;
        stageId = Number(stageId) || null;
        hide = hide === 'true'; // Be careful, Boolean('false') won't return false, this is javascript.
        my = my === 'true';

        // search conditions
        let whereClause = { userId: null };
        if (provinceText) whereClause.province = { contains: provinceText };
        if (cityText) whereClause.city = { contains: cityText };
        if (keyword) whereClause.name = { contains: keyword };
        if (stageId) whereClause.stageId = stageId;
        if (my) whereClause.userId = req.session.user.id;

        // 该用户主动隐藏的 Customer
        const ignoreIds = (await fastify.db.userCustomerHiddenRef.findMany({
            where: {
                userId: req.session.user.id,
            },
            select: { customerId: true }
        })).map(item => item.customerId);
        if (hide && ignoreIds.length > 0) whereClause.NOT = { id: { in: ignoreIds } };

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

        const ignoreIdSet = new Set(ignoreIds);
        for (const item of data) {
            if (!req.session.user.isAdmin && item.userId !== req.session.user.id) { // 不是admin也不是自己的 掩盖 联系方式,
                if (item.phone && item.phone.length > 3) {
                    item.phone = item.phone.substring(0, 3) + '***';
                }
            }
            item.ignore = ignoreIdSet.has(item.id);
        }

        // result
        return reply.code(200).send({ data, count, skip, limit });
    });
};

export default customers;