// ==UserScript==
// @name         小粥 × 苏瞿｜ChatGPT 私人聊天皮肤（安全版）
// @namespace    xiaozhou-suqu
// @version      0.2.0
// @description  iPhone/Safari 优先：宋体、照片背景、奶白半透明气泡、双头像、顶部标题、相册直传。v0.2 避免干扰 ChatGPT 导航层级。
// @match        https://chatgpt.com/*
// @match        https://www.chatgpt.com/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/zoey83229-cloud/chatgpt-skin/main/chatgpt-skin.user.js
// @downloadURL  https://raw.githubusercontent.com/zoey83229-cloud/chatgpt-skin/main/chatgpt-skin.user.js
// ==/UserScript==

(() => {
  'use strict';

  const KEY = 'xz_suqu_chat_skin_v02';
  const DEFAULTS = {
    userAvatar: '',
    assistantAvatar: '',
    background: '',
    bubbleOpacity: 0.78,
    blur: 14,
    title: '小粥 × 苏瞿'
  };

  let state = loadState();
  let observer = null;
  let raf = 0;

  function loadState() {
    try {
      // 尝试继承 v0.1 已选的图片
      const old = JSON.parse(localStorage.getItem('xz_suqu_chat_skin_v01') || '{}');
      const cur = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { ...DEFAULTS, ...old, ...cur };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('[小粥×苏瞿] 保存失败', err);
      alert('图片保存失败，可能是图片太大。换一张尺寸小一点的图试试。');
    }
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else node.setAttribute(k, v);
    }
    for (const child of [].concat(children)) {
      if (child == null) continue;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  function injectStyle() {
    if (document.getElementById('xz-suqu-style-v02')) return;
    const style = el('style', { id: 'xz-suqu-style-v02' });
    style.textContent = `
      :root {
        --xz-paper: 255, 252, 247;
        --xz-paper-2: 249, 245, 239;
        --xz-ink: 48, 45, 43;
        --xz-soft-ink: 104, 97, 92;
        --xz-bubble-opacity: .78;
        --xz-blur: 14px;
        --xz-font: "Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", serif;
        --xz-bg-image: none;
      }

      html.xz-skin-v02 body {
        color-scheme: light !important;
        background-color: rgb(var(--xz-paper-2)) !important;
        background-image:
          linear-gradient(rgba(255,255,255,.64), rgba(255,255,255,.64)),
          var(--xz-bg-image) !important;
        background-position: center !important;
        background-size: cover !important;
        background-attachment: fixed !important;
        background-repeat: no-repeat !important;
      }

      /* 只处理聊天相关表面；绝不改 body 一级子元素层级 */
      html.xz-skin-v02 main,
      html.xz-skin-v02 #thread,
      html.xz-skin-v02 [role="main"] {
        background-color: transparent !important;
      }

      html.xz-skin-v02 [class*="bg-token-main-surface-primary"],
      html.xz-skin-v02 [class*="bg-token-main-surface-secondary"] {
        background-color: rgba(var(--xz-paper), .44) !important;
      }

      html.xz-skin-v02 [data-message-author-role],
      html.xz-skin-v02 #prompt-textarea,
      html.xz-skin-v02 .xz-topbar-v02,
      html.xz-skin-v02 .xz-sheet-v02 {
        font-family: var(--xz-font) !important;
      }

      html.xz-skin-v02 [data-message-author-role] {
        color: rgb(var(--xz-ink)) !important;
        line-height: 1.78 !important;
        letter-spacing: .01em;
      }

      html.xz-skin-v02 .xz-turn-v02 {
        position: relative !important;
        padding-top: 10px !important;
        padding-bottom: 10px !important;
      }

      html.xz-skin-v02 .xz-turn-user-v02 { padding-right: 50px !important; }
      html.xz-skin-v02 .xz-turn-assistant-v02 { padding-left: 50px !important; }

      html.xz-skin-v02 .xz-turn-v02 [data-message-author-role="user"],
      html.xz-skin-v02 .xz-turn-v02 [data-message-author-role="assistant"] {
        border: 1px solid rgba(255,255,255,.64) !important;
        background: rgba(var(--xz-paper), var(--xz-bubble-opacity)) !important;
        border-radius: 18px !important;
        box-shadow: 0 8px 28px rgba(62,54,48,.055) !important;
        backdrop-filter: blur(var(--xz-blur)) saturate(108%) !important;
        -webkit-backdrop-filter: blur(var(--xz-blur)) saturate(108%) !important;
      }

      html.xz-skin-v02 .xz-turn-v02 [data-message-author-role="assistant"] {
        padding: 14px 15px !important;
      }

      html.xz-skin-v02 .xz-turn-v02 [data-message-author-role="user"] {
        background: rgba(250,247,243,.84) !important;
      }

      .xz-msg-avatar-v02 {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        object-fit: cover;
        position: absolute;
        top: 12px;
        border: 1.5px solid rgba(255,255,255,.94);
        box-shadow: 0 4px 16px rgba(60,50,42,.12);
        background: rgba(255,255,255,.92);
        z-index: 2;
        pointer-events: auto;
      }

      .xz-turn-user-v02 > .xz-msg-avatar-v02 { right: 5px; }
      .xz-turn-assistant-v02 > .xz-msg-avatar-v02 { left: 5px; }

      .xz-avatar-fallback-v02 {
        display: grid;
        place-items: center;
        font-family: var(--xz-font);
        font-size: 17px;
        color: rgba(var(--xz-ink), .8);
        background: rgba(239,231,224,.96);
      }

      /* 顶栏整体不接收点击，只有两个头像能点，避免挡住 ChatGPT 原生按钮 */
      .xz-topbar-v02 {
        position: fixed;
        left: 50%;
        top: calc(env(safe-area-inset-top, 0px) + 52px);
        transform: translateX(-50%);
        z-index: 999;
        height: 38px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 3px 10px 3px 6px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.70);
        background: rgba(255,252,247,.72);
        box-shadow: 0 5px 20px rgba(60,50,42,.07);
        backdrop-filter: blur(16px) saturate(115%);
        -webkit-backdrop-filter: blur(16px) saturate(115%);
        color: rgb(var(--xz-ink));
        user-select: none;
        -webkit-user-select: none;
        pointer-events: none;
      }

      .xz-top-avatars-v02 { display: flex; align-items: center; pointer-events: auto; }

      .xz-top-avatar-v02 {
        width: 29px;
        height: 29px;
        border-radius: 50%;
        object-fit: cover;
        border: 1.5px solid rgba(255,255,255,.94);
        box-shadow: 0 2px 8px rgba(70,60,50,.10);
        background: rgba(245,238,232,.96);
        cursor: pointer;
        pointer-events: auto;
      }

      .xz-top-avatar-v02 + .xz-top-avatar-v02 { margin-left: -7px; }
      .xz-title-v02 { font-size: 14px; letter-spacing: .035em; white-space: nowrap; }

      .xz-settings-btn-v02 {
        position: fixed;
        right: 14px;
        bottom: calc(env(safe-area-inset-bottom, 0px) + 104px);
        z-index: 999;
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(255,255,255,.78);
        border-radius: 50%;
        background: rgba(255,252,247,.78);
        box-shadow: 0 7px 22px rgba(60,50,42,.10);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        color: rgba(var(--xz-ink), .76);
        font-family: var(--xz-font);
        font-size: 20px;
        cursor: pointer;
      }

      /* 关闭时彻底 display:none，绝不会成为透明全屏拦截层 */
      .xz-overlay-v02 {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        background: rgba(42,38,35,.20);
      }
      .xz-overlay-v02.open { display: block; }

      .xz-sheet-v02 {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 18px 18px calc(env(safe-area-inset-bottom, 0px) + 18px);
        border-radius: 26px 26px 0 0;
        background: rgba(255,252,247,.97);
        box-shadow: 0 -16px 50px rgba(60,50,42,.13);
        color: rgb(var(--xz-ink));
      }

      .xz-sheet-handle-v02 {
        width: 38px; height: 4px; border-radius: 999px;
        margin: 0 auto 14px; background: rgba(var(--xz-ink), .14);
      }
      .xz-sheet-title-v02 { font-size: 18px; margin-bottom: 4px; }
      .xz-sheet-sub-v02 { font-size: 12px; color: rgba(var(--xz-soft-ink), .82); margin-bottom: 15px; }
      .xz-grid-v02 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .xz-action-v02 {
        border: 1px solid rgba(88,76,68,.10);
        background: rgba(245,239,233,.82);
        border-radius: 16px;
        min-height: 52px;
        padding: 11px 12px;
        text-align: left;
        color: rgb(var(--xz-ink));
        font-family: var(--xz-font);
        font-size: 14px;
        cursor: pointer;
      }
      .xz-action-v02.full { grid-column: 1 / -1; }
      .xz-action-v02.danger { background: rgba(245,235,232,.74); color: #72544e; }

      .xz-composer-v02 {
        border-radius: 24px !important;
        background: rgba(255,252,247,.78) !important;
        border: 1px solid rgba(255,255,255,.72) !important;
        box-shadow: 0 10px 35px rgba(60,50,42,.08) !important;
        backdrop-filter: blur(18px) saturate(115%) !important;
        -webkit-backdrop-filter: blur(18px) saturate(115%) !important;
      }

      html.xz-skin-v02 #prompt-textarea { color: rgb(var(--xz-ink)) !important; }

      @media (max-width: 720px) {
        .xz-topbar-v02 { max-width: calc(100vw - 150px); }
        .xz-title-v02 { overflow: hidden; text-overflow: ellipsis; }
      }
    `;
    document.head.appendChild(style);
  }

  function applyVars() {
    const root = document.documentElement;
    root.classList.add('xz-skin-v02');
    root.style.setProperty('--xz-bg-image', state.background ? `url("${state.background}")` : 'none');
    root.style.setProperty('--xz-bubble-opacity', String(state.bubbleOpacity));
    root.style.setProperty('--xz-blur', `${state.blur}px`);
  }

  async function fileToCompressedDataURL(file, maxSide, quality) {
    const original = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = original;
    });

    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  }

  function pickImage(kind) {
    const input = el('input', { type: 'file', accept: 'image/*' });
    input.style.display = 'none';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return input.remove();
      try {
        const data = kind === 'background'
          ? await fileToCompressedDataURL(file, 1440, 0.78)
          : await fileToCompressedDataURL(file, 512, 0.84);
        if (kind === 'background') state.background = data;
        if (kind === 'user') state.userAvatar = data;
        if (kind === 'assistant') state.assistantAvatar = data;
        saveState();
        applyVars();
        refresh();
      } catch (err) {
        console.error('[小粥×苏瞿] 图片处理失败', err);
        alert('这张图处理失败了，换一张试试。');
      } finally {
        input.remove();
      }
    });
    document.body.appendChild(input);
    input.click();
  }

  function makeAvatar(src, label, className, kind) {
    const node = src
      ? el('img', { class: className, src, alt: label })
      : el('div', { class: `${className} xz-avatar-fallback-v02`, text: label.slice(0, 1) });
    node.addEventListener('click', (e) => {
      e.stopPropagation();
      pickImage(kind);
    });
    return node;
  }

  function hasConversation() {
    return !!document.querySelector('[data-message-author-role="user"], [data-message-author-role="assistant"]');
  }

  function ensureTopUI() {
    const oldTop = document.querySelector('.xz-topbar-v02');
    const oldBtn = document.querySelector('.xz-settings-btn-v02');

    if (!hasConversation()) {
      oldTop?.remove();
      oldBtn?.remove();
      document.querySelector('.xz-overlay-v02')?.remove();
      return;
    }

    if (!oldTop) {
      const wrap = el('div', { class: 'xz-top-avatars-v02' }, [
        makeAvatar(state.userAvatar, '小粥', 'xz-top-avatar-v02', 'user'),
        makeAvatar(state.assistantAvatar, '苏瞿', 'xz-top-avatar-v02', 'assistant')
      ]);
      document.body.appendChild(el('div', { class: 'xz-topbar-v02' }, [
        wrap,
        el('div', { class: 'xz-title-v02', text: state.title })
      ]));
    }

    if (!oldBtn) buildSettings();
  }

  function buildSettings() {
    document.querySelector('.xz-settings-btn-v02')?.remove();
    document.querySelector('.xz-overlay-v02')?.remove();

    const btn = el('button', { class: 'xz-settings-btn-v02', type: 'button', text: '♡', title: '界面设置' });
    const overlay = el('div', { class: 'xz-overlay-v02' });
    const sheet = el('div', { class: 'xz-sheet-v02' });

    sheet.append(
      el('div', { class: 'xz-sheet-handle-v02' }),
      el('div', { class: 'xz-sheet-title-v02', text: '小粥 × 苏瞿' }),
      el('div', { class: 'xz-sheet-sub-v02', text: '头像和背景都直接从手机相册选择。' })
    );

    const grid = el('div', { class: 'xz-grid-v02' });
    grid.append(
      el('button', { class: 'xz-action-v02', type: 'button', text: '更换小粥头像', onclick: () => pickImage('user') }),
      el('button', { class: 'xz-action-v02', type: 'button', text: '更换苏瞿头像', onclick: () => pickImage('assistant') }),
      el('button', { class: 'xz-action-v02 full', type: 'button', text: '更换聊天背景', onclick: () => pickImage('background') }),
      el('button', {
        class: 'xz-action-v02 full danger', type: 'button', text: '恢复默认图片',
        onclick: () => {
          if (!confirm('清掉当前两个头像和背景图？')) return;
          state.userAvatar = '';
          state.assistantAvatar = '';
          state.background = '';
          saveState();
          applyVars();
          refresh(true);
          overlay.classList.remove('open');
        }
      })
    );
    sheet.appendChild(grid);
    overlay.appendChild(sheet);

    btn.addEventListener('click', () => overlay.classList.add('open'));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });

    document.body.append(btn, overlay);
  }

  function getTurn(roleEl) {
    return roleEl.closest('article') || roleEl.closest('[data-testid^="conversation-turn-"]') || roleEl.parentElement;
  }

  function ensureMessageAvatar(roleEl) {
    const role = roleEl.getAttribute('data-message-author-role');
    if (!['user', 'assistant'].includes(role)) return;
    const turn = getTurn(roleEl);
    if (!turn) return;

    turn.classList.add('xz-turn-v02');
    turn.classList.toggle('xz-turn-user-v02', role === 'user');
    turn.classList.toggle('xz-turn-assistant-v02', role === 'assistant');

    let avatar = turn.querySelector(':scope > .xz-msg-avatar-v02');
    const src = role === 'user' ? state.userAvatar : state.assistantAvatar;
    const label = role === 'user' ? '粥' : '瞿';

    if (avatar) avatar.remove();
    avatar = makeAvatar(src, label, 'xz-msg-avatar-v02', role);
    turn.prepend(avatar);
  }

  function skinComposer() {
    const prompt = document.querySelector('#prompt-textarea');
    if (!prompt) return;
    let node = prompt.parentElement;
    for (let i = 0; i < 4 && node; i++, node = node.parentElement) {
      const rect = node.getBoundingClientRect?.();
      if (rect && rect.width > 220 && rect.height > 42 && rect.height < 260) {
        node.classList.add('xz-composer-v02');
        break;
      }
    }
  }

  function refresh(forceTop = false) {
    document.querySelectorAll('[data-message-author-role="user"], [data-message-author-role="assistant"]')
      .forEach(ensureMessageAvatar);
    skinComposer();

    if (forceTop) {
      document.querySelector('.xz-topbar-v02')?.remove();
      document.querySelector('.xz-settings-btn-v02')?.remove();
      document.querySelector('.xz-overlay-v02')?.remove();
    }
    ensureTopUI();
  }

  function start() {
    injectStyle();
    applyVars();
    refresh();

    observer = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => refresh());
    });
    observer.observe(document.body, { childList: true, subtree: true });

    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(() => refresh(true), 350);
      }
    }, 800);
  }

  if (document.body) start();
  else window.addEventListener('DOMContentLoaded', start, { once: true });
})();
