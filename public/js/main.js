const helper = {
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },
    confirm(message, onOk, onCancel) {
        const confirm = document.createElement('confirm');
        confirm.id = 'bs-modal-confirm';
        confirm.addEventListener('hidden.bs.modal', () => document.body.removeChild(confirm));
        confirm.innerHTML = `
                <div class="modal fade">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">请确认</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body"> ${message} </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                                <button class="btn btn-dark">确认</button>
                            </div>
                        </div>       
                    </div>
                </div>
            `;
        document.body.appendChild(confirm);
        if (onOk) $('#bs-modal-confirm .modal .btn-dark').click(() => {
            onOk();
            $('#bs-modal-confirm .modal').modal('hide');
        });
        if (onCancel) $('#bs-modal-confirm .modal .btn-secondary').click(() => {
            onCancel();
            $('#bs-modal-confirm .modal').modal('hide');
        });
        $('#bs-modal-confirm .modal').modal('show');
    },
    preview(url) { // need jquery & bootstrap
        const preview = document.createElement('div');
        preview.id = 'bs-modal-img-preview';
        preview.className = 'modal fade';
        preview.addEventListener('hidden.bs.modal', () => document.body.removeChild(preview));
        preview.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="border-1 bg-dark p-2 rounded">
                    <img width="100%" src="${url}" />
                </div>
            </div>
        `;
        document.body.appendChild(preview);
        $('#bs-modal-img-preview').modal('show');
    },
    async toast(message, type) { // type: success, danger
        type = type || 'info';
        const toast = document.createElement('div');
        toast.id = 'bs-toast';
        toast.addEventListener('hidden.bs.toast', () => document.body.removeChild(toast));
        toast.innerHTML = `
            <div class="toast-container  position-fixed p-3 top-0 start-50 translate-middle-x">
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
        document.body.appendChild(toast);
        $('#bs-toast .toast').toast('show');
    },
};