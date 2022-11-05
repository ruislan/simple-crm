const events = {
    names: {
        USER_LOGIN: 'user.login',
        USER_LOGOUT: 'user.logout',
        USER_CREATE: 'user.create',
        USER_BLOCK: 'user.block',
        USER_UNBLOCK: 'user.unblock',
        CUSTOMER_CREATE: 'customer.create',
        CUSTOMER_UPDATE: 'customer.update',
        CUSTOMER_RETREAT: 'customer.retreat',
        CUSTOMER_TRANSFER: 'customer.transfer',
        CUSTOMER_ACQUIRE: 'customer.acquire',
        CUSTOMER_STAGE_CHANGE: 'customer.stage.change',
        CUSTOMER_CONTRACT_CREATE: 'customer.contract.create',
        CUSTOMER_CONTRACT_UPDATE: 'customer.contract.update',
        CUSTOMER_CONTRACT_COMPLETE: 'customer.contract.complete',
        CUSTOMER_CONTRACT_ABANDON: 'customer.contract.abandon',
        CUSTOMER_RECEIVABLE_CREATE: 'customer.receivable.create',
        CUSTOMER_RECEIVABLE_DELETE: 'customer.receivable.delete',
        CUSTOMER_LINK_CREATE: 'customer.link.create',
        CUSTOMER_LINK_UPDATE: 'customer.link.update',
        CUSTOMER_LINK_DELETE: 'customer.link.delete'
        // XXX 持续追加事件...
        // XXX 动态事件目前在系统中看来有三种
        // 1. 谁做了什么，例如：X登录了系统。
        // 2. 谁对谁做了什么，例如： X 创建了 Y；张三 创建了 合同。
        // 3. 谁对谁的什么做了什么，例如： X 为 Y 创建了一个 Z；张三 为 客户李四 创建了一个 合同。
        // 目前的设计是 user -> target 然后extra附加描述的形式来处理这三种分类
        // XXX 这里设计和事件处理都略显仓促和粗糙，后面有时间来改进，现在只能说能用
    },
    init(fastify) {
        events.fastify = fastify;
        // register all event handlers
        fastify.events.addHandler(this.names.USER_LOGIN, this.handleUserLogin);
        fastify.events.addHandler(this.names.USER_LOGOUT, this.handleUserLogout);
        fastify.events.addHandler(this.names.USER_CREATE, this.handleUserCreate);
        fastify.events.addHandler(this.names.USER_BLOCK, this.handleUserBlock);
        fastify.events.addHandler(this.names.USER_UNBLOCK, this.handleUserUnBlock);

        fastify.events.addHandler(this.names.CUSTOMER_CREATE, this.handleCustomerCreate);
        fastify.events.addHandler(this.names.CUSTOMER_UPDATE, this.handleCustomerUpdate);
        fastify.events.addHandler(this.names.CUSTOMER_RETREAT, this.handleCustomerRetreat);
        fastify.events.addHandler(this.names.CUSTOMER_TRANSFER, this.handleCustomerTransfer);
        fastify.events.addHandler(this.names.CUSTOMER_ACQUIRE, this.handleCustomerAcquire);

        fastify.events.addHandler(this.names.CUSTOMER_STAGE_CHANGE, this.handleCustomerStageChange);

        fastify.events.addHandler(this.names.CUSTOMER_CONTRACT_CREATE, this.handleCustomerContractCreate);
        fastify.events.addHandler(this.names.CUSTOMER_CONTRACT_UPDATE, this.handleCustomerContractUpdate);
        fastify.events.addHandler(this.names.CUSTOMER_CONTRACT_COMPLETE, this.handleCustomerContractComplete);
        fastify.events.addHandler(this.names.CUSTOMER_CONTRACT_ABANDON, this.handleCustomerContractAbandon);

        fastify.events.addHandler(this.names.CUSTOMER_RECEIVABLE_CREATE, this.handleCustomerReceivableCreate);
        fastify.events.addHandler(this.names.CUSTOMER_RECEIVABLE_DELETE, this.handleCustomerReceivableDelete);

        fastify.events.addHandler(this.names.CUSTOMER_LINK_CREATE, this.handleCustomerLinkCreate);
        fastify.events.addHandler(this.names.CUSTOMER_LINK_UPDATE, this.handleCustomerLinkUpdate);
        fastify.events.addHandler(this.names.CUSTOMER_LINK_DELETE, this.handleCustomerLinkDelete);
    },
    async handleCustomerLinkCreate(data) {
        const { user, customer, link } = data;
        const activity = {
            action: events.names.CUSTOMER_LINK_CREATE,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({
                user: { id: user.id, name: user.name },
                customer: { id: customer.id, name: customer.name },
                link: { id: link.id, subject: link.subject }
            }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerLinkUpdate(data) {
        const { user, customer, link } = data;
        const activity = {
            action: events.names.CUSTOMER_LINK_UPDATE,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({
                user: { id: user.id, name: user.name },
                customer: { id: customer.id, name: customer.name },
                link: { id: link.id, subject: link.subject }
            }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerLinkDelete(data) {
        const { user, customer, link } = data;
        const activity = {
            action: events.names.CUSTOMER_LINK_DELETE,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({
                user: { id: user.id, name: user.name },
                customer: { id: customer.id, name: customer.name },
                link: { id: link.id, subject: link.subject }
            }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },

    async handleCustomerReceivableCreate(data) {
        const { user, customer, contract, receivable } = data;
        const activity = {
            action: events.names.CUSTOMER_RECEIVABLE_CREATE,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({
                user: { id: user.id, name: user.name },
                customer: { id: customer.id, name: customer.name },
                contract: { id: contract.id, name: contract.name },
                receivable: { id: receivable.id, amount: receivable.amount }
            }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerReceivableDelete(data) {
        const { user, customer, contract, receivable } = data;
        const activity = {
            action: events.names.CUSTOMER_RECEIVABLE_DELETE,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({
                user: { id: user.id, name: user.name },
                customer: { id: customer.id, name: customer.name },
                contract: { id: contract.id, name: contract.name },
                receivable: { id: receivable.id, amount: receivable.amount }
            }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },

    async handleCustomerContractComplete(data) {
        const { user, customer, contract } = data;
        const activity = {
            action: events.names.CUSTOMER_CONTRACT_COMPLETE,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customer: { id: customer.id, name: customer.name }, contract: { id: contract.id, name: contract.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerContractAbandon(data) {
        const { user, customer, contract } = data;
        const activity = {
            action: events.names.CUSTOMER_CONTRACT_ABANDON,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customer: { id: customer.id, name: customer.name }, contract: { id: contract.id, name: contract.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerContractCreate(data) {
        const { user, customer, contract } = data;
        const activity = {
            action: events.names.CUSTOMER_CONTRACT_CREATE,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customer: { id: customer.id, name: customer.name }, contract: { id: contract.id, name: contract.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerContractUpdate(data) {
        const { user, customer, contract } = data;
        const activity = {
            action: events.names.CUSTOMER_CONTRACT_UPDATE,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customer: { id: customer.id, name: customer.name }, contract: { id: contract.id, name: contract.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerAcquire(data) {
        let { user, customers } = data;
        customers = customers.map(customer => { return { id: customer.id, name: customer.name }; });
        const activity = {
            action: events.names.CUSTOMER_ACQUIRE,
            userId: user.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customers }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleUserCreate(data) {
        const { user, newUser } = data;
        const activity = {
            action: events.names.USER_CREATE,
            userId: user.id,
            targetId: newUser.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, newUser: { id: newUser.id, name: newUser.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleUserBlock(data) {
        const { user, blockUser } = data;
        const activity = {
            action: events.names.USER_BLOCK,
            userId: user.id,
            targetId: blockUser.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, blockUser: { id: blockUser.id, name: blockUser.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleUserUnBlock(data) {
        const { user, unblockUser } = data;
        const activity = {
            action: events.names.USER_BLOCK,
            userId: user.id,
            targetId: unblockUser.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, unblockUser: { id: unblockUser.id, name: unblockUser.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerCreate(data) {
        const { user, customer } = data;
        const activity = {
            action: events.names.CUSTOMER_CREATE,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customer: { id: customer.id, name: customer.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerUpdate(data) {
        const { user, customer } = data;
        const activity = {
            action: events.names.CUSTOMER_UPDATE,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customer: { id: customer.id, name: customer.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerRetreat(data) {
        const { user, customer } = data;
        const activity = {
            action: events.names.CUSTOMER_RETREAT,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customer: { id: customer.id, name: customer.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerTransfer(data) {
        const { user, customer, toUser } = data;
        const activity = {
            action: events.names.CUSTOMER_TRANSFER,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customer: { id: customer.id, name: customer.name }, toUser: { id: toUser.id, name: toUser.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleCustomerStageChange(data) {
        const { user, customer, stage } = data;
        const activity = {
            action: events.names.CUSTOMER_STAGE_CHANGE,
            userId: user.id,
            targetId: customer.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name }, customer: { id: customer.id, name: customer.name }, stage: { id: stage.id, name: stage.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleUserLogin(data) {
        const { user } = data;
        const activity = {
            action: events.names.USER_LOGIN,
            userId: user.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name, ip: user.lastLoginIp } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    },
    async handleUserLogout(data) {
        const { user } = data;
        const activity = {
            action: events.names.USER_LOGOUT,
            userId: user.id,
            extra: JSON.stringify({ user: { id: user.id, name: user.name } }),
        };
        await events.fastify.db.activity.create({ data: activity });
    }
};

export default events;
