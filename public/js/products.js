const productEditor = {
    id: 'productEditor',
    title: '',
    data: {},
    resetData() {
        this.data = {};
    },
    render() {
        const modal = this;
        const editorEl = document.createElement('div');
        editorEl.id = modal.id;
        editorEl.className = 'modal fade';
        editorEl.setAttribute('aria-hidden', 'true');
        editorEl.setAttribute('tabindex', '-1');
        editorEl.setAttribute('data-bs-backdrop', 'static');
        editorEl.addEventListener('hidden.bs.modal', () => {
            modal.resetData();
            document.body.removeChild(editorEl);
        });
        document.body.appendChild(editorEl);
        editorEl.innerHTML = `
                <div class="modal-dialog modal-dialog-scrollable modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${modal.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="${modal.id}Form">
                            <div class="d-flex flex-column">
                                <div class="mb-3 row">
                                    <label class="col-sm-2 col-form-label">名称</label>
                                    <div class="col-sm-10">
                                        <input type="text" class="form-control" name="name" value="${modal.data.product?.name || ''}" required>
                                    </div>
                                </div>
                                <div class="mb-3 row">
                                    <label class="col-sm-2 col-form-label">单位</label>
                                    <div class="col-sm-10">
                                        <input type="text" class="form-control" name="unit" value="${modal.data.product?.unit || ''}">
                                    </div>
                                </div>
                                <div class="mb-3 row">
                                    <label class="col-sm-2 col-form-label">编码</label>
                                    <div class="col-sm-10">
                                        <input type="text" class="form-control" name="sku" value="${modal.data.product?.sku || ''}">
                                    </div>
                                </div>
                                <div class="mb-3 row">
                                    <label class="col-sm-2 col-form-label">价格</label>
                                    <div class="col-sm-10">
                                        <input type="text" class="form-control" name="price" value="${modal.data.product?.price || 0}" required>
                                    </div>
                                </div>
                                <div class="row">
                                    <label class="col-sm-2 col-form-label">描述</label>
                                    <div class="col-sm-10">
                                        <textarea name="description" class="form-control" rows="3">${modal.data.product?.description || ''}</textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                            <button type="button" class="btn btn-dark submit">保存</button>
                        </div>
                        </form>
                    </div>
                </div>
            `;
        document.querySelector(`#${modal.id} .submit`).addEventListener('click', async () => {
            const data = {};
            new FormData(document.getElementById(`${modal.id}Form`)).forEach((v, k) => data[k] = v);
            if (modal.data.product?.id) data['id'] = modal.data.product.id;
            $.ajax({
                url: '/system/products',
                type: 'post',
                data,
            }).done(function () {
                if (productEditor.onDone) productEditor.onDone();
            }).fail(function () {
                if (productEditor.onFail) productEditor.onFail();
            }).always(function () {
                $(`#${modal.id}`).modal('hide');
                if (productEditor.onAlways) productEditor.onAlways();
            });
        });
        $(`#${modal.id}`).modal('show');
    },
    open({ title, data, onDone, onFail, onAlways }) {
        this.title = title;
        this.data.product = { ...data } || {};
        this.onDone = onDone;
        this.onFail = onFail;
        this.onAlways = onAlways;
        this.render();
    },
};