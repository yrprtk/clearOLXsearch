chrome.runtime.onMessage.addListener(async (request) => {
  if (request.message === 'TabUpdated' && (await autoStartGet())) {
    document.dispatchEvent(new CustomEvent('run'));
  }
});

window.onhashchange = () => {
  document.dispatchEvent(new CustomEvent('run'));
};

document.addEventListener('run', () => {
  run();
});

async function run() {
  const items = document.querySelectorAll(
    'table#offers_table div.offer-wrapper'
  );
  for (const item of items) {
    // удалили результаты роботы предидущего раза, если они есть
    if (item.querySelectorAll('details.clearOLXsearch').length) {
      if (await checkAdFiltering(item)) {
        item.style.cssText = 'opacity: 1; display: block;';
      }
    } else {
      fetch(item.querySelectorAll('td.title-cell div h3 a')[0].href)
        .then((res) => res.text())
        .then((text) => {
          const html = new DOMParser().parseFromString(text, 'text/html');
          // добавили слайдер
          const slider = createSlider(
            html.querySelectorAll('div[data-cy="adPhotos-swiperSlide"] div img')
          );
          item.querySelectorAll('td.photo-cell')[0].innerHTML =
            slider.outerHTML;
          item.querySelectorAll('tbody tr td')[0].onclick = function () {
            // по клику увеличение/уменьшение слайдера
            const cl = this.parentNode.parentNode.classList;
            if (cl.value.includes('mystyle')) {
              return cl.remove('mystyle');
            }
            return cl.add('mystyle');
          };
          // добавили описание
          const details = createDetails(
            html.querySelectorAll('div[data-cy="ad_description"] div')[0]
              .outerText
          );
          item.appendChild(details);
          // добавили кнопку блока продавца
          const blackLink = createBlackLink(
            html.querySelectorAll('div[data-cy="seller_card"] section a')[0]
              .href
          );
          blackLink.onclick = function () {
            blackListAdd(this.title);
          };
          item.appendChild(blackLink);
          // фильтруем объявление
          checkAdFiltering(item);
        });
    }
  }
  styleNode = document.createElement('style');
  styleNode.innerText = `
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
    `;
  document.body.appendChild(styleNode);
  // https://webformyself.com/karusel-na-chistom-css/
}

async function checkAdFiltering(item) {
  const details = item.querySelectorAll('details.clearOLXsearch div')[0]
    .outerText;
  const sellerURL = item.querySelectorAll('a')[2].title;
  if (
    chekContainsSubStrInStr(await excludeWordGet(), details) ||
    (await blackListChek(sellerURL))
  ) {
    if (await filterActionGet()) {
      item.style.cssText = 'display: none;';
    } else {
      item.style.cssText = 'opacity: 0.2;';
    }
    return false;
  }
  return true;
}
// storage
function storageGet(str) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['clearOLXsearch'], (res) => {
      if (res.clearOLXsearch) {
        resolve(res.clearOLXsearch[str]);
      }
      resolve(undefined);
    });
  });
}
function storageSet(obj) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['clearOLXsearch'], (res) => {
      const clearOLXsearch = res.clearOLXsearch ? res.clearOLXsearch : {};
      for (const key in obj) {
        if (!obj.hasOwnProperty(key)) {
          continue;
        }
        clearOLXsearch[key] = obj[key];
      }
      chrome.storage.sync.set({ clearOLXsearch }, (res2) => resolve(res2));
    });
  });
}
// autoStart
async function autoStartSave(autoStart) {
  await storageSet({ autoStart });
  if (autoStart) {
    document.dispatchEvent(new CustomEvent('run'));
  }
  document.dispatchEvent(new CustomEvent('autoStartRender'));
  return true;
}
async function autoStartGet() {
  let autoStart = await storageGet('autoStart');
  if (!autoStart) {
    autoStart = false;
  }
  return autoStart;
}
// filterAction
async function filterActionSave(filterAction) {
  await storageSet({ filterAction });
  document.dispatchEvent(new CustomEvent('run'));
  document.dispatchEvent(new CustomEvent('filterActionRender'));
  return true;
}
async function filterActionGet() {
  let filterAction = await storageGet('filterAction');
  if (!filterAction) {
    filterAction = false;
  }
  return filterAction;
}
// excludeWord
async function excludeWordSave(excludeWord) {
  await storageSet({ excludeWord });
  document.dispatchEvent(new CustomEvent('run'));
  document.dispatchEvent(new CustomEvent('excludeWordRender'));
  return true;
}
async function excludeWordGet() {
  let excludeWord = await storageGet('excludeWord');
  if (!excludeWord) {
    excludeWord = '';
  }
  return excludeWord;
}
// blackList
async function blackListSave(blackList, type) {
  if (type === 'set') {
    blackList = Array.from(blackList);
  }
  await storageSet({ blackList });
  document.dispatchEvent(new CustomEvent('run'));
  document.dispatchEvent(new CustomEvent('blackListRender'));
}
async function blackListGet(type) {
  let blackList = await storageGet('blackList');
  if (!blackList) {
    blackList = [];
  }
  if (type === 'set') {
    blackList = new Set(blackList);
  }
  return blackList;
}
async function blackListAdd(sellerURL) {
  const set = await blackListGet('set');
  set.add(sellerURL);
  await blackListSave(set, 'set');
}
async function blackListDel(sellerURL) {
  const set = await blackListGet('set');
  set.delete(sellerURL);
  await blackListSave(set, 'set');
}
async function blackListChek(sellerURL) {
  const set = await blackListGet('set');
  return set.has(sellerURL);
}
// saveFilter
async function saveFilterSave(saveFilter) {
  await storageSet({ saveFilter });
  document.dispatchEvent(new CustomEvent('saveFilterRender'));
  return true;
}
async function saveFilterGet() {
  let saveFilter = await storageGet('saveFilter');
  if (!saveFilter) {
    saveFilter = {};
  }
  return saveFilter;
}
async function saveFilterDel(key) {
  const saveFilter = await saveFilterGet();
  delete saveFilter[key];
  await saveFilterSave(saveFilter);
  return true;
}
async function saveFilterLoad(key) {
  const saveFilter = await saveFilterGet();
  await excludeWordSave(saveFilter[key].excludeWord);
  await blackListSave(saveFilter[key].blackList, 'str');
  return true;
}
async function saveFilterCopy(key) {
  const saveFilter = await saveFilterGet();
  const obj = {};
  obj[key] = saveFilter[key];
  copyToClipboard(JSON.stringify(obj));
  return true;
}
async function saveFilterAdd(key) {
  const excludeWord = await excludeWordGet();
  const blackList = await blackListGet(null);
  const saveFilter = await saveFilterGet();
  saveFilter[key] = { excludeWord, blackList };
  await saveFilterSave(saveFilter);
  return true;
}
async function saveFilterImport(filter) {
  try {
    const saveFilter = await saveFilterGet();
    const key = Object.keys(filter)[0];
    if (!key) {
      throw new Error('filter dont have key');
    }
    if (typeof filter[key] !== 'object') {
      throw new Error('fillter dont have body object');
    }
    if (!('excludeWord' in filter[key] && 'blackList' in filter[key])) {
      throw new Error('fillter body object dont have requared key');
    }
    saveFilter[key] = filter[key];
    await saveFilterSave(saveFilter);
    return true;
  } catch (error) {
    return output(error);
  }
}

function copyToClipboard(str) {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

function chekContainsSubStrInStr(substr, str) {
  if (substr === '' || str === '') return false;
  const string = str.toLowerCase().trim();
  const substring = substr.toLowerCase().trim();
  const subStrArr = substring.split(' ');
  for (let i = 0; i < subStrArr.length; i++) {
    if (string.includes(subStrArr[i])) return true;
  }
  return false;
}

function createSlider(adPhotos) {
  const slider = document.createElement('div');
  slider.setAttribute('class', 'slider');
  const slides = document.createElement('div');
  slides.setAttribute('class', 'slides');
  for (let i = 0; i < adPhotos.length; i++) {
    const slide = document.createElement('div');
    slide.setAttribute('class', `slide-${i}`);
    const img = document.createElement('img');
    const src = adPhotos[i].src ? adPhotos[i].src : adPhotos[i].dataset.src;
    img.setAttribute('src', src);
    slide.appendChild(img);
    slides.appendChild(slide);
  }
  slider.appendChild(slides);
  return slider;
}
function createDetails(adDescription) {
  const details = document.createElement('details');
  details.setAttribute('class', 'clearOLXsearch');
  const summary = document.createElement('summary');
  summary.innerText = 'Description';
  const div = document.createElement('div');
  div.innerText = adDescription;
  details.appendChild(summary);
  details.appendChild(div);
  return details;
}
function createBlackLink(sellerURL) {
  const a = document.createElement('a');
  a.setAttribute('title', sellerURL);
  a.innerText = 'Add seller in black list';
  return a;
}
function output(str) {
  alert(str);
}
