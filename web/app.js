(function () {
  'use strict';

  var editorEl = document.getElementById('editor');
  var preview = document.getElementById('preview');
  var exampleSelect = document.getElementById('example-select');
  var fpsInput = document.getElementById('fps-input');
  var widthInput = document.getElementById('width-input');
  var heightInput = document.getElementById('height-input');
  var runBtn = document.getElementById('run-btn');
  var stopBtn = document.getElementById('stop-btn');
  var shareBtn = document.getElementById('share-btn');
  var layoutBtn = document.getElementById('layout-btn');
  var fullscreenBtn = document.getElementById('fullscreen-btn');
  var helpBtn = document.getElementById('help-btn');
  var helpDialog = document.getElementById('help-dialog');
  var helpCloseBtn = document.getElementById('help-close-btn');
  var previewPanel = document.getElementById('preview-panel');
  var panelsEl = document.getElementById('panels');
  var statusEl = document.getElementById('status');
  var logEl = document.getElementById('log-line');

  var cm = CodeMirror.fromTextArea(editorEl, {
    mode: 'javascript',
    theme: 'dracula',
    lineNumbers: true,
    tabSize: 2,
    indentUnit: 2,
    extraKeys: {
      'Ctrl-Enter': runShader,
      'Cmd-Enter': runShader
    }
  });

  // --- examples dropdown ---

  window.TEXTMODE_EXAMPLES.forEach(function (ex) {
    var opt = document.createElement('option');
    opt.value = ex.name;
    opt.textContent = ex.label;
    exampleSelect.appendChild(opt);
  });

  function findExample(name) {
    return window.TEXTMODE_EXAMPLES.filter(function (ex) { return ex.name === name; })[0];
  }

  exampleSelect.addEventListener('change', function () {
    var ex = findExample(exampleSelect.value);
    if (ex) {
      cm.setValue(ex.code);
      runShader();
    }
  });

  // --- share link (state lives in the URL fragment, no backend) ---

  function encodeState(obj) {
    var json = JSON.stringify(obj);
    var bytes = new TextEncoder().encode(json);
    var binary = '';
    var i;
    for (i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodeState(str) {
    var b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) {
      b64 += '=';
    }
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    var i;
    for (i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function currentOptions() {
    return {
      fps: clamp(parseInt(fpsInput.value, 10) || 30, 1, 120),
      cols: clamp(parseInt(widthInput.value, 10) || 80, 1, 300),
      rows: clamp(parseInt(heightInput.value, 10) || 25, 1, 150)
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function buildShareUrl() {
    var options = currentOptions();
    var state = { code: cm.getValue(), fps: options.fps, cols: options.cols, rows: options.rows };
    var url = new URL(window.location.href);
    url.hash = 's=' + encodeState(state);
    return url.toString();
  }

  shareBtn.addEventListener('click', function () {
    var url = window.location.href;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        flashStatus('Link copied to clipboard');
      }, function () {
        flashStatus('Could not copy - link updated in address bar');
      });
    } else {
      flashStatus('Link updated in address bar');
    }
  });

  // --- layout toggle (side-by-side vs stacked), remembered across visits ---

  var LAYOUT_KEY = 'textmode:layout';

  function applyLayout(layout) {
    panelsEl.classList.remove('layout-row', 'layout-column');
    if (layout === 'row' || layout === 'column') {
      panelsEl.classList.add('layout-' + layout);
    }
    // Label names the action a click performs, not the current state.
    layoutBtn.textContent = currentLayout() === 'column' ? 'Side by side' : 'Stacked';
  }

  function currentLayout() {
    return panelsEl.classList.contains('layout-column') ? 'column' : 'row';
  }

  layoutBtn.addEventListener('click', function () {
    var next = currentLayout() === 'row' ? 'column' : 'row';
    applyLayout(next);
    try {
      localStorage.setItem(LAYOUT_KEY, next);
    } catch (e) {
      // localStorage unavailable (private browsing, etc) - toggle still
      // works for this page load, it just won't persist.
    }
  });

  (function initLayout() {
    var saved = null;
    try {
      saved = localStorage.getItem(LAYOUT_KEY);
    } catch (e) {
      saved = null;
    }
    applyLayout(saved);
  }());

  // --- fullscreen preview (visualisation only, fit to screen) ---

  function isFullscreen() {
    return document.fullscreenElement === previewPanel;
  }

  fullscreenBtn.addEventListener('click', function () {
    if (isFullscreen()) {
      document.exitFullscreen();
    } else if (previewPanel.requestFullscreen) {
      previewPanel.requestFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', function () {
    fullscreenBtn.textContent = isFullscreen() ? 'Exit fullscreen' : 'Fullscreen';
    // No manual nudge needed: the iframe is cross-origin (sandboxed, no
    // allow-same-origin) so we can't reach into its window from here, but
    // the browser already fires a native "resize" event inside it whenever
    // its rendered box size changes, and sandbox.html's own resize handler
    // picks that up to re-fit the grid.
  });

  function loadFromHash() {
    var hash = window.location.hash;
    if (hash.indexOf('#s=') !== 0) {
      return false;
    }

    try {
      var state = decodeState(hash.slice(3));
      cm.setValue(state.code || '');
      fpsInput.value = state.fps || 30;
      widthInput.value = state.cols || 80;
      heightInput.value = state.rows || 25;
      return true;
    } catch (e) {
      flashStatus('Could not read shared link');
      return false;
    }
  }

  function syncUrlHash() {
    history.replaceState(null, '', buildShareUrl());
  }

  cm.on('change', syncUrlHash);
  [fpsInput, widthInput, heightInput].forEach(function (input) {
    input.addEventListener('change', syncUrlHash);
  });

  var flashTimer = null;
  function flashStatus(message) {
    statusEl.textContent = message;
    statusEl.className = '';
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () {
      statusEl.textContent = '';
    }, 3000);
  }

  // --- help popup ---

  helpBtn.addEventListener('click', function () {
    helpDialog.showModal();
  });

  helpCloseBtn.addEventListener('click', function () {
    helpDialog.close();
  });

  helpDialog.addEventListener('click', function (e) {
    // A click that lands on the dialog element itself (not one of its
    // children) means the backdrop was clicked, since <dialog> only
    // covers its content box - the ::backdrop pseudo-element is outside
    // that box but still bubbles clicks up to the dialog as target.
    if (e.target === helpDialog) {
      helpDialog.close();
    }
  });

  // --- run / stop, wired to the sandboxed preview iframe ---

  function runShader() {
    var options = currentOptions();

    logEl.textContent = '';
    logEl.className = '';
    statusEl.textContent = 'Running...';
    statusEl.className = 'running';

    preview.contentWindow.postMessage({
      type: 'run',
      code: cm.getValue(),
      fps: options.fps,
      cols: options.cols,
      rows: options.rows
    }, '*');
  }

  function stopShader() {
    preview.contentWindow.postMessage({ type: 'stop' }, '*');
    statusEl.textContent = 'Stopped';
    statusEl.className = '';
  }

  runBtn.addEventListener('click', runShader);
  stopBtn.addEventListener('click', stopShader);
  [fpsInput, widthInput, heightInput].forEach(function (input) {
    input.addEventListener('change', runShader);
  });

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runShader();
    }
  });

  window.addEventListener('message', function (e) {
    var data = e.data || {};

    if (data.type === 'running') {
      statusEl.textContent = 'Running';
      statusEl.className = 'running';
    } else if (data.type === 'error') {
      statusEl.textContent = 'Error';
      statusEl.className = 'error';
      logEl.textContent = data.message;
      logEl.className = 'error';
    } else if (data.type === 'log') {
      logEl.textContent = data.message;
      logEl.className = data.level === 'error' ? 'error' : '';
    }
  });

  // --- initial load ---

  if (!loadFromHash()) {
    cm.setValue(findExample('plasma').code);
  }

  // Fire the first run now, and again on the iframe's "load" event as a
  // fallback. sandbox.html has no external dependencies and can finish
  // loading before this page is done fetching CodeMirror from the CDN, so
  // the message sent here may arrive before its listener is attached and
  // get silently dropped - in that case "load" (which only fires once the
  // iframe's inline script has already registered its listener) covers it.
  // Because both calls happen synchronously with no await between them,
  // "load" can't fire in the gap and cause a double run.
  runShader();
  preview.addEventListener('load', runShader);
})();
