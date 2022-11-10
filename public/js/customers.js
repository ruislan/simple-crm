const transferDialog = {
    title: '转交客户',
    data: {},
    open({ customerId, onDone, onFail, onAlways, currentUserId }) {
        this.data.customerId = customerId;
        this.data.currentUserId = currentUserId;
        this.onDone = onDone;
        this.onFail = onFail;
        this.onAlways = onAlways;
        this.render();
    },
    render() {
        // clear dom
        const modal = this;
        const modalEL = document.createElement('div');
        modalEL.id = 'transferDialog';
        modalEL.className = 'modal fade';
        modalEL.setAttribute('aria-hidden', 'true');
        modalEL.setAttribute('tabindex', '-1');
        modalEL.setAttribute('data-bs-backdrop', 'static');
        modalEL.addEventListener('hidden.bs.modal', () => {
            modal.data = {};
            document.body.removeChild(modalEL);
        });
        modalEL.addEventListener('show.bs.modal', () => {
            // load users
            $.getJSON('/users').done(function (result) {
                const { data } = result;
                const selectNode = $('#transferDialog select[name="userId"]');
                for (const u of data) {
                    selectNode.append(`<option value="${u.id}" ${u.id == modal.data.currentUserId ? 'selected' : ''}>${u.name} ${u.phone}</option>`);
                }
            }); // XXX 现在先全部读取，后面再改成可输入并查询的吧
        });
        document.body.appendChild(modalEL);
        modalEL.innerHTML = `
                <div class="modal-dialog modal-dialog-scrollable modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${modal.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="editorForm">
                        <div class="modal-body">
                            <div class="d-flex flex-column">
                                    <div class="mb-3 row">
                                        <label class="col-sm-2 col-form-label">转给</label>
                                        <div class="col-sm-10">
                                            <div class="pb-2 pb-lg-0">
                                                <select name="userId" class="form-select"></select>
                                            </div>
                                        </div>
                                    </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                            <button type="button" class="btn btn-dark">保存</button>
                        </div>
                        </form>
                    </div>
                </div>
            `;
        document.querySelector('#transferDialog .btn-dark').addEventListener('click', () => {
            const userId = document.querySelector('#transferDialog select[name="userId"]').value;
            $.ajax({
                url: `/customers/${transferDialog.data.customerId}/transfer`,
                type: 'post',
                data: { userId }
            }).done(function () {
                if (transferDialog.onDone) transferDialog.onDone();
            }).fail(function () {
                if (transferDialog.onFail) transferDialog.onFail();
            }).always(function () {
                $('#transferDialog').modal('hide');
                if (transferDialog.onAlways) transferDialog.onAlways();
            });
        });
        $('#transferDialog').modal('show');
    }
};

const editor = {
    title: '',
    data: {
        fileLimit: 5,
        fileSize: 1024 * 1024 * 2, // 2mb
        photos: [],
        customer: {},
    },
    resetData() {
        this.data.photos = [];
        this.data.customer = {};
    },
    render() {
        const modal = this;
        const editorEl = document.createElement('div');
        editorEl.id = 'editor';
        editorEl.className = 'modal fade';
        editorEl.setAttribute('aria-hidden', 'true');
        editorEl.setAttribute('tabindex', '-1');
        editorEl.setAttribute('data-bs-backdrop', 'static');
        editorEl.addEventListener('hidden.bs.modal', () => {
            modal.data.photos.forEach(photo => URL.revokeObjectURL(photo.url)); // release mem
            modal.resetData();
            document.body.removeChild(editorEl);
        });
        editorEl.addEventListener('show.bs.modal', () => {
            // load regions
            const regions = editor.data.regions;
            const provinceNode = $('#editor select[name="pcode"]');
            const cityNode = $('#editor select[name="citycode"]');
            const areaNode = $('#editor select[name="adcode"]');
            provinceNode.empty().append('<option value="">省/直辖市</option>');
            for (f in regions['0']) {
                provinceNode.append(`<option value="${f}" ${regions['0'][f] === modal.data.customer.province ? 'selected' : ''}>${regions['0'][f]}</option>`);
            }
            provinceNode.change(() => {
                cityNode.empty().append('<option value="">市</option>');
                const province = provinceNode.val();
                if (province) {
                    const key = 0 + ',' + province;
                    for (c in regions[key]) {
                        cityNode.append(`<option value="${c}" ${regions[key][c] === modal.data.customer.city ? 'selected' : ''}>${regions[key][c]}</option>`);
                    }
                }
            }).change();
            cityNode.change(() => {
                areaNode.empty().append('<option value="">区/县</option>');
                const province = provinceNode.val();
                const city = cityNode.val();
                const key = 0 + ',' + province + ',' + city;
                if (city) {
                    for (d in regions[key]) {
                        areaNode.append(`<option value="${d}" ${regions[key][d] === modal.data.customer.area ? 'selected' : ''}>${regions[key][d]}</option>`);
                    }
                }
            }).change();
        });
        document.body.appendChild(editorEl);
        editorEl.innerHTML = `
                <div class="modal-dialog modal-dialog-scrollable modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${modal.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="editorForm">
                        <div class="modal-body">
                            <div class="d-flex flex-column">
                                    <div class="mb-3 row">
                                        <label for="inputName" class="col-sm-2 col-form-label">名称</label>
                                        <div class="col-sm-10">
                                            <input type="text" class="form-control" name="name" id="inputName" value="${modal.data.customer.name || ''}" required>
                                        </div>
                                    </div>
                                    <div class="mb-3 row">
                                        <label for="inputPhone" class="col-sm-2 col-form-label">电话</label>
                                        <div class="col-sm-10">
                                            <input type="text" class="form-control" name="phone" id="inputPhone" value="${modal.data.customer.phone || ''}">
                                        </div>
                                    </div>
                                    <div class="mb-3 row">
                                        <label for="inputType" class="col-sm-2 col-form-label">类型</label>
                                        <div class="col-sm-10">
                                            <input type="text" class="form-control" name="type" id="inputType" value="${modal.data.customer.type || ''}">
                                        </div>
                                    </div>
                                    <div class="mb-3 row">
                                        <label class="col-sm-2 col-form-label">省市区</label>
                                        <div class="d-flex col-sm-10">
                                            <div class="pb-2 pb-lg-0" style="max-width: 140px;"><select name="pcode" class="form-select" aria-label="省/直辖市"></select></div>
                                            <div class="pb-2 pb-lg-0 ps-1" style="max-width: 140px;"><select name="citycode" class="form-select" aria-label="市"></select></div>
                                            <div class="pb-2 pb-lg-0 ps-1" style="max-width: 140px;"><select name="adcode" class="form-select" aria-label="区/县"></select></div>
                                        </div>
                                    </div>
                                    <div class="mb-3 row">
                                        <label class="col-sm-2 col-form-label">地址</label>
                                        <div class="col-sm-10">
                                            <input type="text" class="form-control" name="address" value="${modal.data.customer.address || ''}">
                                        </div>
                                    </div>
                                    <div class="mb-3 row">
                                        <label class="col-sm-2 col-form-label">图片</label>
                                        <div class="col-sm-10 d-flex flex-column">
                                            <div style="max-width:100px;">
                                                <div class="btn btn-dark d-flex align-items-center file-upload-btn">
                                                    <input type="file" hidden multiple>
                                                    <div><span class="file-label">选择(${modal.data.photos.length}/${modal.data.fileLimit})</span></div>
                                                </div>
                                            </div>
                                            <div id="imageBox" class="d-flex flex-wrap mt-3">
                                            </div>
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

        const renderImageBox = function () {
            let photoHTML = '';
            modal.data.photos.filter(photo => !photo.deleted).forEach(photo => {
                photoHTML += `
                        <div data-id="${photo.id}" class="img-lg-preview position-relative">
                            <img class="w-100 h-100" src="${photo.url}" onclick="helper.preview('${photo.url}');" />
                            <span class="position-absolute top-0 start-100 translate-middle badge border border-light rounded bg-danger">X</span>
                        </div>
                    `;
            });
            document.querySelector('#editor #imageBox').innerHTML = photoHTML;
            document.querySelectorAll('#editor #imageBox .badge').forEach(item => {
                item.addEventListener('click', function (e) {
                    e.preventDefault();
                    const imgId = this.parentElement.getAttribute('data-id') || '';
                    if (imgId.startsWith('upload')) { // new upload file, delete it directly
                        modal.data.photos = modal.data.photos.filter(photo => photo.id != imgId);
                        const inputFiles = document.querySelector('#editor input[type="file"]').files;
                        for (let i = 0; i < inputFiles.length; i++) {
                            if (inputFiles[i].name === imgId.substring(7)) {
                                delete inputFiles[i];
                                break;
                            }
                        }
                    } else { // or just give the original photo a mark
                        modal.data.photos.filter(photo => photo.id == imgId).forEach(photo => photo.deleted = true);
                    }
                    URL.revokeObjectURL(this.getAttribute('src')); // release mem
                    renderImageBox(); // refresh dom
                });
            });
            // render file label
            document.querySelector('#editor .file-label').innerHTML = `选择(${modal.data.photos.filter(photo => !photo.deleted).length}/${modal.data.fileLimit})`;
        };
        renderImageBox();

        document.querySelector('#editor .file-upload-btn').addEventListener('click', () => {
            if (modal.data.photos.filter(photo => !photo.deleted).length < modal.data.fileLimit) {
                document.querySelector('#editor input[type="file"]').click();
            }
        });

        document.querySelector('#editor input[type="file"]').addEventListener('change', (e) => {
            const nameSet = new Set(modal.data.photos.filter(file => file.name).map(file => file.name));
            let seat = modal.data.fileLimit - modal.data.photos.filter(photo => !photo.deleted).length;
            for (let i = 0; i < e.target.files.length && seat != 0; i++) {
                const file = e.target.files[i];
                if (nameSet.has(file.name) || file.size > modal.data.fileSize) {
                    delete e.target.files[i]; // delete invalid photos
                } else {
                    modal.data.photos.push({
                        id: `upload-${file.name}`, // filename as id
                        name: file.name, // keep filename to check duplication files
                        url: URL.createObjectURL(file)
                    });
                    seat -= 1;
                }
            }
            renderImageBox();
        });

        document.querySelector('#editor .submit').addEventListener('click', async () => {
            // TODO check fields validate
            const deletePhotoIds = modal.data.photos.filter(photo => photo.deleted).map(photo => photo.id);
            const newPhotos = document.querySelector('#editor input[type="file"]').files;
            const form = new FormData(document.getElementById('editorForm'));
            if (modal.data.customer.id) form.append('id', modal.data.customer.id);
            if (deletePhotoIds && deletePhotoIds.length > 0) form.append('deletePhotoIds', deletePhotoIds);
            for (const photo of newPhotos) form.append('file', photo);
            $.ajax({
                url: '/customers',
                type: 'post',
                data: form,
                processData: false,
                contentType: false,
                cache: false,
            }).done(function () {
                if (editor.onDone) editor.onDone();
            }).fail(function () {
                if (editor.onFail) editor.onFail();
            }).always(function () {
                $('#editor').modal('hide');
                if (editor.onAlways) editor.onAlways();
            });
        });
        $('#editor').modal('show');
    },
    open({ title, data, regions, onDone, onFail, onAlways }) {
        this.title = title;
        this.data.customer = { ...data } || {};
        this.data.photos = data?.photos?.map(photo => { return { id: photo.id, url: photo.url, deleted: false, }; }) || [];
        this.data.regions = regions;
        this.onDone = onDone;
        this.onFail = onFail;
        this.onAlways = onAlways;
        this.render();
    },
};