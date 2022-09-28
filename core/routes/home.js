const home = async function (fastify, opts) {
    fastify.get('/', async function (req, reply) {
        // FIXME 这里用的是魔术数字
        const unLink = await fastify.db.customer.count({ where: { OR: [{ stageId: 1 }, { stageId: null }] } });
        const linking = await fastify.db.customer.count({ where: { stageId: { gt: 2 }, } });
        const sold = await fastify.db.customer.count({ where: { stageId: 1, } });
        const user = await fastify.db.user.count();

        return reply.view('index.html', { data: { count: { unLink, linking, sold, user } } });
    });
    fastify.get('/login', async (_, reply) => reply.view('login.html'));
    fastify.get('/not-found', async (_, reply) => reply.view('not-found.html'));
    fastify.get('/forbidden', async (_, reply) => reply.view('forbidden.html'));

    fastify.post('/login', async function (req, reply) {
        const { name, password } = req.body;
        let hasError = !name || !password;
        let user = null;
        if (!hasError) {
            user = await fastify.db.user.findUnique({ where: { name } });
            hasError = !user;
        }
        if (!hasError) {
            const isPasswordMatched = await this.bcrypt.compare(password, user.password);
            hasError = !isPasswordMatched;
        }
        if (!hasError) {
            req.session.authenticated = true;
            req.session.user = user;
            return reply.redirect('/');
        }
        return reply.view('login.html', { hasError, name });
    });

    fastify.get('/logout', logoutHandler);
    fastify.post('/logout', logoutHandler);
};

const logoutHandler = async function (req, reply) {
    if (req.session.authenticated) {
        req.session.destroy();
    }
    return reply.redirect('/');
};

export default home;