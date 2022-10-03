const helper = {
    confirm(message, onOk, onCancel) {
        const confirm = document.getElementById('confirm');
        confirm.innerHTML = `
                <div class="modal fade">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-body"> ${message} </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                                <button class="btn btn-dark">确认</button>
                            </div>
                        </div>       
                    </div>
                </div>
            `;
        if (onOk) $('#confirm .modal .btn-dark').click(() => { onOk(); document.innerHTML = ''; $('#confirm .modal').modal('hide'); });
        if (onCancel) $('#confirm .modal .btn-secondary').click(() => { onCancel(); document.innerHTML = ''; $('#confirm .modal').modal('hide'); });
        $('#confirm .modal').modal('show');
    },
    preview(url) { // need jquery & bootstrap
        const preview = document.getElementById('preview');
        if (!preview) return;
        preview.innerHTML = `
                <div class="modal fade">
                    <div class="modal-dialog modal-dialog-centered">
                        <img width="100%" src="${url}" />
                    </div>
                </div>
            `;
        $('#preview .modal').modal('show');
    },
    toast(message, type) { // type: success, danger
        type = type || 'info';
        const toast = document.getElementById('toast');
        toast.innerHTML = `
            <div class="toast-container p-3 top-0 start-50 translate-middle-x">
                <div class="toast align-items-center text-white bg-${type}" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="d-flex">
                        <div class="toast-body">
                            <span>${message}</span>
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
                            aria-label="Close"></button>
                    </div>
                </div>
            </div>
            `;
        $('#toast .toast').toast('show');
    },
};