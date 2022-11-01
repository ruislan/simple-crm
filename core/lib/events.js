const events = {
    names: {
        USER_LOGIN: 'user.login',
        USER_LOGOUT: 'user.logout',
        USER_CREATE: 'user.create',
        USER_BLOCK: 'user.block',
        USER_UNBLOCK: 'user.unblock',
        CUSTOMER_CREATE: 'customer.create',
        CUSTOMER_UPDATE: 'customer.update',
        CUSTOMER_RETREAT: 'customer.retreat',
        CUSTOMER_TRANSFER: 'customer.transfer',
        CUSTOMER_ACQUIRE: 'customer.acquire',
        CUSTOMER_STAGE_CHANGE: 'customer.stage.change',
        // TODO finish these events...
    },
    init(fastify) {
        events.fastify = fastify;
        // register all event handlers
        fastify.events.addHandler(this.names.USER_LOGIN, this.handleUserLogin);
        fastify.events.addHandler(this.names.USER_LOGOUT, this.handleUserLogout);
        fastify.events.addHandler(this.names.USER_CREATE, this.handleUserCreate);
        fastify.events.addHandler(this.names.USER_BLOCK, this.handleUserBlock);
        fastify.events.addHandler(this.names.USER_UNBLOCK, this.handleUserUnBlock);
        fastify.events.addHandler(this.names.CUSTOMER_CREATE, this.handleCustomerCreate);
        fastify.events.addHandler(this.names.CUSTOMER_UPDATE, this.handleCustomerUpdate);
        fastify.events.addHandler(this.names.CUSTOMER_RETREAT, this.handleCustomerRetreat);
        fastify.events.addHandler(this.names.CUSTOMER_TRANSFER, this.handleCustomerTransfer);
        fastify.events.addHandler(this.names.CUSTOMER_ACQUIRE, this.handleCustomerAcquire);
        fastify.events.addHandler(this.names.CUSTOMER_STAGE_CHANGE, this.handleCustomerStageChange);
    },
    async handleCustomerAcquire(data) {
        let { user, customers } = data;
        customers = customers.map(customer => { return { id: customer.id, name: customer.name }; });
        const activity = {
            action: events.names.CUSTOMER_ACQUIRE,
            userId: user.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customers }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleUserCreate(data) {
        const { user, newUser } = data;
        const activity = {
            action: events.names.USER_CREATE,
            userId: user.id,
            targetId: newUser.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, newUser: { id: newUser.id, name: newUser.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleUserBlock(data) {
        const { user, blockUser } = data;
        const activity = {
            action: events.names.USER_BLOCK,
            userId: user.id,
            targetId: blockUser.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, blockUser: { id: blockUser.id, name: blockUser.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleUserUnBlock(data) {
        const { user, unblockUser } = data;
        const activity = {
            action: events.names.USER_BLOCK,
            userId: user.id,
            targetId: unblockUser.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, unblockUser: { id: unblockUser.id, name: unblockUser.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerCreate(data) {
        const { user, customer } = data;
        const activity = {
            action: events.names.CUSTOMER_CREATE,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customer: { id: customer.id, name: customer.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerUpdate(data) {
        const { user, customer } = data;
        const activity = {
            action: events.names.CUSTOMER_UPDATE,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customer: { id: customer.id, name: customer.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerRetreat(data) {
        const { user, customer } = data;
        const activity = {
            action: events.names.CUSTOMER_RETREAT,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customer: { id: customer.id, name: customer.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerTransfer(data) {
        const { user, customer, toUser } = data;
        const activity = {
            action: events.names.CUSTOMER_TRANSFER,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customer: { id: customer.id, name: customer.name }, toUser: { id: toUser.id, name: toUser.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerStageChange(data) {
        const { user, customer, stage } = data;
        const activity = {
            action: events.names.CUSTOMER_STAGE_CHANGE,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customer: { id: customer.id, name: customer.name }, stage: { id: stage.id, name: stage.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleUserLogin(data) {
        const { user } = data;
        const activity = {
            action: events.names.USER_LOGIN,
            userId: user.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name, ip: user.lastLoginIp } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleUserLogout(data) {
        const { user } = data;
        const activity = {
            action: events.names.USER_LOGOUT,
            userId: user.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    }
};

export default events;
