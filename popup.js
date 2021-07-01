// chrome.storage.sync.clear(function(result) {
//   console.log("clear");
// });

document.addEventListener("click", async (event) => {
  try {
    let filterName = document.getElementById("filterName").value;
    let excludeWord = document.getElementById("excludeWord").value;
    let autoStart = document.getElementById("autoStart").checked;
    let filterAction = document.getElementById("filterAction").checked;
    switch (event.target.id) {
      case 'autoStart': await autoStartSave(autoStart); break;
      case 'filterAction': await filterActionSave(filterAction); break;
      case 'apply': await excludeWordSave(excludeWord); break;
      case 'save': await saveFilterAdd(filterName); document.getElementById("filterName").value = ""; break;
      case 'import': await saveFilterImport(JSON.parse(filterName)); document.getElementById("filterName").value = "";  break;
      default:
    }    
  } catch (error) {
    output(error);
  }
});
document.addEventListener("run", async() => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: run,
  });
});
document.addEventListener("autoStartRender", async() => {
  document.getElementById("autoStart").checked = await autoStartGet();
});
document.addEventListener("filterActionRender", async() => {
  document.getElementById("filterAction").checked = await filterActionGet();
});
document.addEventListener("excludeWordRender", async() => {
  document.getElementById("excludeWord").value = await excludeWordGet();
});
document.addEventListener("blackListRender", async() => {
  let set = await blackListGet("set");
  document.getElementById("blackList").innerHTML = ""
  set.forEach((key)=>{
    adRowInTable(document.getElementById("blackList"), [key, createBtn(key, "blackListDel")]);
  });
});
document.addEventListener("saveFilterRender", async() => {
  let saveFilter = await saveFilterGet();
  document.getElementById("saveFilter").innerHTML = ""
  for (var key in saveFilter) {
    adRowInTable(document.getElementById("saveFilter"), [key, createBtn(key, "saveFilterDel"), createBtn(key, "saveFilterLoad"), createBtn(key, "saveFilterCopy")]);
  }
});

function adRowInTable(table, tabCells) {
  let tr = table.insertRow(-1);
  for (let i = 0; i < tabCells.length; i++) {
    tabCell = tr.insertCell(-1);
    if(typeof tabCells[i]==='string'){
      tabCell.innerText = tabCells[i];
    } else 
    if(typeof tabCells[i]==='object'){
      tabCell.appendChild(tabCells[i]);
    };
  }
}
function createBtn(key, type){
  let a = document.createElement('a');
  a.setAttribute('id', key);
  switch (type) {
    case 'blackListDel':
      a.innerText = "✖";
      a.setAttribute('title', "delete this seller");
      a.onclick = () => { blackListDel(key); }
      break;
    case 'saveFilterDel':
      a.innerText = "✖";
      a.setAttribute('title', "delete this filter");
      a.onclick = () => { saveFilterDel(key); }
      break;
    case 'saveFilterLoad':
      a.innerText = "🡰";
      a.setAttribute('title', "load as current filter");
      a.onclick = () => { saveFilterLoad(key); }
      break;
    case 'saveFilterCopy':
      a.innerText = "❏";
      a.setAttribute('title', "copy to clipboard");
      a.onclick = () => { saveFilterCopy(key); }
      break;
    default:
  }
  return a;
}
document.dispatchEvent(new CustomEvent("autoStartRender"));
document.dispatchEvent(new CustomEvent("filterActionRender"));
document.dispatchEvent(new CustomEvent("excludeWordRender"));
document.dispatchEvent(new CustomEvent("blackListRender"));
document.dispatchEvent(new CustomEvent("saveFilterRender"));