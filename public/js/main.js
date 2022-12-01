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
        let svg;
        switch (type) {
            case 'warning': svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>`; break;
            case 'success': svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>`; break;
            case 'danger': svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7z"/></svg>`; break;
            default: svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle-fill" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>`; break;
        }
        const toast = document.createElement('div');
        toast.id = 'bs-toast';
        toast.addEventListener('hidden.bs.toast', () => document.body.removeChild(toast));
        toast.innerHTML = `
            <div class="toast-container position-fixed p-3 top-0 start-50 translate-middle-x">
                <div class="toast align-items-center bg-toast-${type}" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="d-flex">
                        <div class="toast-body">
                            <div class="d-flex align-items-center">
                                <div class="mb-1 me-2">${svg}</div>
                                <div>${message}</div>
                            </div>
                        </div>
                        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"
                            aria-label="Close"></button>
                    </div>
                </div>
            </div>
            `;
        document.body.appendChild(toast);
        $('#bs-toast .toast').toast('show');
    },
};