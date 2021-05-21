// записываем ранее сохраненные слова из хром стореджа в инпут
let excludeWord = document.getElementById("excludeWord");
chrome.storage.sync.get(['excludeWord'], function(result) {
  excludeWord.value = result.excludeWord;
});
// при нажатии на кнопку пересохранили слова и запустили скрипт
apply.addEventListener("click", () => {
  chrome.storage.sync.set({"excludeWord": excludeWord.value}, async function() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: activeTabScript,
    });
  });
});
// The body of this function will be executed as a content script inside the current page
function activeTabScript() {
  (function() {
    document.querySelectorAll('table#offers_table div.offer-wrapper').forEach((item, i, arr) => {
      //удалили результаты роботы предидущего раза, если они есть
      if(item.querySelectorAll('details.clearOLXsearch').length){
        item.style.cssText = "opacity: 1;";
        changeOpacity(item, item.querySelectorAll('details.clearOLXsearch div')[0].outerText);
      }else{
        fetch(item.querySelectorAll('td.title-cell div h3 a')[0].href)
        .then(res => res.text())
        .then((text) => {
          let html = parseHtmlFromString(text);
          // добавили описания
          let details = createDetails(html.querySelectorAll('div[data-cy="ad_description"] div')[0].outerText);
          item.appendChild(details);
          // если есть слова которые нужно исключить - делаем прозрачным объявление
          changeOpacity(item, html.querySelectorAll('div[data-cy="ad_description"] div')[0].outerText);
          // добавили слайдеры
          let slider = createSlider(html.querySelectorAll('div[data-cy="adPhotos-swiperSlide"] div img'));
          item.querySelectorAll('td.photo-cell')[0].innerHTML = slider.outerHTML;
        })
      }
    });
    styleNode = document.createElement("style");
    styleNode.innerText =  `
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
        background: #eee;
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
   })();
  function createSlider(adPhotos){
    let slider = document.createElement('div'); slider.setAttribute('class', 'slider');
    let slides = document.createElement('div'); slides.setAttribute('class', 'slides');
    for (let i = 0; i < adPhotos.length; i++) {
      let slide = document.createElement('div'); slide.setAttribute('class', `slide-${i}`);
        let a = document.createElement('a'); a.setAttribute('target', '_blank');
        let img = document.createElement('img'); img.setAttribute('width', '100');
          let src = adPhotos[i].src ? adPhotos[i].src : adPhotos[i].dataset.src;
          a.setAttribute('href', src);
          img.setAttribute('src', src);
        a.appendChild(img);
        slide.appendChild(a);
      slides.appendChild(slide);
    }
    slider.appendChild(slides);
    return slider
  }
  function chekContainsSubStrInStr(substr, str) {
    let string = str.toLowerCase().trim();
    let substring = substr.toLowerCase().trim();
    if(substring=="") return false;
    let subStrArr = substring.split(" ");
    for (var i = 0; i < subStrArr.length; i++) { 
      if(string.includes(subStrArr[i])) return true
    }
    return false
  }
  function changeOpacity(item, ad_description){
    chrome.storage.sync.get(['excludeWord'], function(result) {
      if(chekContainsSubStrInStr(result.excludeWord, ad_description)){
        item.style.cssText = "opacity: 0.2;";
      }
    });
  }
  function createDetails(ad_description){
    let details = document.createElement('details'); details.setAttribute('class', 'clearOLXsearch');
    let summary = document.createElement('summary'); summary.innerText = "Description";
    let div = document.createElement('div'); div.innerText = ad_description;
    details.appendChild(summary);
    details.appendChild(div);
    return details
  }
  function parseHtmlFromString(text){
    const parser = new DOMParser();
    return parser.parseFromString(text, "text/html");
  }
}