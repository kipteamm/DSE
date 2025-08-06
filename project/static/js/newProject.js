let templateId;
function selectTemplate(_templateId) {
    document.getElementById("step-1").classList.remove("active");
    moveStep(2);
    
    templateId = _templateId;

    document.getElementById("warning").innerText = "You must provide a value for all categories.";
    document.getElementById("page-templates").classList.remove("active");
    document.getElementById("steps").classList.toggle("step-3-active", templateId !== "quadrant");
    
    const page = document.getElementById("page-category")
    page.classList.add("active");
    page.classList.add(templateId);

    loadTemplate(page);

    if (templateId === "venn3" || templateId === "venn2") categories[4] = "%$%EMPTY%$%";
    if (templateId === "venn2") categories[3] = "%$%EMPTY%$%";
}

async function loadTemplate(elm) {
    const res = await fetch(`/static/icons/${templateId}.svg`);
    const svg = await res.text();
    elm.children[0].innerHTML += svg;
}

let categorySettings = false;
let focussedCategory = null;
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
    focussedCategory = parseInt(input.id.replace("category_", ""));
}

categories = {1: null, 2: null, 3: null, 4: null};
sections = {};
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
    continueBtn.onclick = async function () {
        // update categories
        document.getElementById("step-2").classList.remove("active");
        moveStep(templateId === "quadrant"? 4: 3);

        if (templateId === "quadrant") {
            const listOptions = document.getElementById("list-options");
            listOptions.classList.add("active");
            listOptions.scrollIntoView();
            return;
        };

        document.getElementById("warning").innerText = "You must provide a value for all sections.";
        document.getElementById("page-category").classList.remove("active");
        
        this.classList.remove("active");
        const page = document.getElementById("page-sections");
        page.classList.add("active");
        page.classList.add(templateId);

        await loadTemplate(page);
        loadSections(page);
    };
}

let colours = {1: "#456dff", 2: "#456dff", 3: "#456dff", 4: "#456dff"};
function setColour(colour) {
    colours[focussedCategory] = colour;

    const svg = document.getElementById("page-category").querySelector(`[elm="category-${focussedCategory}"]`);
    svg.style.fill = `${colour}66`;
}

function loadSections(page) {
    document.getElementById("current-section").innerText = categories[1] + " & " + categories[2];
    
    page.querySelectorAll("input").forEach(input => {
        input.placeholder = input.placeholder.replace("CATEGORY_1", categories[1]);
        input.placeholder = input.placeholder.replace("CATEGORY_2", categories[2]);

        if (categories[3] !== "%$%EMPTY%$%") input.placeholder = input.placeholder.replace("CATEGORY_3", categories[3]);
        if (categories[3] !== "%$%EMPTY%$%") input.placeholder = input.placeholder.replace("CATEGORY_4", categories[4]);
    });

    page.querySelector('[elm="category-1"]').style.fill = `${colours[1]}66`;
    page.querySelector('[elm="category-2"]').style.fill = `${colours[2]}66`;
    if (templateId !== "venn2") page.querySelector('[elm="category-3"]').style.fill = `${colours[3]}66`;
    if (templateId !== "venn2" && templateId !== "venn3") page.querySelector('[elm="category-4"]').style.fill = `${colours[4]}66`;

    if (templateId === "venn2") sections[1] = null;
    else if (templateId === "venn3") sections = {1: null, 2: null, 3: null, 4: null};
    else sections = {1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null, 9: null, 10: null, 11: null};
}

function setSection(elm ,id, value) {
    sections[id] = value? value: null;

    if (!sections[id]) return;
    if (!Object.values(sections).includes(null)) {
        document.getElementById("warning").innerText = "";
    }

    const continueBtn = document.getElementById("continue-btn");
    continueBtn.classList.add("active");
    continueBtn.onclick = function () {
        this.classList.remove("active");
        
        elm.classList.remove("active");
        if (Object.values(sections).includes(null)) {
            const nextSection = elm.parentNode.children[id];
            nextSection.classList.add("active");
            document.getElementById("current-section").innerText = nextSection.placeholder;
            return;
        };

        document.getElementById("step-3").classList.remove("active");
        moveStep(4);

        const listOptions = document.getElementById("list-options");
        listOptions.classList.add("active");
        listOptions.scrollIntoView();
    }
}

let options = [];
function addOption(input) {
    if (!input.value) return;

    const elm = document.createElement("div");
    elm.classList.add("pri-sec-con");
    elm.classList.add("option-element");
    elm.innerHTML = `
        <p>${input.value}</p>
        <iconify-icon icon="fa7-solid:circle-xmark" onclick="removeOption(this.parentNode)"></iconify-icon>
    `;

    options.push(elm);
    document.getElementById("option-elements").appendChild(elm);
    input.value = "";
}

function removeOption(elm) {
    options.splice(options.indexOf(elm), 1);
    elm.remove();
}

let shareId;
async function create() {
    _categories = {};
    for (let i = 1; i < 5; i++) {
        const name = categories[i];
        if (name == "%$%EMPTY%$%") break;
        
        _categories[i] = {"name": name, "color": colours[i]};
    }
    
    data = {
        "name": get("name"),
        "template": templateId,
        "categories": _categories,
        "sections": sections,
        "options": options.map((option) => option.innerText.trim())
    }

    const response = await fetch("/api/create", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Authorization": `Bearer ${getCookie("i_t")}`,
            "Content-Type": "application/json"
        }
    });

    const json = await response.json();
    if (!response.ok) return;

    shareId = json.id;
    document.querySelectorAll(".share-buttons a").forEach(a => {
        a.href = a.href.replace("https://example.com", `${window.location.protocol}//${window.location.host}/a/${shareId}`);
    });

    toggleModal("share");
}

function copyUrl() {
    navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/a/${shareId}`);
    alert("copied");
}

function makeChanges() { return window.location.href = "/app/edit/" + shareId; }
function vote() { return window.location.href = "/a/" + shareId; }

function moveStep(stepId) {
    document.getElementById("step-" + stepId).classList.add("active");

    if (!isMobile) return;
    document.getElementById("step-" + stepId).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start"
    });
}

let isMobile = window.innerWidth < 1024;
function newProjectInit() {
    if (isMobile) document.getElementById("step-1").scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start"
    });
}

if (document.readyState !== "loading") {
    newProjectInit();
} else {
    document.addEventListener("DOMContentLoaded", function () {
        newProjectInit();
    });
}

window.onclick = (event) => {
    if (!categorySettings) return;
    if (event.target.closest("#chart-settings") || event.target.tagName === "INPUT") return;
    document.getElementById("chart-settings").classList.remove("active");
}
