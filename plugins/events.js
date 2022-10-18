import fp from 'fastify-plugin';
import EventEmitter from 'events';

const eventsPlugin = async (fastify, opts, next) => {
    const emitter = new EventEmitter();
    fastify.decorate('events', {
        emit: async (name, event) => emitter.emit(name, event),
        addHandler: async (name, handler) => emitter.on(name, handler),
        addOnceHandler: async (name, handler) => emitter.once(name, handler),
        removeHandler: async (name) => emitter.off(name),
        removeAllHandlers: async () => emitter.removeAllListeners(),
    });
    next();
};

export default fp(eventsPlugin);