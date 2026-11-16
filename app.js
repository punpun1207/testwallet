(function () {
  var KEY = 'so-chi-tieu.v2', OLD = 'so-chi-tieu.v1';
  var TYPES = [['chi', 'Chi tiêu'], ['chuyen', 'Chuyển tiền'], ['nhan', 'Nhận tiền']];
  var CATS = {
    chi: ['Ăn uống', 'Đi lại', 'Học tập', 'Giải trí', 'Mua sắm', 'Khác'],
    chuyen: ['Trả nợ', 'Chia tiền', 'Gia đình', 'Nhà trọ', 'Quà tặng', 'Khác'],
    nhan: ['Lương', 'Gia đình', 'Bạn trả', 'Bán đồ', 'Thưởng', 'Khác']
  };
  var SUG = {
    'chi|Ăn uống': ['Ăn sáng', 'Ăn trưa', 'Ăn tối', 'Cà phê', 'Trà sữa', 'Đồ ăn vặt'],
    'chi|Đi lại': ['Xăng xe', 'Grab', 'Xe buýt', 'Gửi xe', 'Vé tàu xe'],
    'chi|Học tập': ['Học phí', 'Sách vở', 'Khóa học online', 'In tài liệu'],
    'chi|Giải trí': ['Xem phim', 'Chơi game', 'Nạp game', 'Đi chơi với bạn'],
    'chi|Mua sắm': ['Quần áo', 'Đồ dùng cá nhân', 'Mua online', 'Phụ kiện điện thoại'],
    'chi|Khác': ['Nạp tiền điện thoại', 'Tiền mạng', 'Sửa điện thoại', 'Phát sinh'],
    'chuyen|Trả nợ': ['Trả nợ bạn', 'Trả tiền mượn', 'Trả góp'],
    'chuyen|Chia tiền': ['Chia tiền ăn', 'Chia tiền đi chơi', 'Chia tiền taxi', 'Góp tiền mua quà'],
    'chuyen|Gia đình': ['Gửi ba mẹ', 'Gửi anh chị em', 'Tiền sinh hoạt'],
    'chuyen|Nhà trọ': ['Tiền nhà tháng này', 'Tiền điện', 'Tiền nước', 'Tiền wifi'],
    'chuyen|Quà tặng': ['Mừng sinh nhật', 'Mừng cưới', 'Lì xì', 'Quà tặng bạn'],
    'chuyen|Khác': ['Đặt cọc', 'Mua hộ bạn', 'Chuyển nhầm, cần đòi lại'],
    'nhan|Lương': ['Lương tháng', 'Tiền làm thêm', 'Tiền công freelance'],
    'nhan|Gia đình': ['Ba mẹ gửi', 'Tiền tiêu vặt', 'Gia đình gửi tiền học'],
    'nhan|Bạn trả': ['Bạn trả nợ', 'Bạn chia tiền ăn', 'Bạn trả tiền mua hộ'],
    'nhan|Bán đồ': ['Bán đồ cũ', 'Bán hàng online', 'Bán đồ sưu tầm'],
    'nhan|Thưởng': ['Tiền thưởng', 'Lì xì', 'Tiền mừng', 'Hoàn tiền'],
    'nhan|Khác': ['Hoàn tiền đơn hàng', 'Được trả lại tiền cọc', 'Nhận nhầm, cần trả lại']
  };
  var WHO_PH = { chuyen: 'Chuyển cho ai? (không bắt buộc)', nhan: 'Nhận từ ai? (không bắt buộc)' };
  var QUICK = [['20k', 20000], ['50k', 50000], ['100k', 100000], ['200k', 200000], ['500k', 500000], ['1tr', 1000000]];
  var state = { items: [], budget: 0 };
  var type = 'chi', cat = CATS.chi[0], flt = 'all', pending = null, view = new Date();
  view.setDate(1);

  var $ = function (i) { return document.getElementById(i); };
  var fmt = function (n) { return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' đ'; };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var ymd = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fold(s) { return String(s).toLowerCase(); }

  function load() {
    try {
      var r = localStorage.getItem(KEY);
      if (r) {
        var s = JSON.parse(r);
        if (s && Array.isArray(s.items)) { state.items = s.items; state.budget = +s.budget || 0; return; }
      }
      var o = localStorage.getItem(OLD);
      if (o) {
        var t = JSON.parse(o);
        if (t && Array.isArray(t.items)) {
          state.items = t.items.map(function (i) {
            return { id: i.id, type: 'chi', amount: i.amount, cat: i.cat, note: i.note || '', who: '', date: i.date };
          });
          state.budget = +t.budget || 0;
          save();
        }
      }
    } catch (e) {}
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function parse(s) {
    s = String(s).toLowerCase().replace(/\s/g, '').replace(/đ|d$/, '');
    var m = s.match(/^(\d+)(?:tr|m)(\d{1,3})?$/);
    if (m) {
      var f = m[2] ? parseFloat('0.' + m[2]) : 0;
      return Math.round((+m[1] + f) * 1e6);
    }
    m = s.match(/^(\d+(?:[.,]\d+)?)k$/);
    if (m) return Math.round(parseFloat(m[1].replace(',', '.')) * 1000);
    var n = parseInt(s.replace(/[.,]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }

  function dayLabel(d) {
    var y = new Date(); y.setDate(y.getDate() - 1);
    if (d === ymd(new Date())) return 'Hôm nay';
    if (d === ymd(y)) return 'Hôm qua';
    var p = d.split('-');
    return p[2] + '/' + p[1];
  }

  function title(i) {
    return i.note || (i.type === 'chi' ? i.cat : i.type === 'chuyen' ? 'Chuyển tiền' : 'Nhận tiền');
  }

  function subline(i) {
    if (i.type === 'chi') return i.cat;
    var w = i.who ? (i.type === 'chuyen' ? ' cho ' : ' từ ') + i.who : '';
    return (i.type === 'chuyen' ? 'Chuyển' : 'Nhận') + w + ' · ' + i.cat;
  }

  function suggestions(q) {
    var cnt = {}, last = {};
    state.items.forEach(function (i) {
      if (i.type === type && i.cat === cat && i.note) {
        cnt[i.note] = (cnt[i.note] || 0) + 1;
        last[i.note] = i.id;
      }
    });
    var mine = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a] || last[b] - last[a]; }).slice(0, 4);
    var out = mine.map(function (t) { return { t: t, h: 1 }; });
    (SUG[type + '|' + cat] || []).forEach(function (t) {
      if (mine.indexOf(t) < 0) out.push({ t: t, h: 0 });
    });
    q = fold(q.trim());
    if (q) out = out.filter(function (o) { return fold(o.t).indexOf(q) >= 0 && fold(o.t) !== q; });
    return out.slice(0, 8);
  }

  function recentWho() {
    var seen = {}, out = [];
    state.items.slice().sort(function (a, b) { return b.id - a.id; }).forEach(function (i) {
      if (i.type === type && i.who && !seen[i.who]) { seen[i.who] = 1; out.push(i.who); }
    });
    return out.slice(0, 5);
  }

  function renderForm() {
    $('tabs').innerHTML = TYPES.map(function (t) {
      return '<button type="button" class="tab" data-t="' + t[0] + '" aria-pressed="' + (t[0] === type) + '">' + t[1] + '</button>';
    }).join('');
    $('amts').innerHTML = QUICK.map(function (q) {
      return '<button type="button" class="chip s" data-a="' + q[1] + '">' + q[0] + '</button>';
    }).join('');
    $('cats').innerHTML = CATS[type].map(function (c) {
      return '<button type="button" class="chip" data-c="' + c + '" aria-pressed="' + (c === cat) + '">' + c + '</button>';
    }).join('');
    $('whoBox').style.display = type === 'chi' ? 'none' : 'block';
    if (type !== 'chi') {
      $('who').placeholder = WHO_PH[type];
      $('whos').innerHTML = recentWho().map(function (w) {
        return '<button type="button" class="chip s" data-w="' + esc(w) + '">' + esc(w) + '</button>';
      }).join('');
    }
    renderSugs();
  }

  function renderSugs() {
    $('sugs').innerHTML = suggestions($('note').value).map(function (o) {
      return '<button type="button" class="chip ' + (o.h ? 'h' : 's') + '" data-n="' + esc(o.t) + '">' + esc(o.t) + '</button>';
    }).join('');
  }

  function render() {
    var key = view.getFullYear() + '-' + pad(view.getMonth() + 1);
    $('month').textContent = 'Tháng ' + (view.getMonth() + 1) + '/' + view.getFullYear();
    var items = state.items.filter(function (i) { return i.date.indexOf(key) === 0; });
    var sum = { chi: 0, chuyen: 0, nhan: 0 };
    items.forEach(function (i) { sum[i.type] = (sum[i.type] || 0) + i.amount; });

    var spent = sum.chi + sum.chuyen, net = sum.nhan - spent;
    $('total').textContent = fmt(spent);
    $('sIn').textContent = fmt(sum.nhan);
    $('sChi').textContent = fmt(sum.chi);
    $('sChuyen').textContent = fmt(sum.chuyen);

    var b = state.budget, fill = $('fill'), sub = $('sub');
    var netTxt = 'Chênh lệch tháng: <b>' + (net >= 0 ? '+' : '−') + fmt(Math.abs(net)) + '</b>';
    if (b > 0) {
      var pct = Math.min(100, spent / b * 100), left = b - spent;
      fill.style.width = pct + '%';
      fill.className = (spent / b >= 0.9) ? 'warn' : '';
      $('pb').setAttribute('aria-valuenow', Math.round(pct));
      sub.innerHTML = (left >= 0 ? 'Còn lại <b>' + fmt(left) + '</b> trong ngân sách' : '<span class="over">Vượt ngân sách <b>' + fmt(-left) + '</b></span>') + '<br>' + netTxt;
    } else {
      fill.style.width = '0';
      fill.className = '';
      sub.innerHTML = 'Đã chi gồm chi tiêu và chuyển tiền đi.<br>' + netTxt;
    }
    if (document.activeElement !== $('budget')) $('budget').value = b ? String(b) : '';

    var sums = {};
    items.forEach(function (i) { if (i.type === 'chi') sums[i.cat] = (sums[i.cat] || 0) + i.amount; });
    var names = Object.keys(sums).sort(function (a, c) { return sums[c] - sums[a]; });
    var max = names.length ? sums[names[0]] : 1;
    $('catSum').innerHTML = names.length ? names.map(function (n) {
      return '<div class="cat"><span>' + esc(n) + '</span><div class="bar"><i style="width:' + (sums[n] / max * 100) + '%"></i></div><span>' + fmt(sums[n]) + '</span></div>';
    }).join('') : '<p class="empty">Chưa có khoản chi tiêu nào trong tháng này.</p>';

    var F = [['all', 'Tất cả'], ['chi', 'Chi tiêu'], ['chuyen', 'Chuyển'], ['nhan', 'Nhận']];
    $('flt').innerHTML = F.map(function (f) {
      return '<button type="button" class="chip" data-f="' + f[0] + '" aria-pressed="' + (f[0] === flt) + '">' + f[1] + '</button>';
    }).join('');

    var list = items.filter(function (i) { return flt === 'all' || i.type === flt; });
    list.sort(function (a, c) { return a.date < c.date ? 1 : a.date > c.date ? -1 : c.id - a.id; });
    var html = '', last = '';
    list.forEach(function (i) {
      if (i.date !== last) { last = i.date; html += '<div class="day">' + dayLabel(i.date) + '</div>'; }
      var inc = i.type === 'nhan';
      html += '<div class="item"><div class="t"><b>' + esc(title(i)) + '</b><small>' + esc(subline(i)) + '</small></div>'
        + '<span class="a' + (inc ? ' in' : '') + '">' + (inc ? '+' : '−') + fmt(i.amount) + '</span>'
        + '<button type="button" class="del' + (pending === i.id ? ' sure' : '') + '" data-id="' + i.id + '" aria-label="Xóa giao dịch">' + (pending === i.id ? 'Xóa?' : '✕') + '</button></div>';
    });
    $('list').innerHTML = html || '<p class="empty">Chưa có giao dịch nào. Nhập số tiền ở trên để thêm.</p>';
  }

  $('tabs').addEventListener('click', function (e) {
    var t = e.target.getAttribute('data-t');
    if (t && t !== type) { type = t; cat = CATS[type][0]; $('note').value = ''; $('who').value = ''; renderForm(); }
  });
  $('cats').addEventListener('click', function (e) {
    var c = e.target.getAttribute('data-c');
    if (c) { cat = c; renderForm(); }
  });
  $('amts').addEventListener('click', function (e) {
    var a = e.target.getAttribute('data-a');
    if (a) $('amt').value = a;
  });
  $('whos').addEventListener('click', function (e) {
    var w = e.target.getAttribute('data-w');
    if (w) $('who').value = w;
  });
  $('sugs').addEventListener('click', function (e) {
    var n = e.target.getAttribute('data-n');
    if (n) { $('note').value = n; renderSugs(); }
  });
  $('note').addEventListener('input', renderSugs);
  $('flt').addEventListener('click', function (e) {
    var f = e.target.getAttribute('data-f');
    if (f) { flt = f; render(); }
  });

  $('add').addEventListener('click', function () {
    var n = parse($('amt').value), m = $('msg');
    m.className = 'msg';
    if (n <= 0) { m.textContent = 'Nhập số tiền lớn hơn 0, ví dụ 35k hoặc 50000.'; $('amt').focus(); return; }
    var d = $('date').value || ymd(new Date());
    state.items.push({
      id: Date.now(), type: type, amount: n, cat: cat,
      note: $('note').value.trim(), who: type === 'chi' ? '' : $('who').value.trim(), date: d
    });
    save();
    var p = d.split('-');
    view = new Date(+p[0], +p[1] - 1, 1);
    $('amt').value = ''; $('note').value = ''; $('who').value = '';
    m.className = 'msg ok'; m.textContent = 'Đã thêm giao dịch.';
    renderForm(); render();
  });

  $('amt').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('add').click(); });

  $('list').addEventListener('click', function (e) {
    var id = e.target.getAttribute('data-id');
    if (!id) return;
    id = +id;
    if (pending === id) {
      state.items = state.items.filter(function (i) { return i.id !== id; });
      pending = null; save(); renderForm();
    } else pending = id;
    render();
  });

  $('budget').addEventListener('change', function () { state.budget = parse(this.value); save(); render(); });
  $('prev').addEventListener('click', function () { view.setMonth(view.getMonth() - 1); pending = null; render(); });
  $('next').addEventListener('click', function () { view.setMonth(view.getMonth() + 1); pending = null; render(); });

  $('bkShow').addEventListener('click', function () {
    var t = $('bk');
    t.value = JSON.stringify(state);
    t.focus(); t.select();
    $('bkMsg').className = 'msg ok';
    $('bkMsg').textContent = 'Chọn hết rồi sao chép đoạn mã này để cất đi.';
  });

  $('bkLoad').addEventListener('click', function () {
    var m = $('bkMsg'); m.className = 'msg';
    try {
      var s = JSON.parse($('bk').value), have = {};
      if (!s || !Array.isArray(s.items)) throw 0;
      state.items.forEach(function (i) { have[i.id] = 1; });
      var add = s.items.filter(function (i) { return i && i.id && i.date && +i.amount > 0 && !have[i.id]; }).map(function (i) {
        return { id: i.id, type: CATS[i.type] ? i.type : 'chi', amount: +i.amount, cat: String(i.cat || 'Khác'), note: String(i.note || ''), who: String(i.who || ''), date: String(i.date) };
      });
      state.items = state.items.concat(add);
      if (!state.budget && +s.budget > 0) state.budget = +s.budget;
      save(); renderForm(); render();
      m.className = 'msg ok'; m.textContent = 'Đã khôi phục ' + add.length + ' giao dịch.';
    } catch (e) {
      m.textContent = 'Nội dung không hợp lệ. Hãy dán đúng đoạn mã đã sao lưu.';
    }
  });

  $('date').value = ymd(new Date());
  load(); renderForm(); render();

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  }
})();