// ponytail: Foundry VTT chat injector. Content scripts run in an isolated
// world and can't see page globals (ChatMessage, game). Inject a <script>
// tag into the page context — works on Chrome AND Firefox/Floorp.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action !== 'send-roll') return;
  const code = `
    if (typeof ChatMessage !== 'undefined') {
      ChatMessage.create({
        content: ${JSON.stringify(msg.text)},
        speaker: ChatMessage.getSpeaker()
      }, { rollMode: game.settings.get('core', 'rollMode') || 'selfroll' });
    }
  `;
  const s = document.createElement('script');
  s.textContent = code;
  document.documentElement.appendChild(s);
  s.remove();
});
