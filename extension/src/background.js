// ponytail: relay from StandAlone → VTT tabs
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action !== 'send-roll') return;

  // Foundry: all tabs — foundry-content.js self-filters by checking ChatMessage
  chrome.tabs.query({}, tabs => {
    tabs.forEach(t => {
      chrome.tabs.sendMessage(t.id, { action: 'send-roll', text: msg.foundry, ability: msg.ability, keywords: msg.keywords }).catch(() => {});
    });
  });

  // Roll20: content script handles delivery
  chrome.tabs.query({ url: '*://app.roll20.net/*' }, tabs => {
    tabs.forEach(t => {
      chrome.tabs.sendMessage(t.id, { action: 'send-roll', text: msg.roll20, ability: msg.ability, keywords: msg.keywords }).catch(() => {});
    });
  });
});
