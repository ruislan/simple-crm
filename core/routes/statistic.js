import dayjs from "dayjs";

const statistic = async function (fastify, opts) {
    fastify.get('/contracts/last7days', async (req, reply) => {
        // 取前7天数据，然后做聚合
        const now = new Date();
        now.setDate(now.getDate() - 7);
        const contracts = await fastify.db.contract.findMany({
            where: { createdAt: { gt: now } }
        });
        const data = {};
        contracts.forEach(contract => {
            const day = dayjs(contract.createdAt).format('YYYY-MM-DD');
            data[day] = (data[day] || 0) + 1;
        });
        return reply.code(200).send({ data });
    });
    fastify.get('/contracts/receivable', async (req, reply) => {
        const total = await fastify.db.contract.aggregate({ _sum: { amount: true } });
        const done = await fastify.db.receivable.aggregate({ _sum: { amount: true } });
        return reply.code(200).send({ data: { total: total._sum.amount, done: done._sum.amount } });
    });
};

export default statistic;