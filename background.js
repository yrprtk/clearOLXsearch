chrome.tabs.onActivated.addListener((info) => {
  setTimeout(async () => {
    const tab = await chrome.tabs.get(info.tabId);
    tab.url.startsWith('https://www.olx.ua/')
      ? chrome.action.enable(tab.tabId)
      : chrome.action.disable(tab.tabId);
  }, 500);
});
// https://stackoverflow.com/questions/10396634/chrome-extension-run-for-a-specific-page
// https://stackoverflow.com/questions/67806779/im-getting-an-error-tabs-cannot-be-edited-right-now-user-may-be-dragging-a-ta
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    chrome.tabs.sendMessage(tabId, {
      message: 'TabUpdated',
    });
  }
});

// let olxAjaxSearchCount = 0;
// chrome.webRequest.onCompleted.addListener(
//   (details) => {
//     if (
//       details.url.includes('https://www.olx.ua/ajax/') &&
//       details.url.includes('/search')
//     ) {
//       olxAjaxSearchCount++;
//       if (!(olxAjaxSearchCount % 2)) {
//         chrome.tabs.sendMessage(details.tabId, {
//           message: 'TabUpdated',
//         });
//       }
//     }
//   },
//   {
//     urls: ['<all_urls>'],
//   }
// );
