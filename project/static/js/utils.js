function getCookie(name) {
    const cookieString = document.cookie;
    const cookies = cookieString.split(';');

    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) return cookieValue;
    }

    return null;
}

function get(name){
    if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search)) return decodeURIComponent(name[1]);
}

function toggleModal(id) {
    document.body.classList.toggle("no-scroll");
    document.getElementById("dark-overlay").classList.toggle("active");
    
    const modal = document.getElementById(id + "-modal");
    modal.classList.toggle("active");

    if (id !== "share") return;
    if (modal.classList.contains("active")) return;

    document.querySelectorAll(".share-buttons a").forEach(a => {
        a.href = a.originalHref;
    });
}

function continueEmail() {
    const input = document.getElementById("auth-email-input");
    if (!input.value) return input.focus();

    window.location.href = `/login/email?email=${input.value}&next=${window.location.pathname}`;
}