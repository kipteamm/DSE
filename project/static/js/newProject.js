let templateId;
function selectTemplate(_templateId) {
    document.getElementById("step-1").classList.remove("active");
    document.getElementById("step-2").classList.add("active");
    
    templateId = _templateId;
    console.log(templateId)

    document.getElementById("warning").innerText = "You must provide a value for all categories.";
    document.getElementById("page-templates").classList.remove("active");
    document.getElementById("steps").classList.toggle("step-3-active", templateId !== "quadrant");
    
    const page = document.getElementById("page-category")
    page.classList.add("active");
    page.classList.add(templateId);

    loadTemplate(page);
}

function loadTemplate(elm) {
    fetch(`/static/icons/${templateId}.svg`)
        .then(res => res.text())
        .then(svg => {
            elm.children[0].innerHTML += svg;
        });
}

let categorySettings = false;
function focusCategory(input) {
    const settings = document.getElementById("chart-settings");
    settings.classList.add("active");

    const inputRect = input.getBoundingClientRect();
    const parentRect = input.offsetParent.getBoundingClientRect();

    const offsetTop = inputRect.top - parentRect.top + input.offsetHeight;
    const offsetLeft = inputRect.left - parentRect.left - 10;

    settings.style.top = `${offsetTop}px`;
    settings.style.left = `${offsetLeft}px`;
    
    categorySettings = true;
}

categories = {1: null, 2: null, 3: null, 4: null}
function setCategory(id, value) {
    categories[id] = value? value: null;

    if (Object.values(categories).includes(null)) {
        document.getElementById("warning").innerText = "You must provide a value for all categories.";
        document.getElementById("continue-btn").classList.remove("active");
        return;
    };
    document.getElementById("warning").innerText = "";

    const continueBtn = document.getElementById("continue-btn");
    continueBtn.classList.add("active");
    continueBtn.onclick = function () {
        // update categories
        document.getElementById("step-2").classList.remove("active");
        document.getElementById(templateId === "quadrant"? "step-4": "step-3").classList.add("active");

        if (templateId === "quadrant") {
            const listOptions = document.getElementById("list-options");
            listOptions.classList.add("active");
            listOptions.scrollIntoView();
            return;
        };

        document.getElementById("warning").innerText = "You must provide a value for all sections.";
        document.getElementById("page-" + templateId).classList.remove("active");
        
        this.classList.remove("active");
        loadTemplate("page-" + templateId + "-sections")
    };
}

window.onclick = (event) => {
    if (!categorySettings) return;
    if (event.target.closest("#chart-settings") || event.target.tagName === "INPUT") return;
    document.getElementById("chart-settings").classList.remove("active");
}

