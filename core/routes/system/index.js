import auth from "../../lib/auth.js";
import dataset from "./dataset.js";
import linkTypes from "./link-types.js";
import users from "./users.js";

const system = async (fastify, opts) => {
    fastify.addHook('preHandler', auth.requireAdmin);

    fastify.register(dataset, { prefix: '/dataset' });
    fastify.register(users, { prefix: '/users' });
    fastify.register(linkTypes, { prefix: '/link-types' });
};

export default system;