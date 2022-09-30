const auth = {
    loginUrl: 'login',
    forbiddenUrl: 'forbidden',
    excludes: new Set(),
    config: (params) => {
        const { loginUrl, forbiddenUrl, excludes } = params;
        auth.loginUrl = loginUrl;
        auth.forbiddenUrl = forbiddenUrl;

        // add excludes
        auth.excludes.add(loginUrl);
        auth.excludes.add(forbiddenUrl);
        excludes.forEach(url => auth.excludes.add(url));
    },
    isAuthUrl: (url) => auth.loginUrl !== url && auth.forbiddenUrl !== url && !auth.excludes.has(url),
    setSessionUser: (reply, sessionUser) => reply.locals = { sessionUser },
    isAuthenticated: (session) => session.authenticated && session.user,
    requireAuth: async (req, reply) => {
        if (auth.isAuthUrl(req.url)) {
            if (!auth.isAuthenticated(req.session)) {
                if ((req.headers['content-type'] || '').startsWith('application/json')) {
                    return reply.code(401).send(); // need auth
                } else {
                    return reply.redirect(auth.loginUrl); // need auth
                }
            }
            auth.setSessionUser(reply, req.session.user);
        }
    },
    requireAdmin: async (req, reply) => {
        if (auth.isAuthUrl(req.url)) {
            if (!auth.isAuthenticated(req.session)) return reply.redirect(auth.loginUrl); // need auth
            auth.setSessionUser(reply, req.session.user);
            if (!req.session.user.isAdmin) return reply.redirect(auth.forbiddenUrl); // no permission
        }
    }
};

export default auth;
