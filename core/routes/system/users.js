import pagination from '../../lib/pagination.js';

const users = async function (fastify, opts) {
    fastify.get('/:id', async (req, reply) => {
        const id = Number(req.params.id || 0);
        const user = await fastify.db.user.findUnique({ where: { id } });
        delete user.password;
        return user || {};
    });

    // save id
    fastify.post('/:id', async (req, reply) => {
        const id = Number(req.params.id || 0);
        const { email, name, password, phone } = req.body;
        const theUser = await fastify.db.user.findUnique({ where: { id } });

        if (theUser.name !== name) {
            const existsName = await fastify.db.user.count({
                where: {
                    AND: [
                        { name },
                        { id: { not: theUser.id } }
                    ]
                }
            }) > 0;
            if (existsName) return reply.send({ hasError: true, message: '存在相同的用户名，请更换用户名' });
        }

        if (theUser.email !== email) {
            const existsEmail = await fastify.db.user.count({
                where: {
                    AND: [
                        { email },
                        { id: { not: theUser.id } }
                    ]
                }
            }) > 0;
            if (existsEmail) return reply.send({ hasError: true, message: '存在相同的邮件，请更换邮件' });
        }

        if (theUser.phone !== phone) {
            const existsPhone = await fastify.db.user.count({
                where: {
                    AND: [
                        { phone },
                        { id: { not: theUser.id } }
                    ]
                }
            }) > 0;
            if (existsPhone) return reply.send({ hasError: true, message: '存在相同的电话，请更换电话' });
        }

        if (password && password.length < 6) return reply.code(400).send({ hasError: true, message: '密码不能小于6位数哟' });
        let data = { email, name, phone };
        if (password) data.password = await fastify.bcrypt.hash(password);

        await fastify.db.user.update({
            where: { id: theUser.id },
            data
        });
        return reply.send({ hasError: false, message: '更新成功' });
    });

    fastify.post('/', async (req, reply) => {
        let { email, name, password, phone } = req.body;
        if (!name || name.length < 2) return reply.send({ hasError: true, message: '用户名不能小于2位字符哟' });
        if (!phone || phone.length < 8) return reply.send({ hasError: true, message: '电话不能小于8位哟' });
        if (!password || password.length < 6) return reply.send({ hasError: true, message: '密码不能小于6位数哟' });

        const existsPhone = await fastify.db.user.count({ where: { phone } }) > 0;
        if (existsPhone) return reply.send({ hasError: true, message: '存在相同的电话，请更换电话' });

        const existsName = await fastify.db.user.count({ where: { name } }) > 0;
        if (existsName) return reply.send({ hasError: true, message: '存在相同的用户名，请更换用户名' });

        if (email) {
            const existsEmail = await fastify.db.user.count({ where: { email } }) > 0;
            if (existsEmail) return reply.send({ hasError: true, message: '存在相同的邮件，请更换邮件' });
        }

        password = await fastify.bcrypt.hash(password);
        await fastify.db.user.create({
            data: { id: undefined, name, email, password, phone }
        });
        return reply.send({ hasError: false, message: '创建成功' });
    });

    fastify.get('/', async (req, reply) => {
        let { name, skip, limit } = req.query;
        name = name || '';
        skip = Number(skip) || 0;
        limit = Number(limit) || 15;
        const count = await fastify.db.user.count();
        const users = await fastify.db.user.findMany({
            skip, take: limit,
            where: {
                name: {
                    contains: name,
                }
            },
            orderBy: { id: 'desc' }
        });
        return reply.view('system/users.html', {
            users,
            query: req.query,
            pagination: pagination(skip, limit, count)
        });
    });
};

export default users;