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
    { id: 1, name: '未联系', sequence: 1, deletable: false, colorHex: '#212529' },
    { id: 2, name: '已联系', sequence: 2, colorHex: '#206bc4' },
    { id: 3, name: '已下单', sequence: 3, colorHex: '#74b816' },
    { id: 4, name: '已放弃', sequence: 4, colorHex: '#d63939' }
];

const linkTypes = [
    { id: 1, name: '邮件', deletable: false },
    { id: 2, name: '电话', deletable: false },
    { id: 3, name: '微信' },
    { id: 4, name: 'QQ' },
    { id: 5, name: '短信' },
]

const paymentMethods = [
    { id: 1, name: '现金' },
    { id: 2, name: '支票' },
    { id: 3, name: '邮政汇款' },
    { id: 4, name: '电汇' },
    { id: 5, name: '银行转账' },
    { id: 6, name: '网上转账' },
    { id: 7, name: '支付宝' },
    { id: 8, name: '微信' },
];

const customers = [
    {
        id: 1,
        name: '菲克1号店',
        phone: '12345678911',
        type: '农副产品市场',
        province: '北京市',
        city: '北京市',
        area: '顺义区',
        adcode: '110113',
        address: '某街1号',
        location: '116.825695,40.062752',
        source: 'unknown',
        stageId: 3,
        userId: 1,
        creatorId: 1,
    },
    {
        id: 2,
        name: '菲克2号店',
        phone: '12345678911',
        type: '农副产品市场',
        province: '北京市',
        city: '北京市',
        area: '顺义区',
        adcode: '110113',
        address: '某街2号',
        location: '116.825695,40.062752',
        source: 'unknown',
        stageId: 1,
        userId: 2,
        creatorId: 1,
    },
    {
        id: 3,
        name: '菲克3号店',
        phone: '12345678911',
        type: '农副产品市场',
        province: '北京市',
        city: '北京市',
        area: '顺义区',
        adcode: '110113',
        address: '某街3号',
        location: '116.825695,40.062752',
        source: 'unknown',
        creatorId: 1,
    },
];

const photos = [
    {
        id: 1,
        url: 'https://fakeimg.pl/400x300/282828/eae0d0',
        customerId: 1,
    },
    {
        id: 2,
        url: 'https://fakeimg.pl/400x300/282828/eae0d0',
        customerId: 1,
    },
    {
        id: 3,
        url: 'https://fakeimg.pl/400x300/282828/eae0d0',
        customerId: 1,
    },
    {
        id: 4,
        url: 'https://fakeimg.pl/400x300/282828/eae0d0',
        customerId: 2,
    },
    {
        id: 5,
        url: 'https://fakeimg.pl/400x300/282828/eae0d0',
        customerId: 2,
    },
    {
        id: 6,
        url: 'https://fakeimg.pl/400x300/282828/eae0d0',
        customerId: 2,
    },
    {
        id: 7,
        url: 'https://fakeimg.pl/400x300/282828/eae0d0',
        customerId: 3,
    },
    {
        id: 8,
        url: 'https://fakeimg.pl/400x300/282828/eae0d0',
        customerId: 3,
    },
    {
        id: 9,
        url: 'https://fakeimg.pl/400x300/282828/eae0d0',
        customerId: 3,
    },
];


const activities = [
    {
        id: 1,
        userId: 1,
        action: 'user.login',
        extra: '{"user":{"id":1,"name":"admin","ip":"127.0.0.1"}}',
    },
    {
        id: 2,
        userId: 1,
        targetId: 1,
        action: 'customer.stage.change',
        extra: '{"user":{"id":1,"name":"admin"},"customer":{"id":1,"name":"菲克1号店"},"stage":{"id":3,"name":"已下单"}}',
    },
    {
        id: 3,
        userId: 1,
        targetId: 1,
        action: 'customer.link.create',
        extra: '{"user":{"id":1,"name":"admin"},"customer":{"id":1,"name":"菲克1号店"},"link":{"id":1,"subject":"首次接触"}}',
    },
    {
        id: 4,
        userId: 1,
        targetId: 1,
        action: 'customer.link.create',
        extra: '{"user":{"id":1,"name":"admin"},"customer":{"id":1,"name":"菲克1号店"},"link":{"id":2,"subject":"成功下单"}}',
    },
    {
        id: 5,
        userId: 1,
        targetId: 1,
        action: 'customer.contract.create',
        extra: '{"user":{"id":1,"name":"admin"},"customer":{"id":1,"name":"菲克1号店"},"contract":{"name":"20221101签订30件商品合同"}}',
    },
    {
        id: 6,
        userId: 1,
        targetId: 1,
        action: 'customer.receivable.create',
        extra: '{"user":{"id":1,"name":"admin"},"customer":{"id":1,"name":"菲克1号店"},"contract":{"id":1,"name":"20221101签订30件商品合同"},"receivable":{"id":1,"amount":"3000"}}',
    },
];

const links = [
    {
        id: 1,
        subject: '首次接触',
        content: '成功添加了微信，聊得不错，有下单意愿',
        userId: 1,
        customerId: 1,
        typeId: 3,
    },
    {
        id: 2,
        subject: '成功下单',
        content: '电话进行了联系，成功下单30件商品，有很强需求，后期可以持续跟进',
        userId: 1,
        customerId: 1,
        typeId: 2,
    },
];

const contracts = [
    {
        id: 1,
        number: '20221101-0001',
        name: '20221101签订30件商品合同',
        customerId: 1,
        amount: 50000,
        remark: '要求5天时间到货，走顺丰',
        userId: 1,
    },
];

const receivables = [
    {
        id: 1,
        amount: 3000,
        remark: '定金',
        paymentMethodId: 1,
        date: new Date('2022-11-01'),
        customerId: 1,
        contractId: 1,
        userId: 1,
    }
];

const products = [
    {
        id: 1,
        name: '产品1',
        unit: '吨',
        sku: '001',
        description: '小心轻放',
        price: 1000,
    },
    {
        id: 2,
        name: '产品2',
        unit: '吨',
        sku: '002',
        description: '小心火源',
        price: 2000,
    }
];

async function main() {
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
    for (const p of paymentMethods) {
        await db.paymentMethod.upsert({ create: p, update: p, where: { id: p.id, } });
        console.log(`Created or Update payment method with id: ${p.id}`);
    }
    for (const c of customers) {
        await db.customer.upsert({ create: c, update: c, where: { id: c.id } });
        console.log(`Created or Update customer with id: ${c.id}`);
    }
    for (const ph of photos) {
        await db.photo.upsert({ create: ph, update: ph, where: { id: ph.id } });
        console.log(`Created or Update photo with id: ${ph.id}`);
    }
    for (const a of activities) {
        await db.activity.upsert({ create: a, update: a, where: { id: a.id } });
        console.log(`Created or Update activity with id: ${a.id}`);
    }
    for (const l of links) {
        await db.link.upsert({ create: l, update: l, where: { id: l.id } });
        console.log(`Created or Update link with id: ${l.id}`);
    }
    for (const c of contracts) {
        await db.contract.upsert({ create: c, update: c, where: { id: c.id } });
        console.log(`Created or Update contract with id: ${c.id}`);
    }
    for (const r of receivables) {
        await db.receivable.upsert({ create: r, update: r, where: { id: r.id } });
        console.log(`Created or Update receivable with id: ${r.id}`);
    }
    for (const p of products) {
        await db.product.upsert({ create: p, update: p, where: { id: p.id } });
        console.log(`Created or Update product with id: ${p.id}`);
    }
    console.log(`Seeding finished.`);
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
}).finally(async () => {
    await db.$disconnect();
});
