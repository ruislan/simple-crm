import events from "../lib/events.js";

const home = async function (fastify, opts) {
    fastify.get('/', async function (req, reply) {
        // FIXME 这里用的是魔术数字
        const unLink = await fastify.db.customer.count({ where: { OR: [{ stageId: 1 }, { stageId: null }] } });
        const linking = await fastify.db.customer.count({ where: { stageId: 2, } });
        const sold = await fastify.db.customer.count({ where: { stageId: 3, } });
        const user = await fastify.db.user.count();
        const contract = await fastify.db.contract.count();
        const customer = await fastify.db.customer.count();
        const receivable = (await fastify.db.receivable.aggregate({ _sum: { amount: true } }))._sum.amount;

        return reply.view('index.html', { data: { count: { unLink, linking, sold, user, contract, customer, receivable } } });
    });
    fastify.get('/login', async (_, reply) => reply.view('login.html'));
    fastify.get('/not-found', async (_, reply) => reply.view('not-found.html'));
    fastify.get('/forbidden', async (_, reply) => reply.view('forbidden.html'));

    // XXX move me to the right place, maybe?
    fastify.get('/payment-methods', async (req, reply) => {
        const data = await fastify.db.paymentMethod.findMany();
        return reply.code(200).send({ data });
    });

    fastify.post('/login', async function (req, reply) {
        const { name, password } = req.body;
        let user = null;
        let message = '用户名或者密码不正确';
        if (!name || !password) return reply.view('login.html', { hasError: true, name, message });

        user = await fastify.db.user.findUnique({ where: { name } });
        if (!user) return reply.view('login.html', { hasError: true, name, message });
        if (user.isLocked) return reply.view('login.html', { hasError: true, name, message: '您已经被锁定，更多信息请联系系统管理员或者您的上级' });

        const isPasswordMatched = await fastify.bcrypt.compare(password, user.password);
        if (!isPasswordMatched) return reply.view('login.html', { hasError: true, name, message });
        await fastify.db.user.update({ data: { lastLoginIp: req.ip }, where: { id: user.id } });

        user.lastLoginIp = req.ip;
        fastify.events.emit(events.names.USER_LOGIN, { user });

        req.session.authenticated = true;
        req.session.user = user;
        return reply.redirect('/');
    });

    fastify.all('/logout', async function (req, reply) {
        if (req.session.authenticated) {
            fastify.events.emit(events.names.USER_LOGOUT, { user: req.session.user });
            req.session.destroy();
        }
        return reply.redirect('/');
    });
};

export default home;