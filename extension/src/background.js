// ponytail: relay from StandAlone → VTT tabs. Send to all localhost/127.0.0.1
// tabs — foundry-content.js checks for ChatMessage at receive time, so non-Foundry
// tabs silently ignore the message. No fragile URL regex needed.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action !== 'send-roll') return;

  // Foundry: all tabs — foundry-content.js self-filters by checking ChatMessage
  chrome.tabs.query({}, tabs => {
    tabs.forEach(t => {
      chrome.tabs.sendMessage(t.id, { action: 'send-roll', text: msg.foundry, ability: msg.ability }).catch(() => {});
    });
  });

  // Roll20
  chrome.tabs.query({ url: '*://app.roll20.net/*' }, tabs => {
    tabs.forEach(t => {
      chrome.tabs.sendMessage(t.id, { action: 'send-roll', text: msg.roll20, ability: msg.ability }).catch(() => {});
    });
  });
});
