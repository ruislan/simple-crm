import auth from "../../lib/auth.js";
import dataset from "./dataset.js";
import linkTypes from "./link-types.js";
import products from "./products.js";
import stages from "./stages.js";
import tags from "./tags.js";
import users from "./users.js";

const system = async (fastify, opts) => {
    fastify.addHook('preHandler', auth.requireAdmin);

    fastify.register(dataset, { prefix: '/dataset' });
    fastify.register(users, { prefix: '/users' });
    fastify.register(linkTypes, { prefix: '/link-types' });
    fastify.register(stages, { prefix: '/stages' });
    fastify.register(tags, { prefix: '/tags' });
    fastify.register(products, { prefix: '/products' });
};

export default system;