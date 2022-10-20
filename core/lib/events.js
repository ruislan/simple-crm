const events = {
    names: {
        USER_LOGIN: 'user.login',
        USER_LOGOUT: 'user.logout',
        USER_REGISTER: 'user.register',
        USER_CREATE: 'user.create',
        USER_UPDATE: 'user.update',
        USER_DELETE: 'user.delete',
        USER_BLOCK: 'user.block',
        CUSTOMER_CREATE: 'customer.create',
        // TODO finish these ...
    },
    init(fastify) {
        events.fastify = fastify;
        // register all event handlers
        fastify.events.addHandler(this.names.USER_LOGIN, this.handleUserLogin);
        fastify.events.addHandler(this.names.USER_LOGOUT, this.handleUserLogout);
    },
    async handleUserCreate(data) {
        const { user, target } = data.payload;
        const activity = {
            action: events.names.USER_CREATE,
            userId: user.id,
            targetId: target.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, target: { id: target.id, name: target.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleUserRegister(data) {
        const user = data.payload;
        const activity = {
            action: events.names.USER_REGISTER,
            userId: user.id,
            extra: JSON.stringify({ id: user.id, name: user.name }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleUserLogin(data) {
        const user = data.payload;
        const activity = {
            action: events.names.USER_LOGIN,
            userId: user.id,
            extra: JSON.stringify({ id: user.id, name: user.name, ip: user.lastLoginIp }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleUserLogout(data) {
        const user = data.payload;
        const activity = {
            action: events.names.USER_LOGOUT,
            userId: user.id,
            extra: JSON.stringify({ id: user.id, name: user.name }),
        };
        await events.fastify.db.activity.create({ data: activity });
    }
};

export default events;
