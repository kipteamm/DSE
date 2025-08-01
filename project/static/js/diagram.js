function diagramInit() {
    if (userId) return;
    toggleModal("auth");
}

if (document.readyState !== 'loading') {
    diagramInit();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        diagramInit();
    });
}