// ponytail: Roll20 chat injector — types into chat textarea and clicks send.

function postChatMessage(text) {
  const chat = document.getElementById('textchat-input');
  const txt = chat?.querySelector('textarea');
  const btn = chat?.querySelector('button');
  if (!txt || !btn) return false;
  const old = txt.value;
  txt.value = text;
  txt.dispatchEvent(new Event('input', { bubbles: true }));
  btn.click();
  txt.value = old;
  txt.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action !== 'send-roll') return;
  postChatMessage(msg.text);
});
