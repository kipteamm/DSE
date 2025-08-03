function shuffle(array) {
    let currentIndex = array.length;

    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

let main;
async function loadTemplate() {
    const res = await fetch(`/static/icons/${template}.svg`);
    const svg = await res.text();
    main.innerHTML += svg;

    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = `/static/css/${template}.css`;
    document.head.appendChild(cssLink);
}

let options;
let dimension;
async function loadDiagram() {
    const response = await fetch(`/api/diagram/${id}`, {method: "GET", headers: {"Authorization": `Bearer ${getCookie("i_t")}`}});
    if (!response.ok) return;

    const json = await response.json();
    await loadTemplate();

    for (const [id, _category] of Object.entries(json.categories)) {
        const category = _category.split("#");
        const elm = document.createElement("b");
        elm.id = "category-" + id;
        elm.innerText = category[0];

        main.appendChild(elm);
        document.querySelector(`[elm="category-${id}"]`).style.fill = `#${category[1]}66`;
    }

    for (const [id, section] of Object.entries(json.sections)) {
        const elm = document.createElement("span");
        elm.id = "section-" + id;
        elm.innerText = section;

        main.appendChild(elm);
    }

    if (answered) return;
    options = json.options;
    shuffle(options);
}

async function prepareSubmissions() {
    await loadDiagram();
    
    counter = document.getElementById("counter");
    option = document.getElementById("option");
    
    currentOption = options[0];
    option.innerText = currentOption;
    counter.innerText = options.length;
    
    document.getElementById("loading").style.display = "none";
    main.classList.add("active");
    dimension = main.offsetWidth;
}

let item;
let option;
let counter;
let searchOptions;
function diagramInit() {
    main = document.getElementById("main");
    item = document.getElementById("item");

    if (userId) {
        if (answered) return loadAnswers();
        return prepareSubmissions();
    }
    toggleModal("auth");
}

if (document.readyState !== 'loading') {
    diagramInit();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        diagramInit();
    });
}

document.addEventListener("mousemove", handleMove);
document.addEventListener("touchmove", handleMove, { passive: false });

document.addEventListener("click", handleClick);
document.addEventListener("touchend", handleClick);

let placements = {};
function handleMove(event) {
    if (!isPlacing) return;

    let x, y;
    if (event.touches) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
    } else {
        x = event.clientX;
        y = event.clientY;
    }

    item.style.top = `${y}px`;
    item.style.left = `${x}px`;
}

function handleClick(event) {
    if (!isPlacing) return;
    if (isReplacing && new Date().getTime() - replaceFired < 500) return;

    let x, y;
    if (event.touches) {
        x = event.changedTouches[0].clientX;
        y = event.changedTouches[0].clientY;
    } else {
        x = event.clientX;
        y = event.clientY;
    }

    const realTarget = document.elementFromPoint(x, y);
    if (!realTarget.closest("ellipse") && !realTarget.closest("path"))  return;

    const isLandscape = (window.innerWidth / window.innerHeight) > 1;
    let offsetX = 0, offsetY = 0;

    if (isLandscape) {
        offsetX = (window.innerWidth - dimension) / 2;
    } else {
        offsetY = (window.innerHeight - dimension) / 2;
    }

    const top = Math.round(((y - offsetY) / dimension) * 100);
    const left = Math.round(((x - offsetX) / dimension) * 100);

    const elm = document.createElement("li");
    elm.innerText = currentOption;
    elm.style.top = top + "%";
    elm.style.left = left + "%";
    elm.onclick = (event) => replace(event, elm);

    main.appendChild(elm);
    placements[elm.innerText] = `${top}%${left}`;

    togglePlacing(null, option);

    if (!isReplacing) {
        counter.innerText = options.length - 1;
        options.shift();
    }

    if (options.length === 0) {
        option.innerText = "All done!";
        return;
    }

    currentOption = options[0];
    option.innerText = currentOption;
    isReplacing = false;
}

let isPlacing = false;
function togglePlacing(event, btn) {
    if (options.length === 0) return;

    btn.classList.toggle("secondary", isPlacing);
    btn.classList.toggle("tertiary", !isPlacing);
    item.classList.toggle("active", !isPlacing);

    isPlacing = !isPlacing;
    if (!isPlacing) return;

    let x = 0;
    if (event) {
        if (event.touches) {
            x = event.touches[0].clientX;
        } else {
            x = event.clientX;
        }
    }

    // item.style.top = `${y}px`;
    item.style.left = `${x}px`;
    item.innerText = currentOption || btn.innerText;
}

let isReplacing = false;
let currentOption = null;
let replaceFired = 0;
function replace(event, elm) {
    if (isPlacing) togglePlacing(null, option);

    delete placements[elm.innerText];
    currentOption = elm.innerText;
    option.innerText = currentOption;
    elm.remove();

    isReplacing = true;
    replaceFired = new Date().getTime();
    togglePlacing(event, option);
}

function skip() {
    if (isPlacing) togglePlacing(null, option);

    options.shift();
    currentOption = options[0];
    option.innerText = currentOption;
}

async function submit() {
    searchOptions = document.getElementById("search-options");
    
    document.getElementById("loading").style.display = "flex";
    document.getElementById("loading-text").innerText = "Parsing results";
    main.classList.add("answered")
    main.classList.remove("active");
    
    const response = await fetch(`/api/diagram/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({"submissions": placements}),
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getCookie("i_t")}`
        }
    });

    if (!response.ok) return;
    const json = await response.json();
    const trackId = json.track_id;

    const pollStatus = async () => {
        const response = await fetch(`/api/diagram/${id}/answers?tracking=true`, {headers: {"Authorization": `Bearer ${getCookie("i_t")}`}});
        if (response.status === 403 || response.status === 204) return setTimeout(pollStatus, 1000);
        else if (!response.ok) return;
        
        const json = await response.json();
        if (json.__track_id === trackId) return parseAnswers(json);

        setTimeout(pollStatus, 1000);
    };

    pollStatus();
}

async function loadAnswers() {
    const response = await fetch(`/api/diagram/${id}/answers`, {headers: {"Authorization": `Bearer ${getCookie("i_t")}`}});
    if (!response.ok) return;

    const json = await response.json();
    parseAnswers(json);
    
    main.classList.add("answered")
    await loadDiagram();

    document.getElementById("loading").style.display = "none";
    document.addEventListener("click", (event) => {
        if (event.target.closest(".search")) return;
        searchOptions.classList.remove("active");
    });

    searchOptions = document.getElementById("search-options");
    main.classList.add("active");
}

let orderedData = {};
function parseAnswers(data) {
    document.querySelectorAll("li").forEach(element => { element.remove() });

    for (const [key, positions] of Object.entries(data)) {
        if (key === "__track_id") continue;

        const medianTop = calculateMedian(positions.top);
        const medianLeft = calculateMedian(positions.left);

        orderedData[key] = {
            "top": positions.top,
            "left": positions.left,
            "medianTop": medianTop,
            "medianLeft": medianLeft
        }

        const elm = document.createElement("li");
        elm.setAttribute("onclick", `itemClick('${key}')`)
        elm.innerText = key;
        elm.style.top = medianTop + "%";
        elm.style.left = medianLeft + "%";

        main.appendChild(elm);
    }

    document.getElementById("loading").style.display = "none";
    main.classList.add("active");
}

function calculateMedian(array) {
    if (array.length % 2 !== 0) return array[Math.floor(array.length / 2)];

    return (array[array.length / 2 - 1] + array[array.length / 2]) / 2;
}

function toggleVisible() {
    main.classList.toggle("hide");
}

function searchItem(item) {
    searchOptions.innerHTML = "";
    
    let content = false;
    for (const key of Object.keys(orderedData)) {
        if (!item) break;
        if (!key.toLowerCase().includes(item.toLowerCase())) continue;
        searchOptions.innerHTML += `<div onclick="itemClick('${key}')">${key.replaceAll("_", " ")}</div>`
        content = true;
    }

    searchOptions.classList.toggle("active", content);
}

function itemClick(item) {
    main.classList.toggle("hide");

    if (!main.classList.contains("hide")) {
        document.querySelectorAll(".temp").forEach(elm => {elm.remove()});
        return;
    };
    const data = orderedData[item];

    const elm = document.createElement("li");
    elm.setAttribute("onclick", `itemClick('${item}')`)
    elm.classList.add("specific");
    elm.classList.add("median");
    elm.classList.add("temp");
    elm.innerText = item;
    elm.style.top = data.medianTop + "%";
    elm.style.left = data.medianLeft + "%";

    main.appendChild(elm); 

    if (data.top.length === 1) return;
    for (let i = 0; i < data.top.length; i++) {
        const elm = document.createElement("li");
        elm.setAttribute("onclick", `itemClick('${item}')`)
        elm.classList.add("specific"); 
        elm.classList.add("temp"); 
        elm.innerText = item;
        elm.style.top = data.top[i] + "%";
        elm.style.left = data.left[i] + "%";

        main.appendChild(elm);   
    }  
}