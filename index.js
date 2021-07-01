chrome.runtime.onMessage.addListener(async (request) => {
    if (request.message === 'TabUpdated' && await autoStartGet()) {
        document.dispatchEvent(new CustomEvent("run"));
    }
});

if(this.location.origin==="https://www.olx.ua"){
    document.addEventListener("run", () => {
        run();
    });
}

async function run() {
    let items = document.querySelectorAll('table#offers_table div.offer-wrapper');
    for (const item of items) {
        //удалили результаты роботы предидущего раза, если они есть
        if(item.querySelectorAll('details.clearOLXsearch').length){
            if( await checkAdFiltering(item) ){ item.style.cssText = "opacity: 1; display: block;"; }
        }else{
            fetch(item.querySelectorAll('td.title-cell div h3 a')[0].href)
            .then(res => res.text())
            .then(text => {
                let html = new DOMParser().parseFromString(text, "text/html");
                // добавили слайдер
                let slider = createSlider(html.querySelectorAll('div[data-cy="adPhotos-swiperSlide"] div img'));
                item.querySelectorAll('td.photo-cell')[0].innerHTML = slider.outerHTML;
                item.querySelectorAll('tbody tr td')[0].onclick = function() {
                    //по клику увеличение/уменьшение слайдера
                    let cl = this.parentNode.parentNode.classList;
                    if(cl.value.includes("mystyle")){ return cl.remove("mystyle"); }
                    cl.add("mystyle");
                }
                // добавили описание
                let details = createDetails(html.querySelectorAll('div[data-cy="ad_description"] div')[0].outerText);
                item.appendChild(details);
                // добавили кнопку блока продавца
                let blackLink = createBlackLink(html.querySelectorAll('div[data-cy="seller_card"] section a')[0].href);
                blackLink.onclick = function() { blackListAdd(this.text) };
                item.appendChild(blackLink);
                // фильтруем объявление
                checkAdFiltering(item);
            })
        }
    };
    styleNode = document.createElement("style");
    styleNode.innerText =  `
    .mystyle .title-cell, .mystyle .td-price, .mystyle .bottom-cell, .mystyle .tright{
        display: none !important;
    }
    .mystyle .photo-cell, .mystyle .slider, .mystyle .slides > div{
        width: 780px !important;
    }
    .mystyle .slides > div {
        height: 780px !important;
    }
    * {
        box-sizing: border-box;
    }
    
    .slider {
        width: 200px;
        text-align: center;
        overflow: hidden;
    }
    
    .slides {
        display: flex;
        cursor: pointer;
        
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        
        
        
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        
        /*
        scroll-snap-points-x: repeat(300px);
        scroll-snap-type: mandatory;
        */
    }
    .slides::-webkit-scrollbar {
        width: 10px;
        height: 10px;
    }
    .slides::-webkit-scrollbar-thumb {
        background: white;
        border: 2px solid #002F34;
        border-radius: 10px;
    }
    .slides::-webkit-scrollbar-track {
        background: transparent;
    }
    .slides > div {
        scroll-snap-align: start;
        flex-shrink: 0;
        width: 200px;
        height: 200px;
        margin-right: 50px;
        border-radius: 10px;
        transform-origin: center center;
        transform: scale(1);
        transition: transform 0.5s;
        position: relative;
        
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 100px;
    }
    .slides > div:target {
    /*   transform: scale(0.8); */
    }
    .author-info {
        background: rgba(0, 0, 0, 0.75);
        color: white;
        padding: 0.75rem;
        text-align: center;
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        margin: 0;
    }
    .author-info a {
        color: white;
    }
    img {
        object-fit: cover;
        position: absolute;
        top: 0;
        left: 0;
        object-fit: contain;
        width: 100%;
        height: 100%;
    }
    
    .slider > a {
        display: inline-flex;
        width: 1.5rem;
        height: 1.5rem;
        background: white;
        text-decoration: none;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        margin: 0 0 0.5rem 0;
        position: relative;
    }
    .slider > a:active {
        top: 1px;
    }
    .slider > a:focus {
        background: #000;
    }
    
    /* Don't need button navigation */
    @supports (scroll-snap-type) {
        .slider > a {
        display: none;
        }
    }
    
    body {
        align-items: center;
        justify-content: center;
        font-family: 'Ropa Sans', sans-serif;
    }


    details{
        cursor: pointer;
    }
    `
    document.body.appendChild(styleNode);
    // https://webformyself.com/karusel-na-chistom-css/
};

async function checkAdFiltering(item){
    let details = item.querySelectorAll('details.clearOLXsearch div')[0].outerText;
    let sellerURL = item.querySelectorAll('a')[2].innerText;
    if( chekContainsSubStrInStr(await excludeWordGet(), details) || await blackListChek(sellerURL) ){
        if( await filterActionGet()){
            item.style.cssText = "display: none;";
        } else {
            item.style.cssText = "opacity: 0.2;";
        }
        return false
    }
    return true
}
// storage
function storageGet(str){
    return new Promise(resolve => {
        chrome.storage.sync.get([str], res => resolve(res[str]));
    });
}
function storageSet(obj){
    return new Promise(resolve => {
        chrome.storage.sync.set(obj, res => resolve(res));
    });
}
// autoStart
async function autoStartSave(autoStart) {
    await storageSet({autoStart});
    if(autoStart){ document.dispatchEvent(new CustomEvent("run")); }
    document.dispatchEvent(new CustomEvent("autoStartRender"));
    return true
}
async function autoStartGet() {
    let autoStart = await storageGet('autoStart');
    if(!autoStart){ autoStart = false }
    return autoStart
}
// filterAction
async function filterActionSave(filterAction) {
    await storageSet({filterAction});
    document.dispatchEvent(new CustomEvent("run"));
    document.dispatchEvent(new CustomEvent("filterActionRender"));
    return true
}
async function filterActionGet() {
    let filterAction = await storageGet('filterAction');
    if(!filterAction){ filterAction = false }
    return filterAction
}
// excludeWord
async function excludeWordSave(excludeWord) {
    await storageSet({excludeWord});
    document.dispatchEvent(new CustomEvent("run"));
    document.dispatchEvent(new CustomEvent("excludeWordRender"));
    return true
}
async function excludeWordGet() {
    let excludeWord = await storageGet('excludeWord');
    if(!excludeWord){ excludeWord = "" }
    return excludeWord
}
// blackList
async function blackListSave(value, type) {
    if(type==="set"){
        await storageSet({'blackList': JSON.stringify([...value])});
    } else 
    if(type==="str"){
        await storageSet({'blackList': value});
    }
    document.dispatchEvent(new CustomEvent("run"));
    document.dispatchEvent(new CustomEvent("blackListRender"));
}
async function blackListGet(type) {
    let blackList = await storageGet('blackList');
    if(!blackList){ blackList = "[]" }
    if(type==="set"){
        let set = new Set(JSON.parse(blackList));
        return set;
    } else 
    if(type==="str"){
        return blackList;
    }
}
async function blackListAdd(sellerURL){
    let set = await blackListGet("set");
    set.add(sellerURL);
    await blackListSave(set, "set");
}
async function blackListDel(sellerURL) {
    let set = await blackListGet("set");
    set.delete(sellerURL);
    await blackListSave(set, "set");
}
async function blackListChek(sellerURL) {
    let set = await blackListGet("set");
    return set.has(sellerURL);
}
// saveFilter
async function saveFilterSave(saveFilter){
    await storageSet({saveFilter});
    document.dispatchEvent(new CustomEvent("saveFilterRender"));
    return true
}
async function saveFilterGet(){
    let saveFilter = await storageGet('saveFilter');
    if(!saveFilter){ saveFilter = {}}
    return saveFilter
}
async function saveFilterDel(key){
    let saveFilter = await saveFilterGet();
    delete saveFilter[key];
    await saveFilterSave(saveFilter);
    return true
}
async function saveFilterLoad(key){
    let saveFilter = await saveFilterGet();
    await excludeWordSave(saveFilter[key].excludeWord);
    await blackListSave(saveFilter[key].blackList, "str");
    return true
}
async function saveFilterCopy(key){
    let saveFilter = await saveFilterGet();
    let obj = {}; obj[key] = saveFilter[key];
    copyToClipboard(JSON.stringify(obj));
    return true
}
async function saveFilterAdd(key){
    let excludeWord = await excludeWordGet();
    let blackList = await blackListGet("str");
    let saveFilter = await saveFilterGet();
    saveFilter[key] = {excludeWord, blackList};
    await saveFilterSave(saveFilter);
    return true
}
async function saveFilterImport(filter){
    try {
        let saveFilter = await saveFilterGet();
        let key = Object.keys(filter)[0];
        if(!key){throw new Error("filter dont have key")};
        if(typeof filter[key] !== 'object'){ throw new Error("fillter dont have body object")};
        if(!("excludeWord" in filter[key] && "blackList" in filter[key])){ throw new Error("fillter body object dont have requared key")};
        saveFilter[key] = filter[key];
        await saveFilterSave(saveFilter);
        return true
    } catch (error) {
        output(error);
    }
}

function copyToClipboard (str){
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
};

function chekContainsSubStrInStr(substr, str) {
    if(substr===""||str==="") return false;
    let string = str.toLowerCase().trim();
    let substring = substr.toLowerCase().trim();
    let subStrArr = substring.split(" ");
    for (var i = 0; i < subStrArr.length; i++) { 
        if(string.includes(subStrArr[i])) return true
    }
    return false
}

function createSlider(adPhotos){
    let slider = document.createElement('div'); slider.setAttribute('class', 'slider');
    let slides = document.createElement('div'); slides.setAttribute('class', 'slides');
    for (let i = 0; i < adPhotos.length; i++) {
        let slide = document.createElement('div'); slide.setAttribute('class', `slide-${i}`);
        let img = document.createElement('img');
        let src = adPhotos[i].src ? adPhotos[i].src : adPhotos[i].dataset.src;
        img.setAttribute('src', src);
        slide.appendChild(img); 
        slides.appendChild(slide);
    }
    slider.appendChild(slides);
    return slider
}
function createDetails(ad_description){
    let details = document.createElement('details'); details.setAttribute('class', 'clearOLXsearch');
    let summary = document.createElement('summary'); summary.innerText = "Description";
    let div = document.createElement('div'); div.innerText = ad_description;
    details.appendChild(summary);
    details.appendChild(div);
    return details
}
function createBlackLink(sellerURL){
    let a = document.createElement('a');
    a.innerText = sellerURL;
    return a;
}
function output(str){
    alert(str);
}