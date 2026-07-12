// ponytail: Roll20 Oosh CSS — rulebook (dark/gold) vs abilities (light blue/black).

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action !== 'send-roll') return;

  var chat = document.getElementById('textchat-input');
  var txt = chat ? chat.querySelector('textarea') : null;
  var btn = chat ? chat.querySelector('button') : null;
  if (!txt || !btn) return;

  var esc = function(s) {
    return s.replace(/[\[\]()]/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; });
  };

  var t = msg.text;
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  t = t.replace(/\*\*(.+?)\*\*/g, '|$1|');
  t = t.replace(/__(.+?)__/g, '// $1 //');
  t = t.replace(/^---$/gm, '|---|');
  t = t.replace(/^\u2022 /gm, '&bull; ');

  // ponytail: ability mode = light blue bg, black text. Rulebook = dark/gold.
  var isAbility = !!msg.ability;

  var allLines = [];
  if (msg.ability) allLines.push({text: msg.ability, isHeader: true});
  t.split('\n').forEach(function(l) { allLines.push({text: l, isHeader: false}); });

  var s = '';
  var total = allLines.length;
  allLines.forEach(function(item, i) {
    var line = item.text;
    var isHeader = item.isHeader;
    var isEmpty = line.trim() === '';
    var isFirst = i === 0;
    var isLast = i === total - 1;

    var style = '';
    if (isEmpty) {
      // ponytail: black divider line between sections for abilities
      if (isAbility) {
        style = 'border-left:3px solid #005cbb;border-right:3px solid #005cbb;border-top:1px solid #000;background-color:#a3dbff;padding:1px 0;display:block;height:2px;';
      } else {
        style = 'border-left:3px solid #ffcd00;border-right:3px solid #ffcd00;padding:4px 0;display:block;';
      }
      s += '[ ](#\" style=\"' + style + ')';
      return;
    }

    if (isAbility) {
      style = 'color:#000;font-weight:' + (isHeader ? '700' : '400') + ';font-size:' + (isHeader ? '14px' : '13px') + ';background-color:#a3dbff;padding:2px 8px;display:block;text-decoration:none;';
      if (!isHeader) style += 'font-family:serif;line-height:1.6;';
      if (isFirst) style += 'border-top:3px solid #005cbb;border-left:3px solid #005cbb;border-right:3px solid #005cbb;border-radius:8px 8px 0 0;';
      else style += 'border-left:3px solid #005cbb;border-right:3px solid #005cbb;';
      if (isLast) style += 'border-bottom:4px solid #004a99;border-radius:0 0 8px 8px;';
    } else {
      style = 'color:' + (isHeader ? '#ffd700' : '#dee2e6') + ';font-weight:' + (isHeader ? '700' : '400') + ';font-size:' + (isHeader ? '14px' : '13px') + ';background-color:#121212;padding:2px 8px;display:block;text-decoration:none;';
      if (!isHeader) style += 'font-family:serif;line-height:1.6;';
      if (isFirst) style += 'border-top:3px solid #ffcd00;border-left:3px solid #ffcd00;border-right:3px solid #ffcd00;border-radius:8px 8px 0 0;';
      else style += 'border-left:3px solid #ffcd00;border-right:3px solid #ffcd00;';
      if (isLast) style += 'border-bottom:4px solid #b8960a;border-radius:0 0 8px 8px;';
    }

    if (line.startsWith('&bull; ')) line = '    ' + line;
    // ponytail: |bold| renders literally inside Oosh links — strip pipes, bump font size
    if (line.startsWith('|') && line.endsWith('|')) {
      line = line.slice(1, -1);
      style = style.replace('font-size:13px', 'font-size:14px');
    }
    s += '[' + esc(line) + '](#\" style=\"' + style + ')';
  });

  var oldText = txt.value;
  txt.value = s;
  btn.click();
  txt.value = oldText;
});
