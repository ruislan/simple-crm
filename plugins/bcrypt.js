import fp from 'fastify-plugin';
import bcrypt from 'bcrypt';

const BCRYPT_SALT_ROUNDS = 10;

const bcryptPlugin = async (fastify, opts, next) => {
    fastify.decorate('bcrypt', {
        hash: async (password) => {
            return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        },
        compare: async (password, hashedPassword) => {
            return bcrypt.compare(password, hashedPassword);
        },
    });

    next();
};

export default fp(bcryptPlugin);