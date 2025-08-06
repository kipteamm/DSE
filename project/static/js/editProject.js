let main;
let changes;
let colorPicker;

let options = [];
let sections = {};
let categories = {};

let originalOptions = [];
let originalSections = {};
let originalCategories = {};

let activeSetting = "categories";
let activeSettingBtn;

function toggleSetting(btn, setting) {
    if (setting === activeSetting) return;
    document.getElementById(activeSetting + "-setting").classList.remove("active");
    activeSettingBtn.classList.remove("active");
    
    activeSetting = setting;
    activeSettingBtn = btn;
    
    document.getElementById(activeSetting + "-setting").classList.add("active");
    activeSettingBtn.classList.add("active");
}

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
    const sectionsSetting = document.getElementById("sections-setting");
    const optionsSetting = document.getElementById("option-elements");

    options.forEach(option => {
        const elm = document.createElement("div");
        elm.classList.add("pri-sec-con");
        elm.classList.add("option-element");
        elm.innerHTML = `
            <p>${option}</p>
            <iconify-icon icon="fa7-solid:circle-xmark" onclick="removeOption(this.parentNode)"></iconify-icon>
        `;
        optionsSetting.appendChild(elm);
    });

    for (const [id, _category] of Object.entries(json.categories)) {
        const category = _category.split("#");
        const elm = document.createElement("div");

        elm.classList.add("input")
        elm.innerHTML = `
            <span>Category ${id}</span>
            <div class="pri-sec-con">
                <input type="text" value="${category[0]}" placeholder="Category ${id}" id="category-${id}-input" onfocus="toggleCategory(true, ['${id}'])" onblur="toggleCategory(false, null)" oninput="updateCategoryName(this, ${id})">
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
        const sectionCategories = getCategories(id);
        const sectionName = sectionCategories.map((index) => categories[index].name).join(" & ");
        const elm = document.createElement("div");

        elm.classList.add("input")
        elm.innerHTML = `
            <span>${sectionName}</span>
            <input type="text" value="${section}" placeholder="${sectionName}" id="section-${id}-input" onfocus="toggleCategory(true, ${JSON.stringify(sectionCategories).replaceAll("\"", "'")})" onblur="toggleCategory(false, null)" oninput="updateSection(this, ${id})">
        `
        sectionsSetting.appendChild(elm);
    }
}

async function editInit() {
    activeSettingBtn = document.getElementById("categories-btn");

    const setting = get("setting") || "categories";
    toggleSetting(document.getElementById(setting + "-btn"), setting);

    main = document.getElementById("preview");
    changes = document.getElementById("changes");
    colorPicker = document.getElementById("color-picker");
    activeSettingBtn = document.querySelector("a.active");

    loadDiagram();
}

if (document.readyState !== "loading") {
    editInit();
} else {
    document.addEventListener("DOMContentLoaded", function () {
        editInit();
    });
}

function getCategories(id) {
    if (id === "1") return ["1", "2"];
    if (id === "2") return ["1", "3"];
    if (id === "3") return ["2", "3"];
    if (id === "4") return ["1", "2", "3"];
    if (id === "5") return ["1", "4"];
    if (id === "6") return ["2", "4"];
    if (id === "7") return ["3", "4"];
    if (id === "8") return ["1", "2", "4"];
    if (id === "9") return ["1", "3", "4"];
    if (id === "10") return ["2", "3", "4"];
    if (id === "11") return ["1", "2", "3", "4"];
}

let visibleCategories = null;

function toggleCategory(visible, categoryIds) {
    visibleCategories = visible ? categoryIds : null;
    console.log(visibleCategories, categoryIds);
    updateSvgs();
}

function updateSvgs() {
    document.querySelectorAll('[elm]').forEach(svgElm => {
        const elmAttr = svgElm.getAttribute('elm');
        const catId = elmAttr.replace('category-', '');

        if (visibleCategories === null) {
            const category = categories[catId];
            if (category?.color) {
                svgElm.style.fill = `#${category.color}66`;
            }
        } else if (!visibleCategories.includes(elmAttr.replace("category-", ""))) {
            svgElm.style.fill = '#66666666';
        }
    });
}

function updateCategoryName(input, id) {
    if (!input.value) return input.value = categories[id].name;

    categories[id].name = input.value;
    changes.classList.toggle("active", hasChanges());
}

function updateSection(input, id) {
    if (!input.value) return input.value = sections[id];
    
    sections[id] = input.value;
    changes.classList.toggle("active", hasChanges());
}

function addOption(input) {
    if (!input.value) return;

    const elm = document.createElement("div");
    elm.classList.add("pri-sec-con");
    elm.classList.add("option-element");
    elm.innerHTML = `
        <p>${input.value}</p>
        <iconify-icon icon="fa7-solid:circle-xmark" onclick="removeOption(this.parentNode)"></iconify-icon>
    `;

    document.getElementById("option-elements").appendChild(elm);
    options.push(input.value);
    input.value = "";

    changes.classList.toggle("active", hasChanges());
}

function removeOption(elm) {
    options.splice(options.indexOf(elm), 1);
    elm.remove();

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

function getChanges() {
    let changes = []
    if (JSON.stringify(options) !== JSON.stringify(originalOptions)) changes.push("options");
    if (JSON.stringify(sections) !== JSON.stringify(originalSections)) changes.push("sections");

    for (const id in categories) {
        const current = categories[id];
        const original = originalCategories[id];

        if (original && current.name === origin.name && current.color === original.color) continue;
        changes.push("categories");
        break
    }

    return changes;
}

function hasChanges() {
    return getChanges().length > 0;
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

function discard() {
    if (isSaving) return;
    window.location.reload();
}

let isSaving = false;
async function submit(btn) {
    btn.disabled = true;
    btn.innerText = "Saving..."
    isSaving = true;

    const changes = getChanges();
    let data = {};

    if (changes.includes("categories")) {
        data["categories"] = categories
    }
    if (changes.includes("sections")) {
        data["sections"] = sections
    }
    if (changes.includes("options")) {
        data["options"] = options.map((option) => option.innerText.trim())
    }

    const response = await fetch(`/api/${id}/edit`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: {
            "Authorization": `Bearer ${getCookie("i_t")}`,
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) return;
    changes.classList.remove("active");
    btn.disabled = false;
    btn.innerText = "save";
    isSaving = false;
}

window.onclick = (event) => {
    if (event.target.closest("#color-picker") || event.target.closest(".color")) return;
    colorPicker.classList.remove("active");
}
