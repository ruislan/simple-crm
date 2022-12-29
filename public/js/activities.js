const activities = {
    render({ isMy, data }) {
        let html = '';
        data = data || {};
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const extra = JSON.parse(item.extra || '{}');
            let one = '';
            switch (item.action) {
                case 'user.login':
                    one = isMy ? `
                        <div class="paragraph">你登录了系统，IP：${extra.user?.ip || '未知'}</div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `: `
                        <div class="paragraph"><span class="fw-semibold">${extra.user?.name || '未知'}</span> 登录了系统，IP：${extra.user?.ip || '未知'}</div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                case 'user.logout':
                    one = isMy ? `
                        <div class="paragraph">你登出了系统</div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `: `
                        <div class="paragraph"><span class="fw-semibold">${extra.user?.name || '未知'}</span> 登出了系统</div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                case 'user.create':
                    one = isMy ? `
                        <div class="paragraph">你创建了用户  <span class="fw-semibold">${extra.newUser?.name || '未知'}</span></div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `: `
                        <div class="paragraph"><span class="fw-semibold">${extra.user?.name || '未知'}</span> 创建了用户  <span class="fw-semibold">${extra.newUser?.name || '未知'}</span></div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                case 'user.block':
                    one = isMy ? `
                        <div class="paragraph">你锁定了用户  <span class="fw-semibold">${extra.blockUser?.name || '未知'}</span></div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `: `
                        <div class="paragraph"><span class="fw-semibold">${extra.user?.name || '未知'}</span> 锁定了用户  <span class="fw-semibold">${extra.blockUser?.name || '未知'}</span></div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                case 'user.unblock':
                    one = isMy ? `
                        <div class="paragraph">你解锁了用户  <span class="fw-semibold">${extra.unblockUser?.name || '未知'}</span></div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `: `
                        <div class="paragraph"><span class="fw-semibold">${extra.user?.name || '未知'}</span> 解锁了用户  <span class="fw-semibold">${extra.unblockUser?.name || '未知'}</span></div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                case 'customer.create':
                    one = isMy ? `
                        <div class="paragraph">你创建了客户  <span class="fw-semibold">${extra.customer?.name || '未知'}</span></div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `: `
                        <div class="paragraph"><span class="fw-semibold">${extra.user?.name || '未知'}</span> 创建了客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span></div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                case 'customer.update':
                    one = isMy ? `
                        <div class="paragraph">你编辑了客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span></div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `: `
                        <div class="paragraph"><span class="fw-semibold">${extra.user?.name || '未知'}</span> 编辑了客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span></div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                case 'customer.acquire':
                    let customersHtml = '';
                    let len = extra.customers?.length || 0;
                    for (let i = 0; i < len; i++) {
                        customersHtml += `<span class="fw-semibold">${extra.customers[i].name || '未知'}</span>`;
                        if (i < len - 1) customersHtml += ', ';
                        else customersHtml += ' 等客户';
                    }
                    one = isMy ? `
                        <div class="paragraph">你领取了 ${customersHtml}</div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `: `
                        <div class="paragraph"><span class="fw-semibold">${extra.user?.name || '未知'}</span> 领取了 ${customersHtml}</div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                case 'customer.transfer':
                    one = `
                        <div class="paragraph">
                            ${isMy ? '你' : `<span class="fw-semibold">${extra.user?.name || '未知'}</span>`} 将客户
                            <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 转给了
                            <span class="fw-semibold">${extra.toUser?.name || '未知'}</span>
                        </div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                case 'customer.retreat':
                    one = `
                        <div class="paragraph">
                            ${isMy ? '你' : `<span class="fw-semibold">${extra.user?.name || '未知'}</span>`} 将客户
                            <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 退回
                        </div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                case 'customer.stage.change':
                    one = isMy ? `
                    <div class="paragraph">
                        你更改了客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 的阶段为 <span class="fw-semibold">${extra.stage?.name || '未知'}</span>
                    </div>
                    <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                `: `
                    <div class="paragraph"><span class="fw-semibold">${extra.user?.name || '未知'}</span> 改变了客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 的阶段为 <span class="fw-semibold">${extra.stage?.name}</span></div>
                    <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                `;
                    break;
                case 'customer.contract.create':
                    one = isMy ? `
                    <div class="paragraph">
                        你为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 创建了合同 <span class="fw-semibold">${extra.contract?.name || '未知'}</span>
                    </div>
                    <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                `: `
                    <div class="paragraph">
                        <span class="fw-semibold">${extra.user?.name || '未知'}</span> 为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 创建了合同 <span class="fw-semibold">${extra.contract?.name || '未知'}</span>
                    </div>
                    <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                `;
                    break;
                case 'customer.contract.update':
                    one = isMy ? `
                    <div class="paragraph">
                        你为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 编辑了合同 <span class="fw-semibold">${extra.contract?.name || '未知'}</span>
                    </div>
                    <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                `: `
                    <div class="paragraph">
                        <span class="fw-semibold">${extra.user?.name || '未知'}</span> 为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 编辑了合同 <span class="fw-semibold">${extra.contract?.name || '未知'}</span>
                    </div>
                    <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                `;
                    break;
                case 'customer.contract.abandon':
                    one = isMy ? `
                    <div class="paragraph">
                        你作废了客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 的合同 <span class="fw-semibold">${extra.contract?.name || '未知'}</span>
                    </div>
                    <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                `: `
                    <div class="paragraph">
                        <span class="fw-semibold">${extra.user?.name || '未知'}</span> 为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 作废了合同 <span class="fw-semibold">${extra.contract?.name || '未知'}</span>
                    </div>
                    <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                `;
                    break;
                case 'customer.contract.complete':
                    one = isMy ? `
                    <div class="paragraph">
                        你完成了客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 的合同 <span class="fw-semibold">${extra.contract?.name || '未知'}</span>
                    </div>
                    <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                `: `
                    <div class="paragraph">
                        <span class="fw-semibold">${extra.user?.name || '未知'}</span> 为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 完成了合同 <span class="fw-semibold">${extra.contract?.name || '未知'}</span>
                    </div>
                    <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                `;
                    break;
                case 'customer.receivable.create':
                    one = isMy ? `
                        <div class="paragraph">
                            你为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 的合同 <span class="fw-semibold">${extra.contract?.name || '未知'}</span> 新增了 <span class="fw-semibold">回款 ${extra.receivable?.amount || ''}</span>
                        </div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    ` : `
                        <div class="paragraph">
                            <span class="fw-semibold">${extra.user?.name || '未知'}</span> 为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 的合同 <span class="fw-semibold">${extra.contract?.name || '未知'}</span> 新增了 <span class="fw-semibold">回款 ${extra.receivable?.amount || ''}</span>
                        </div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                case 'customer.receivable.delete':
                    one = isMy ? `
                        <div class="paragraph">
                            你为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 的合同 <span class="fw-semibold">${extra.contract?.name || '未知'}</span> 删除了 <span class="fw-semibold">回款 ${extra.receivable?.amount || ''}</span>
                        </div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    ` : `
                        <div class="paragraph">
                            <span class="fw-semibold">${extra.user?.name || '未知'}</span> 为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 的合同 <span class="fw-semibold">${extra.contract?.name || '未知'}</span> 删除了 <span class="fw-semibold">回款 ${extra.receivable?.amount || ''}</span>
                        </div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                case 'customer.link.create':
                    one = isMy ? `
                        <div class="paragraph">
                            你为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 新增了联系 <span class="fw-semibold">${extra.link?.subject || '未知'}</span>
                        </div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `: `
                        <div class="paragraph">
                            <span class="fw-semibold">${extra.user?.name || '未知'}</span> 为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 新增了联系 <span class="fw-semibold">${extra.link?.subject || '未知'}</span>
                        </div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                case 'customer.link.update':
                    one = isMy ? `
                        <div class="paragraph">
                            你为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 编辑了联系 <span class="fw-semibold">${extra.link?.subject || '未知'}</span>
                        </div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `: `
                        <div class="paragraph">
                            <span class="fw-semibold">${extra.user?.name || '未知'}</span> 为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 编辑了联系 <span class="fw-semibold">${extra.link?.subject || '未知'}</span>
                        </div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                case 'customer.link.delete':
                    one = isMy ? `
                        <div class="paragraph">
                            你为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 删除了联系 <span class="fw-semibold">${extra.link?.subject || '未知'}</span>
                        </div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `: `
                        <div class="paragraph">
                            <span class="fw-semibold">${extra.user?.name || '未知'}</span> 为客户 <span class="fw-semibold">${extra.customer?.name || '未知'}</span> 删除了联系 <span class="fw-semibold">${extra.link?.subject || '未知'}</span>
                        </div>
                        <div class="mt-1 fs-sm text-muted">${dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss")}</div>
                    `;
                    break;
                default: break;
            }
            html += `
            <div class="d-flex">
                <div class="d-flex flex-column me-2">
                    <div class="text-bg-dark rounded-circle d-flex align-items-center justify-content-center activity-icon-sm text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                        </svg>
                    </div>
                    <div class="bg-secondary align-self-center my-1 opacity-25 flex-grow-1" style="width:2px;"></div>
                </div>
                <div class="d-flex flex-column flex-grow-1 mb-2">
                    <div class="p-2 border border-dark border-opacity-25 shadow-sm rounded mb-2">
                        <div class="d-flex flex-column">
                            ${one}
                        </div>
                    </div>
                </div>
            </div>
        `;
        }
        return html;
    }
}