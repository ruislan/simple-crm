const linkTypeEditor = {
    id: 'linkTypeEditor',
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
                                    <label for="inputName" class="col-sm-2 col-form-label">名称</label>
                                    <div class="col-sm-10">
                                        <input type="text" class="form-control" name="name" id="inputName" value="${modal.data.linkType?.name || ''}" required>
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
            if (modal.data.linkType?.id) data['id'] = modal.data.linkType.id;
            $.ajax({
                url: '/system/link-types',
                type: 'post',
                data,
            }).done(function () {
                if (linkTypeEditor.onDone) linkTypeEditor.onDone();
            }).fail(function () {
                if (linkTypeEditor.onFail) linkTypeEditor.onFail();
            }).always(function () {
                $(`#${modal.id}`).modal('hide');
                if (linkTypeEditor.onAlways) linkTypeEditor.onAlways();
            });
        });
        $(`#${modal.id}`).modal('show');
    },
    open({ title, data, onDone, onFail, onAlways }) {
        this.title = title;
        this.data.linkType = { ...data } || {};
        this.onDone = onDone;
        this.onFail = onFail;
        this.onAlways = onAlways;
        this.render();
    },
};