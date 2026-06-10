var isAnon = true;
var detectedType = null;
var detectedId = null;
var lastSent = null;
var sentHistory = JSON.parse(localStorage.getItem('vokafess_history')) || [];
var dummyData = [];
var currentData = [];

// Load pesan dari database via API
function loadMessages() {
  fetch('/api/messages?action=get_messages')
    .then(function(res) { return res.json(); })
    .then(function(result) {
      if (result.status === 'success') {
        dummyData = result.data;
        currentData = dummyData.slice();
        renderCards(currentData);
      }
    })
    .catch(function() {
      // Fallback data contoh jika API belum terhubung
      dummyData = [
        {to:"Salsa",song:"Take Care",artist:"NIKI",msg:"Kalo lu liat ini, gua udah move on woii, seneng banget dah.",from:null,type:'sp',mediaId:'3hSaLHgkjOfFRBuEoHvZqx',sentAt:null},
        {to:"Rara",song:"Satu Bulan",artist:"Float",msg:"Sebulan ini berat banget rasanya, tapi lagu ini selalu ngingetin gua sama lo.",from:"seseorang yang kangen",type:'sp',mediaId:'5ZMBFpLJSoiLx1IRQBMQP0',sentAt:null},
        {to:"Dinda",song:"Ilusi",artist:"Tulus",msg:"Lo tau ga sih, tiap gua denger lagu ini langsung kepikiran lo.",from:null,type:'manual',mediaId:null,sentAt:null},
        {to:"Naya",song:"Rehat",artist:"Kunto Aji",msg:"Lo perlu istirahat. Dari semua kekhawatiran itu.",from:"dari yang selalu di sini",type:'manual',mediaId:null,sentAt:null},
        {to:"Abel",song:"Ruang Sendiri",artist:"Kunto Aji",msg:"Semoga lo nemu ketenangan itu. Gua selalu support lo dari jauh.",from:null,type:'yt',mediaId:'dQw4w9WgXcQ',sentAt:null}
      ];
      currentData = dummyData.slice();
      renderCards(currentData);
    });
}

function showPage(id) {
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) pages[i].classList.remove('active');
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function setAnon(v, btn) {
  isAnon = v;
  var btns = document.querySelectorAll('.tbtn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove('on');
  btn.classList.add('on');
  var sw = document.getElementById('f-swrap');
  if (v) sw.classList.remove('show'); else sw.classList.add('show');
}

function getYtId(url) {
  var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
  var match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function getSpId(url) {
  var regExp = /spotify\.com(?:\/[a-zA-Z-]+)?\/track\/([a-zA-Z0-9]+)/;
  var match = url.match(regExp);
  return (match && match[1]) ? match[1] : null;
}

function prevLink(v) {
  var box = document.getElementById('link-prev-box');
  var txt = v.trim();

  if (!txt) {
    detectedType = null; detectedId = null;
    box.className = 'link-preview';
    return;
  }

  var ytId = getYtId(txt), spId = getSpId(txt);

  if (ytId) {
    detectedType = 'yt'; detectedId = ytId;
    box.className = 'link-preview show yt';
    document.getElementById('link-prev-icon').innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#c80000"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>';
    document.getElementById('link-prev-title').textContent = 'Mengambil data YouTube...';
    document.getElementById('link-prev-sub').textContent = 'Mohon tunggu sebentar...';

    fetch('/api/messages?action=get_meta&type=yt&id=' + ytId)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (detectedId === ytId) {
          var cleanTitle = data.title.replace(/(\(|\[)(Official|Lirik|Video|Audio|Music).*(\)|\])/gi, '').trim();
          document.getElementById('link-prev-title').textContent = cleanTitle;
          document.getElementById('link-prev-sub').textContent = 'Oleh: ' + data.author_name;
          document.getElementById('f-manual').value = cleanTitle + ' — ' + data.author_name;
        }
      })
      .catch(function() {
        if (detectedId === ytId) {
          document.getElementById('link-prev-title').textContent = 'YouTube Terdeteksi';
          document.getElementById('link-prev-sub').textContent = 'Gagal memuat detail otomatis.';
        }
      });

  } else if (spId) {
    detectedType = 'sp'; detectedId = spId;
    box.className = 'link-preview show sp';
    document.getElementById('link-prev-icon').innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#1db954"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 11-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.623.623 0 01.207.857zm1.223-2.722a.78.78 0 01-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 01-.973-.519.781.781 0 01.52-.972c3.632-1.102 8.147-.568 11.233 1.328a.78.78 0 01.257 1.072zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.937.937 0 11-.543-1.794c3.527-1.07 9.393-.863 13.098 1.382a.937.937 0 01-.938 1.569z"/></svg>';
    document.getElementById('link-prev-title').textContent = 'Mengambil data Spotify...';
    document.getElementById('link-prev-sub').textContent = 'Mohon tunggu sebentar...';

    fetch('/api/messages?action=get_meta&type=sp&id=' + spId)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (detectedId === spId) {
          var titleSong  = data.title || 'Unknown Track';
          var artistSong = data.author_name || 'Unknown Artist';
          document.getElementById('link-prev-title').textContent = titleSong;
          document.getElementById('link-prev-sub').textContent = 'Oleh: ' + artistSong;
          document.getElementById('f-manual').value = titleSong + ' — ' + artistSong;
        }
      })
      .catch(function() {
        if (detectedId === spId) {
          document.getElementById('link-prev-title').textContent = 'Spotify Terdeteksi';
          document.getElementById('link-prev-sub').textContent = 'Gagal memuat detail otomatis.';
        }
      });

  } else {
    detectedType = 'manual'; detectedId = null;
    box.className = 'link-preview show';
    box.style.borderLeft = '4px solid #cc3333';
    document.getElementById('link-prev-icon').innerHTML = '<span style="font-size:20px;">❓</span>';
    document.getElementById('link-prev-title').textContent = 'Link tidak dikenali';
    document.getElementById('link-prev-sub').textContent = 'Lagu dikirim sebagai "Manual". Silakan ketik nama lagunya di bawah.';
  }
}

function renderSong(d, container) {
  if (d.type === 'yt' && d.mediaId) {
    container.innerHTML = '<div class="embed-wrap-yt">' +
      '<iframe src="https://www.youtube.com/embed/' + d.mediaId + '?rel=0&modestbranding=1" ' +
      'allow="autoplay; encrypted-media" allowfullscreen></iframe>' +
      '</div>';
  } else if (d.type === 'sp' && d.mediaId) {
    container.innerHTML = '<div class="embed-wrap-sp">' +
      '<iframe src="https://open.spotify.com/embed/track/' + d.mediaId + '?utm_source=generator&theme=0" ' +
      'allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>' +
      '</div>' +
      '<p style="font-size:11px;color:var(--navy-mid);text-align:center;margin:-10px 0 20px;font-style:italic;">' +
      '💡 Login ke Spotify di browser ini untuk mendengarkan lagu secara penuh.</p>';
  } else {
    var p = (d.song || '').split(/[—\-–]/);
    var t = (p[0] || '').trim() || d.song || '—';
    var a = (p[1] || '').trim() || d.artist || '';
    container.innerHTML = '<div class="song-card">' +
      '<div class="sc-label">Lagu untukmu</div>' +
      '<div class="sc-title">' + t + '</div>' +
      '<div class="sc-artist">' + a + '</div>' +
      '<div class="sc-bar-wrap"><div class="sc-bar"></div></div>' +
      '<div class="sc-times"><span>0:00</span><span>—</span></div>' +
      '</div>';
  }
}

function renderCards(data) {
  var grid = document.getElementById('cards-grid');
  var none = document.getElementById('no-result');
  if (!data.length) { grid.innerHTML = ''; none.style.display = 'block'; return; }
  none.style.display = 'none';
  var html = '';
  for (var i = 0; i < data.length; i++) {
    var d = data[i];
    var badge = '';
    if (d.type === 'yt') badge = '<span class="badge badge-yt">YouTube</span>';
    else if (d.type === 'sp') badge = '<span class="badge badge-sp">Spotify</span>';
    var footer = d.from ? 'dari ' + d.from : '<span class="badge badge-anon">anonim</span>';
    html += '<div class="msg-card" onclick="openMsg(' + i + ')">';
    html += '<div class="mc-to">untuk</div>';
    html += '<div class="mc-name">' + d.to + '</div>';
    html += '<div class="mc-song"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff85bb" stroke-width="2.5" stroke-linecap="round"><path d="M9 19V6l12-3v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="15" r="3"/></svg>';
    html += '<div><div class="mc-song-title">' + d.song + ' ' + badge + '</div><div class="mc-song-artist">' + d.artist + '</div></div></div>';
    html += '<div class="mc-msg">"' + d.msg + '"</div>';
    html += '<div class="mc-footer">' + footer + '</div>';
    html += '</div>';
  }
  grid.innerHTML = html;
}

function doSearch(q) {
  var v = q.trim().toLowerCase();
  currentData = v ? dummyData.filter(function(d) { return d.to.toLowerCase().indexOf(v) >= 0; }) : dummyData.slice();
  renderCards(currentData);
}

function formatTimestamp(dateObj) {
  if (!dateObj) return '';
  var tgl = dateObj.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Jakarta'});
  var jam = dateObj.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit', timeZone:'Asia/Jakarta'});
  return 'Dikirim pada ' + tgl + ' pukul ' + jam + ' WIB';
}

function openMsg(idx) {
  var d = currentData[idx];
  document.getElementById('r-to').textContent = d.to;
  document.getElementById('r-msg').textContent = d.msg;
  document.getElementById('r-from').textContent = d.from ? '— dari ' + d.from : '— dari seseorang';
  document.getElementById('r-timestamp').textContent = d.sentAt ? formatTimestamp(new Date(d.sentAt)) : formatTimestamp(new Date());
  renderSong(d, document.getElementById('r-song'));
  showPage('pg-receive');
}

function submitForm() {
  var to = document.getElementById('f-to').value.trim();
  var msg = document.getElementById('f-msg').value.trim();
  if (!to) { document.getElementById('f-to').focus(); return; }
  if (!msg) { document.getElementById('f-msg').focus(); return; }

  var manual = document.getElementById('f-manual').value.trim();
  var senderVal = document.getElementById('f-sender').value.trim();
  var sender = isAnon ? null : (senderVal || 'seseorang');

  var parts = manual.split(/[—\-–]/);
  var song   = (parts[0] || '').trim() || manual || '—';
  var artist = (parts[1] || '').trim() || '';

  fetch('/api/messages?action=submit_fess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: to, msg: msg, song: song, artist: artist,
      type: detectedType || 'manual',
      mediaId: detectedId || '',
      sender: sender
    })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.status === 'success') {
      var now = new Date();
      var fd = { to: to, msg: msg, song: song, artist: artist,
        type: detectedType || 'manual', mediaId: detectedId,
        from: sender, sentAt: now.toISOString() };

      dummyData.unshift(fd);
      currentData = dummyData.slice();
      sentHistory.unshift(fd);
      localStorage.setItem('vokafess_history', JSON.stringify(sentHistory));
      lastSent = fd;

      var link = window.location.origin + '/?id=' + data.id;
      document.getElementById('s-to').textContent = to;
      document.getElementById('s-link').textContent = link;

      document.getElementById('f-to').value = '';
      document.getElementById('f-msg').value = '';
      document.getElementById('f-manual').value = '';
      document.getElementById('f-sender').value = '';
      document.getElementById('f-link').value = '';
      document.getElementById('link-prev-box').className = 'link-preview';
      detectedType = null; detectedId = null;

      showPage('pg-success');
      renderCards(dummyData);
    } else {
      alert('Gagal menyimpan pesan: ' + data.message);
    }
  })
  .catch(function(err) {
    console.error(err);
    alert('Terjadi kesalahan jaringan. Pastikan koneksi kamu aktif.');
  });
}

function copyLink() {
  var txt = document.getElementById('s-link').textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(txt).then(function() {
      var btn = document.querySelector('.copy-btn');
      btn.textContent = 'Tersalin!';
      setTimeout(function() { btn.textContent = 'Salin link'; }, 2000);
    });
  }
}

function previewReceive() {
  if (lastSent) {
    currentData = dummyData.slice();
    openMsg(0);
  }
}

function goHistory() {
  showPage('pg-history');
  renderHistory();
}

function renderHistory() {
  var countEl = document.getElementById('hist-count');
  var wrap = document.getElementById('hist-list');
  countEl.textContent = sentHistory.length + ' pesan terkirim';
  if (!sentHistory.length) {
    wrap.innerHTML = '<div class="hist-empty"><div class="hist-empty-icon">♪</div><div>Belum ada riwayat pengiriman.</div><div style="font-size:12px;margin-top:4px;color:#ccc;">Kirim lagu pertamamu sekarang!</div></div>';
    return;
  }
  var html = '';
  for (var i = 0; i < sentHistory.length; i++) {
    var d = sentHistory[i];
    var dt = d.sentAt ? new Date(d.sentAt) : null;
    var tgl = dt ? dt.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Jakarta'}) + ' pukul ' + dt.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jakarta'}) + ' WIB' : '—';
    var badgeText = d.from ? 'dari ' + d.from : 'anonim';
    var songLine = d.song + (d.artist ? ' — ' + d.artist : '');
    html += '<div class="hist-card" onclick="openHistoryMsg(' + i + ')" style="cursor:pointer;position:relative;">';
    html += '<div class="hist-head"><div><div class="hist-to-lbl">untuk</div><div class="hist-name">' + d.to + '</div></div>';
    html += '<div class="hist-badge">' + badgeText + '</div></div>';
    html += '<div class="hist-song"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff85bb" stroke-width="2.5" stroke-linecap="round"><path d="M9 19V6l12-3v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="15" r="3"/></svg>' + songLine + '</div>';
    html += '<div class="hist-msg">"' + d.msg + '"</div>';
    html += '<div class="hist-time">' + tgl + '</div>';
    html += '<button onclick="deleteHistorySingle(' + i + ',event)" style="position:absolute;bottom:12px;right:15px;background:none;border:none;color:#ff85bb;cursor:pointer;font-size:14px;padding:5px;" title="Hapus">🗑️</button>';
    html += '</div>';
  }
  wrap.innerHTML = html;
}

function openHistoryMsg(idx) {
  var d = sentHistory[idx];
  document.getElementById('r-to').textContent = d.to;
  document.getElementById('r-msg').textContent = d.msg;
  document.getElementById('r-from').textContent = d.from ? '— dari ' + d.from : '— dari seseorang';
  document.getElementById('r-timestamp').textContent = d.sentAt ? formatTimestamp(new Date(d.sentAt)) : formatTimestamp(new Date());
  renderSong(d, document.getElementById('r-song'));
  showPage('pg-receive');
}

function deleteHistorySingle(idx, event) {
  if (event) event.stopPropagation();
  if (!confirm('Hapus pesan ini dari riwayat?')) return;
  sentHistory.splice(idx, 1);
  localStorage.setItem('vokafess_history', JSON.stringify(sentHistory));
  renderHistory();
}

function clearHistory() {
  if (!confirm('Hapus semua riwayat pengiriman?')) return;
  sentHistory = [];
  localStorage.removeItem('vokafess_history');
  renderHistory();
}

// Auto-buka pesan jika URL ada ?id=
window.addEventListener('DOMContentLoaded', function() {
  loadMessages();
  var urlParams = new URLSearchParams(window.location.search);
  var msgId = urlParams.get('id');
  if (msgId) {
    fetch('/api/messages?action=get_messages')
      .then(function(res) { return res.json(); })
      .then(function(result) {
        if (result.status === 'success') {
          var found = result.data.find(function(d) { return String(d.id) === String(msgId); });
          if (found) {
            currentData = result.data;
            var idx = currentData.indexOf(found);
            openMsg(idx);
          }
        }
      });
  }
});
