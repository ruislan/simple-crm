import prisma from '@prisma/client';
import bcrypt from 'bcrypt';

const db = new prisma.PrismaClient({ log: ['error', 'warn'] });
await db.$connect();

const passwordHash = await bcrypt.hash('123123', 10);

const users = [
    {
        id: 1,
        name: 'admin',
        phone: '12345678901',
        email: 'admin@simplecrm.com',
        password: passwordHash,
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 2,
        name: 'user1',
        phone: '12345678902',
        email: 'user1@simplecrm.com',
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

const stages = [
    { id: 1, name: '新建', sequence: 1 },
    { id: 2, name: '已下单', sequence: 2 },
    { id: 3, name: '已放弃', sequence: 3 },
    { id: 4, name: '已联系', sequence: 4 }
];

const linkTypes = [
    { id: 1, name: '邮件', deletable: false },
    { id: 2, name: '电话', deletable: false },
    { id: 3, name: '微信' },
    { id: 4, name: 'QQ' },
    { id: 5, name: '短信' },
]

async function main() {
    // await db.user.deleteMany();
    for (const u of users) {
        const user = await db.user.upsert({ create: u, update: u, where: { id: u.id } });
        console.log(`Created or Update user with id: ${user.id}`);
    }
    for (const s of stages) {
        await db.stage.upsert({ create: s, update: s, where: { id: s.id } });
        console.log(`Created or Update customer stage with id: ${s.id}`);
    }
    for (const t of linkTypes) {
        await db.linkType.upsert({ create: t, update: t, where: { id: t.id } });
        console.log(`Created or Update link type with id: ${t.id}`);
    }
    // await db.photo.deleteMany();
    // await db.customer.deleteMany();
    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
