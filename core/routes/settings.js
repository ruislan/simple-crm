const settings = async function (fastify, opts) {
    fastify.get('/password', async (req, reply) => reply.view('settings/password.html'));
    fastify.post('/password', async function (req, reply) {
        const { password, newPassword } = req.body;
        let hasError = !newPassword || !password;
        let user = req.session.user;
        if (!hasError) {
            const isPasswordMatched = await this.bcrypt.compare(password, user.password);
            hasError = !isPasswordMatched;
        }
        if (!hasError) {
            const hashedPassword = await this.bcrypt.hash(newPassword);
            await this.db.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword
                },
            });
        }
        let message = hasError ? '密码不正确，请输入正确的密码' : '修改成功';
        return reply.view('settings/password.html', { hasError, message });
    });

    fastify.get('/general', async (req, reply) => reply.view('settings/general.html'));
    fastify.post('/general', async function (req, reply) {
        const { name, phone, email } = req.body;
        let user = req.session.user;
        await this.db.user.update({
            where: { id: user.id },
            data: {
                name,
                phone,
                email
            },
        });
        reply.locals.sessionUser = { ...req.session.user, name, phone, email }; // update session object
        return reply.view('settings/general.html', { hasError: false, message: '保存成功' });
    });
};

export default settings;