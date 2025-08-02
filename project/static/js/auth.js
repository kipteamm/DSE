function checkInput(input) {
    input.value = input.value.replace(/\D/g, '');
    if (!input.value) return;
    if (input.value.length > 1) input.value = input.value[0];

    if (input.id === "5") return;
    document.getElementById(parseInt(input.id) + 1).focus();
}

function keyDown(event, input) {
    if (event.key !== "Delete" && event.key !== "Backspace") return;
    if (input.value) return;

    if (input.id === "0") return;
    document.getElementById(parseInt(input.id) - 1).focus();
}

function handlePaste(e) {
    e.stopPropagation();
    e.preventDefault();

    try {
        const clipboardData = e.clipboardData || window.clipboardData;
        const pastedData = clipboardData.getData('Text');
        const digits = pastedData.replace(/\s+/g, '').split("");
    
        for (let i = 0; i < 6; i++) {
            const input = document.getElementById(i);
            input.value = digits[i];
            input.focus();
        }
    } catch {};
}

function submit() {
    // return console.log(`/auth/email?email=${email}&code=${Array.from(document.querySelectorAll("input")).map(input => input.value).join('')}&next=${next}`);
    return window.location.href = `/auth/email?email=${email}&code=${Array.from(document.querySelectorAll("input")).map(input => input.value).join('')}&next=${next}`;
}

document.addEventListener('paste', handlePaste);