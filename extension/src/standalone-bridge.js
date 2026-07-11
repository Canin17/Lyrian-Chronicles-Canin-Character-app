// ponytail: listens for window.postMessage from StandAlone combat page, forwards to background SW.
// StandAlone calls: window.postMessage({ source: 'lyrian-dice', ... }, '*')

window.addEventListener('message', (e) => {
  if (e.data?.source !== 'lyrian-dice') return;
  chrome.runtime.sendMessage(e.data);
});
