function getCookie(name) {
    const cookieString = document.cookie;
    const cookies = cookieString.split(';');

    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) return cookieValue;
    }

    return null;
}

function toggleModal(id) {
    document.body.classList.toggle("no-scroll");
    document.getElementById("dark-overlay").classList.toggle("active");
    document.getElementById(id + "-modal").classList.toggle("active");
}

function continueEmail() {
    const input = document.getElementById("auth-email-input");
    if (!input.value) return input.focus();

    window.location.href = "/login/email?email=" + input.value;
}