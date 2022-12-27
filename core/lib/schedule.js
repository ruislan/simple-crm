import cron from 'node-cron';

const schedule = {
    processExpiredActivities: function ({ expiredDay, fastify }) {
        expiredDay = expiredDay || 180; // 180天
        if (fastify) {
            cron.schedule('0 1 * * *', async () => {
                let deadline = new Date();
                deadline.setDate(deadline.getDate() - expiredDay);
                fastify.log.info(`Start deleting expired Activities, the day before ${deadline.toISOString()} will be deleted`);

                const result = await fastify.db.activity.deleteMany({
                    where: {
                        createdAt: {
                            lt: deadline,
                        }
                    }
                });

                fastify.log.info(`Expired Activities deleted, count: ${result.count}`);
            });
            fastify.log.info('The schedule job [Process Expired Activities] started. cron [0 1 * * *].');
        }
    },
};

export default schedule;
