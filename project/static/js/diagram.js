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

    if (template === "venn4") {        
        main.querySelector("svg").innerHTML += `
            <rect style="transform-origin: 129.649px 369.944px;" transform="matrix(0.85716712, 0.51503789, -0.51503789, 0.85716712, 61.10104768, -0.43561814)" x="128.149" y="322.444" width="3" height="85" rx="1.5" ry="1.5"/>
            <rect style="stroke-width: 1; transform-origin: 129.649px 369.944px;" transform="matrix(0.85716712, -0.51503789, 0.51503789, 0.85716712, 178.10102737, -0.45602916)" x="128.149" y="322.444" width="3" height="85" rx="1.5" ry="1.5"/>
        `
    }

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
    const startedProcessing = new Date().getTime();
    await loadDiagram();

    item.addEventListener("mousedown", dragStart);
    window.addEventListener("mousemove", dragMove);
    window.addEventListener("mouseup", dragEnd);

    item.addEventListener("touchstart", dragStart, { passive: true });
    window.addEventListener("touchmove", dragMove, { passive: false });
    window.addEventListener("touchend", dragEnd);

    document.getElementById("dark-overlay").classList.add("active");
    item.innerText = options[0];

    const loadingLeft = new Date().getTime() - startedProcessing;
    if (loadingLeft >= 3000) return stopLoading();

    setTimeout(() => stopLoading(), 3000 - loadingLeft);
}

function stopLoading() {
    document.getElementById("loading").style.display = "none";
    document.body.classList.remove("placing");
    main.classList.add("active");
    dimension = main.offsetWidth;
}

let item;
let option;
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

function getEventXY(e) {
    // while touching / moving
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    // at touchend
    if (e.changedTouches && e.changedTouches.length > 0) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    // mouse events
    return { x: e.clientX, y: e.clientY };
}


let holdTimeout = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let placements = {};
let dragged = null;

function dragStart(event) {
    const { x, y } = getEventXY(event);
    dragStartX = x;
    dragStartY = y;

    dragged = event.currentTarget;
    dragged.classList.add("placing");

    isDragging = true;
    document.body.classList.add("placing");
}

function dragMove(event) {
    if (!isDragging) return;
    const { x, y } = getEventXY(event);

    dragged.style.left = `${x}px`;
    dragged.style.top = `${y}px`;
}

function dragEnd(event) {
    if (!isDragging) return;
    isDragging = false;
    dragged.style.pointerEvents = "none";

    const { x, y } = getEventXY(event);
    const realTarget = document.elementFromPoint(x, y);

    dragged.style.pointerEvents = "all";
    if (!realTarget.closest("ellipse") && !realTarget.closest("path") && !realTarget.closest("li")) return;

    const isLandscape = (window.innerWidth / window.innerHeight) > 1;
    let offsetX = 0, offsetY = 0;

    if (isLandscape) {
        offsetX = (window.innerWidth - dimension) / 2;
    } else {
        offsetY = (window.innerHeight - dimension) / 2;
    }

    const top = Math.round(((y - offsetY) / dimension) * 1000) / 10;
    const left = Math.round(((x - offsetX) / dimension) * 1000) / 10;

    dragged.classList.remove("placing");

    placements[dragged.innerText] = `${top}%${left}`;
    if (dragged.id === "item") return;

    dragged.style.top = top + "%";
    dragged.style.left = left + "%";
}

function next(skip) {
    options.shift();

    item.removeAttribute("style");

    if (!skip) {
        const elm = item.cloneNode(true);
        const positions = placements[elm.innerText].split("%")
        elm.removeAttribute("id");
        elm.style.top = positions[0] + "%";
        elm.style.left = positions[1] + "%";
        elm.addEventListener("mousedown", dragStart);
        elm.addEventListener("touchstart", dragStart);
        main.appendChild(elm);
    }

    document.body.classList.remove("placing");
    
    item.classList.add("placing");
    dragged = null;

    if (options.length > 0) {
        item.innerText = options[0];
        return;
    } 

    item.innerText = "Finished!"
    item.classList.add("finished")

    document.getElementById("placement-text").innerText = "You have placed all available options."
    const button = document.getElementById("placement-btn");
    button.innerText = "Submit"
    button.classList.remove("secondary");
    button.classList.add("primary");
    button.setAttribute("onclick", "submit()")
}

function skip() {
    dragged = item;
    next(true);
}

async function submit() {
    searchOptions = document.getElementById("search-options");

    document.body.classList.add("placing");
    item.remove();
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
        if (json.__track_id === trackId) {
            parseAnswers(json);
            
            setTimeout(() => {
                document.getElementById("loading").style.display = "none";
                main.classList.add("active")
            }, 500);
            return;
        }

        setTimeout(pollStatus, 1000);
    };

    pollStatus();
}

async function loadAnswers() {
    document.getElementById("loading-text").innerText = "Loading...";
    main.classList.add("answered")

    const response = await fetch(`/api/diagram/${id}/answers`, {headers: {"Authorization": `Bearer ${getCookie("i_t")}`}});
    if (!response.ok) return;

    const json = await response.json();
    parseAnswers(json);
    
    await loadDiagram();

    document.addEventListener("click", (event) => {
        if (event.target.closest(".search")) return;
        searchOptions.classList.remove("active");
    });

    searchOptions = document.getElementById("search-options");
    setTimeout(() => {
        document.getElementById("loading").style.display = "none";
        main.classList.add("active")
    }, 500);
}

let orderedData = {};
function parseAnswers(data) {
    document.querySelectorAll("li").forEach(element => { element.remove() });

    for (const [key, positions] of Object.entries(data)) {
        if (key === "__track_id") continue;

        const medianTop = calculateMedian(positions.top.sort());
        const medianLeft = calculateMedian(positions.left.sort());

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