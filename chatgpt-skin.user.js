// ==UserScript==
// @name         小粥 × 苏瞿｜ChatGPT 私人聊天皮肤
// @namespace    xiaozhou-suqu
// @version      0.3.0
// @description  参考图定向版：宋体、照片背景、奶白半透明气泡、左右头像和名字；尽量不碰 ChatGPT 原生交互层。
// @match        https://chatgpt.com/*
// @match        https://www.chatgpt.com/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/zoey83229-cloud/chatgpt-skin/main/chatgpt-skin.user.js
// @downloadURL  https://raw.githubusercontent.com/zoey83229-cloud/chatgpt-skin/main/chatgpt-skin.user.js
// ==/UserScript==

(() => {
  'use strict';

  const KEY = 'xz_suqu_chat_skin_v03';
  const DEFAULTS = {
    userAvatar: '',
    assistantAvatar: '',
    background: ''
  };

  let state = loadState();
  let raf = 0;

  function loadState() {
    try {
      const v1 = JSON.parse(localStorage.getItem('xz_suqu_chat_skin_v01') || '{}');
      const v2 = JSON.parse(localStorage.getItem('xz_suqu_chat_skin_v02') || '{}');
      const v3 = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { ...DEFAULTS, ...v1, ...v2, ...v3 };
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

  function injectStyle() {
    if (document.getElementById('xz-suqu-style-v03')) return;

    const style = document.createElement('style');
    style.id = 'xz-suqu-style-v03';
    style.textContent = `
      :root {
        --xz-paper: 255, 253, 249;
        --xz-paper-2: 247, 244, 240;
        --xz-ink: 56, 52, 49;
        --xz-soft: 112, 104, 98;
        --xz-font: "Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", serif;
        --xz-bg-image: none;
      }

      html.xz-skin-v03 body {
        color-scheme: light !important;
        background-color: rgb(var(--xz-paper-2)) !important;
        background-image:
          linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.55)),
          var(--xz-bg-image) !important;
        background-position: center !important;
        background-size: cover !important;
        background-repeat: no-repeat !important;
        background-attachment: fixed !important;
      }

      /* 只让聊天主体透出背景，不碰 header / sidebar / 全局层级 */
      html.xz-skin-v03 main,
      html.xz-skin-v03 [role="main"] {
        background-color: transparent !important;
      }

      html.xz-skin-v03 main [class*="bg-token-main-surface-primary"],
      html.xz-skin-v03 main [class*="bg-token-main-surface-secondary"] {
        background-color: transparent !important;
      }

      html.xz-skin-v03 [data-message-author-role],
      html.xz-skin-v03 #prompt-textarea,
      html.xz-skin-v03 .xz-bubble-v03 {
        font-family: var(--xz-font) !important;
        color: rgb(var(--xz-ink)) !important;
      }

      html.xz-skin-v03 [data-message-author-role] {
        position: relative !important;
        padding-top: 46px !important;
        line-height: 1.78 !important;
        letter-spacing: .01em;
        background: transparent !important;
      }

      /* 头像 + 名字：直接长在消息上方，不再加顶栏 */
      html.xz-skin-v03 [data-message-author-role].xz-assistant-v03::before,
      html.xz-skin-v03 [data-message-author-role].xz-user-v03::before {
        position: absolute;
        top: 2px;
        min-height: 38px;
        display: flex;
        align-items: center;
        box-sizing: border-box;
        font-family: var(--xz-font);
        font-size: 15px;
        color: rgba(var(--xz-ink), .86);
        letter-spacing: .035em;
        background-repeat: no-repeat;
        background-size: 36px 36px;
        pointer-events: none;
      }

      html.xz-skin-v03 [data-message-author-role].xz-assistant-v03::before {
        content: "苏瞿";
        left: 0;
        padding-left: 46px;
        background-image: var(--xz-assistant-avatar);
        background-position: left center;
      }

      html.xz-skin-v03 [data-message-author-role].xz-user-v03::before {
        content: "小粥";
        right: 0;
        padding-right: 46px;
        justify-content: flex-end;
        background-image: var(--xz-user-avatar);
        background-position: right center;
      }

      /* 头像本身只有 38x38 的点击区域，其余页面完全让给 ChatGPT */
      .xz-avatar-hit-v03 {
        position: absolute;
        top: 1px;
        width: 38px;
        height: 38px;
        padding: 0;
        margin: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        z-index: 2;
        cursor: pointer;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .xz-assistant-v03 > .xz-avatar-hit-v03 { left: -1px; }
      .xz-user-v03 > .xz-avatar-hit-v03 { right: -1px; }

      /* 无头像时给一个极淡圆底，方便知道点哪里 */
      html.xz-skin-v03 [data-message-author-role].xz-no-assistant-avatar-v03::before {
        background-color: rgba(236,229,223,.78);
        border-radius: 999px 0 0 999px;
      }
      html.xz-skin-v03 [data-message-author-role].xz-no-user-avatar-v03::before {
        background-color: rgba(236,229,223,.78);
        border-radius: 0 999px 999px 0;
      }

      .xz-bubble-v03 {
        width: fit-content !important;
        max-width: min(92%, 760px) !important;
        box-sizing: border-box !important;
        padding: 12px 14px !important;
        border: 1px solid rgba(255,255,255,.64) !important;
        border-radius: 18px !important;
        background: rgba(var(--xz-paper), .72) !important;
        box-shadow: 0 7px 24px rgba(65,55,48,.045) !important;
        backdrop-filter: blur(12px) saturate(104%) !important;
        -webkit-backdrop-filter: blur(12px) saturate(104%) !important;
      }

      .xz-bubble-assistant-v03 {
        margin-left: 0 !important;
        margin-right: auto !important;
      }

      .xz-bubble-user-v03 {
        margin-left: auto !important;
        margin-right: 0 !important;
        background: rgba(249,246,242,.80) !important;
      }

      /* 保留 ChatGPT 原生操作按钮，只把视觉压轻 */
      html.xz-skin-v03 [data-message-author-role] + * button,
      html.xz-skin-v03 [data-message-author-role] button {
        color: rgba(var(--xz-ink), .72) !important;
      }

      /* 输入框只换材质和字体，不改位置、不盖浮层 */
      .xz-composer-v03 {
        background: rgba(255,253,249,.79) !important;
        border: 1px solid rgba(255,255,255,.72) !important;
        border-radius: 24px !important;
        box-shadow: 0 9px 30px rgba(60,50,42,.06) !important;
        backdrop-filter: blur(14px) saturate(108%) !important;
        -webkit-backdrop-filter: blur(14px) saturate(108%) !important;
      }

      html.xz-skin-v03 #prompt-textarea {
        color: rgb(var(--xz-ink)) !important;
      }

      @media (max-width: 720px) {
        html.xz-skin-v03 [data-message-author-role] {
          padding-top: 44px !important;
        }

        .xz-bubble-v03 {
          max-width: 94% !important;
          border-radius: 17px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function applyVars() {
    const root = document.documentElement;
    root.classList.add('xz-skin-v03');
    root.style.setProperty('--xz-bg-image', state.background ? `url("${state.background}")` : 'none');
    root.style.setProperty('--xz-user-avatar', state.userAvatar ? `url("${state.userAvatar}")` : 'none');
    root.style.setProperty('--xz-assistant-avatar', state.assistantAvatar ? `url("${state.assistantAvatar}")` : 'none');
  }

  async function compressImage(file, maxSide, quality) {
    const original = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = original;
    });

    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', quality);
  }

  function pickImage(kind) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) {
        input.remove();
        return;
      }

      try {
        const data = kind === 'background'
          ? await compressImage(file, 1440, 0.76)
          : await compressImage(file, 512, 0.84);

        if (kind === 'user') state.userAvatar = data;
        if (kind === 'assistant') state.assistantAvatar = data;
        if (kind === 'background') state.background = data;

        saveState();
        applyVars();
        refresh();
      } catch (err) {
        console.error('[小粥×苏瞿] 图片处理失败', err);
        alert('这张图处理失败了，换一张试试。');
      } finally {
        input.remove();
      }
    }, { once: true });

    document.body.appendChild(input);
    input.click();
  }

  function findBubble(roleEl, role) {
    if (role === 'assistant') {
      return roleEl.querySelector('.markdown')
        || roleEl.querySelector('[class*="prose"]')
        || roleEl.firstElementChild;
    }

    return roleEl.querySelector('[class*="whitespace-pre-wrap"]')
      || roleEl.querySelector('[class*="break-words"]')
      || roleEl.firstElementChild;
  }

  function installAvatarHit(roleEl, role) {
    let hit = roleEl.querySelector(':scope > .xz-avatar-hit-v03');
    if (hit) return;

    hit = document.createElement('button');
    hit.type = 'button';
    hit.className = 'xz-avatar-hit-v03';
    hit.setAttribute(
      'aria-label',
      role === 'user'
        ? '点按更换小粥头像，长按更换聊天背景'
        : '点按更换苏瞿头像，长按更换聊天背景'
    );

    let timer = null;
    let longPressed = false;

    const clear = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };

    hit.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      longPressed = false;
      clear();
      timer = setTimeout(() => {
        longPressed = true;
        pickImage('background');
      }, 650);
    });

    hit.addEventListener('pointerup', (e) => {
      e.stopPropagation();
      clear();
      if (!longPressed) pickImage(role);
    });

    hit.addEventListener('pointercancel', clear);
    hit.addEventListener('contextmenu', (e) => e.preventDefault());

    roleEl.prepend(hit);
  }

  function decorateMessage(roleEl) {
    const role = roleEl.getAttribute('data-message-author-role');
    if (role !== 'user' && role !== 'assistant') return;

    roleEl.classList.add(role === 'user' ? 'xz-user-v03' : 'xz-assistant-v03');
    roleEl.classList.toggle('xz-no-user-avatar-v03', role === 'user' && !state.userAvatar);
    roleEl.classList.toggle('xz-no-assistant-avatar-v03', role === 'assistant' && !state.assistantAvatar);

    installAvatarHit(roleEl, role);

    const bubble = findBubble(roleEl, role);
    if (bubble) {
      bubble.classList.add('xz-bubble-v03');
      bubble.classList.toggle('xz-bubble-user-v03', role === 'user');
      bubble.classList.toggle('xz-bubble-assistant-v03', role === 'assistant');
    }
  }

  function skinComposer() {
    const prompt = document.querySelector('#prompt-textarea');
    if (!prompt) return;

    let node = prompt.parentElement;
    for (let i = 0; i < 4 && node; i += 1, node = node.parentElement) {
      const rect = node.getBoundingClientRect?.();
      if (rect && rect.width > 220 && rect.height > 42 && rect.height < 240) {
        node.classList.add('xz-composer-v03');
        break;
      }
    }
  }

  function refresh() {
    applyVars();
    document
      .querySelectorAll('[data-message-author-role="user"], [data-message-author-role="assistant"]')
      .forEach(decorateMessage);
    skinComposer();
  }

  function start() {
    injectStyle();
    applyVars();
    refresh();

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(refresh);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.body) start();
  else window.addEventListener('DOMContentLoaded', start, { once: true });
})();
