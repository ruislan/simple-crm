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
    },
    async handleUserLogin(data) {
        const user = data.payload;
        const activity = {
            action: events.names.USER_LOGIN,
            template: '{{user.name}} 登录了系统',
            userId: user.id,
            data: JSON.stringify({ id: user.id, name: user.name, time: Date.now() }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
};

export default events;
