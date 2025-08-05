let main;
let changes;
let colorPicker;

let options = [];
let sections = {};
let categories = {};

let originalOptions = [];
let originalSections = {};
let originalCategories = {};

async function loadTemplate() {
    const res = await fetch(`/static/icons/${template}.svg`);
    const svg = await res.text();
    main.innerHTML += svg;

    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = `/static/css/${template}.css`;
    document.head.appendChild(cssLink);
}

async function loadDiagram() {
    const response = await fetch(`/api/diagram/${id}`, {method: "GET", headers: {"Authorization": `Bearer ${getCookie("i_t")}`}});
    if (!response.ok) return;

    const json = await response.json();
    await loadTemplate();

    options = json.options;
    sections = json.sections;

    originalOptions = structuredClone(options);
    originalSections = structuredClone(sections);

    const categoriesSetting = document.getElementById("categories-setting");

    for (const [id, _category] of Object.entries(json.categories)) {
        const category = _category.split("#");
        const elm = document.createElement("div");

        elm.addEventListener("mouseenter", () => toggleCategoryVisibility(true, id));
        elm.addEventListener("mouseleave", () => toggleCategoryVisibility(false, id));

        elm.classList.add("input")
        elm.innerHTML = `
            <span>Category ${id}</span>
            <div class="pri-sec-con">
                <input type="text" value="${category[0]}" placeholder="Category ${id}" id="category-${id}-input" onfocus="toggleCategory(true, '${id}')" onblur="toggleCategory(false, null)" oninput="updateCategoryName(this, ${id})">
                <div class="color" style="background:#${category[1]};border-color:#${category[1]};" onclick="toggleColorPicker(this, ${id})"></div>
            </div>
        `
        categoriesSetting.appendChild(elm);

        document.querySelector(`[elm="category-${id}"]`).style.fill = `#${category[1]}66`;
        categories[id] = {"name": category[0], "color": category[1]};
        originalCategories[id] = {"name": category[0], "color": category[1]};
    }

    if (template === "quadrant") return;
    for (const [id, section] of Object.entries(sections)) {
        const elm = document.createElement("span");
        elm.id = "section-" + id;
        elm.innerText = section;

        main.appendChild(elm);
    }
}

async function editInit() {
    main = document.getElementById("preview");
    changes = document.getElementById("changes");
    colorPicker = document.getElementById("color-picker");

    loadDiagram();
}

if (document.readyState !== "loading") {
    editInit();
} else {
    document.addEventListener("DOMContentLoaded", function () {
        editInit();
    });
}

let visibleCategory = null;

function toggleCategory(visible, categoryId) {
    visibleCategory = visible ? categoryId : null;
    updateSvgs();
}

function toggleCategoryVisibility(visible, categoryId) {
    if (visibleCategory || !visible) return updateSvgs();

    document.querySelectorAll('[elm]').forEach(svgElm => {
        const elmAttr = svgElm.getAttribute('elm');
        if (elmAttr !== `category-${categoryId}`) {
            svgElm.style.fill = '#66666666';
        }
    });
}

function updateSvgs() {
    document.querySelectorAll('[elm]').forEach(svgElm => {
        const elmAttr = svgElm.getAttribute('elm');
        const catId = elmAttr.replace('category-', '');

        if (visibleCategory === null) {
            const category = categories[catId];
            if (category?.color) {
                svgElm.style.fill = `#${category.color}66`;
            }
        } else if (elmAttr !== `category-${visibleCategory}`) {
            svgElm.style.fill = '#66666666';
        }
    });
}

function updateCategoryName(input, id) {
    if (!input.value) return input.value = categories[id].name;

    categories[id].name = input.value;
    changes.classList.toggle("active", hasChanges());
}

function hasChanges() {
    if (JSON.stringify(options) !== JSON.stringify(originalOptions)) return true;
    if (JSON.stringify(sections) !== JSON.stringify(originalSections)) return true;

    for (const id in categories) {
        const current = categories[id];
        const original = originalCategories[id];

        if (!original || current.name !== original.name || current.color !== original.color) return true;
    }

    return false;
}

let activePicker = null;
let colorInput = null;
function toggleColorPicker(input, id) {
    colorInput = input;

    if (!input) {
        colorPicker.classList.toggle("active");
        if (!colorPicker.classList.contains("active")) return;
    }

    if (id === activePicker) {
        activePicker = null;
        colorPicker.classList.remove("active")
        return;
    }

    colorPicker.classList.add("active");
    activePicker = id;
    
    const inputRect = input.getBoundingClientRect();
    const parentRect = input.offsetParent.getBoundingClientRect();

    const offsetTop = inputRect.top - parentRect.top + input.offsetHeight;
    const offsetLeft = inputRect.left - parentRect.left - 50;

    colorPicker.style.top = `${offsetTop}px`;
    colorPicker.style.left = `${offsetLeft}px`;
}

function setColour(color) {
    categories[activePicker].color = color.replace("#", "");
    colorInput.style.background = color;
    colorInput.style.borderColor = color;
    document.querySelector(`[elm="category-${activePicker}"]`).style.color = color + "66";
    updateSvgs();

    changes.classList.toggle("active", hasChanges());
}

window.onclick = (event) => {
    if (event.target.closest("#color-picker") || event.target.closest(".color")) return;
    colorPicker.classList.remove("active");
}
