// ==UserScript==
// @name         小粥 × 苏瞿｜ChatGPT 手机网页美化 v0.4.4
// @namespace    xiaozhou-suqu
// @version      0.4.4
// @description  iPhone Safari 梦幻轻透版：黑色系统文字、列表页透明页眉、雾面输入框与五线谱身份区；保留原生交互。
// @match        https://chatgpt.com/*
// @match        https://www.chatgpt.com/*
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// @updateURL    https://raw.githubusercontent.com/zoey83229-cloud/chatgpt-skin/main/chatgpt-skin.user.js
// @downloadURL  https://raw.githubusercontent.com/zoey83229-cloud/chatgpt-skin/main/chatgpt-skin.user.js
// ==/UserScript==

(() => {
  'use strict';

  const ROOT_CLASS = 'xz-skin-v044';
  const STYLE_ID = 'xz-suqu-style-v044';
  const DB_NAME = 'xz-suqu-chat-skin-v04';
  const STORE_NAME = 'images';
  const LEGACY_KEY = 'xz_suqu_chat_skin_v03';
  const roles = ['user', 'assistant'];
  const assetUrls = { user: '', assistant: '', background: '' };
  const legacy = readLegacyImages();
  let dbPromise;
  let refreshFrame = 0;

  function readLegacyImages() {
    try {
      const saved = JSON.parse(localStorage.getItem(LEGACY_KEY) || '{}');
      return {
        user: saved.userAvatar || '',
        assistant: saved.assistantAvatar || '',
        background: saved.background || ''
      };
    } catch {
      return { user: '', assistant: '', background: '' };
    }
  }

  function openImageDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function readImage(kind) {
    try {
      const db = await openImageDb();
      return await new Promise((resolve, reject) => {
        const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(kind);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('[小粥×苏瞿 v0.4] 读取图片失败', error);
      return null;
    }
  }

  async function writeImage(kind, file) {
    const db = await openImageDb();
    await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(file, kind);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  function replaceObjectUrl(kind, blob) {
    if (assetUrls[kind]?.startsWith('blob:')) URL.revokeObjectURL(assetUrls[kind]);
    assetUrls[kind] = blob ? URL.createObjectURL(blob) : (legacy[kind] || '');
  }

  async function loadAssets() {
    await Promise.all(['user', 'assistant', 'background'].map(async (kind) => {
      replaceObjectUrl(kind, await readImage(kind));
    }));
    applyAssets();
  }

  function applyAssets() {
    const root = document.documentElement;
    root.classList.add(ROOT_CLASS);
    root.style.setProperty(
      '--xz-v04-background',
      assetUrls.background ? `url("${assetUrls.background}")` : 'none'
    );

    document.querySelectorAll('.xz-avatar-v04[data-xz-role]').forEach((image) => {
      const kind = image.dataset.xzRole;
      const source = assetUrls[kind] || '';
      image.src = source;
      image.hidden = !source;
      image.nextElementSibling?.toggleAttribute('hidden', Boolean(source));
    });
  }

  function chooseImage(kind) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.hidden = true;

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) {
        input.remove();
        return;
      }

      try {
        await writeImage(kind, file);
        replaceObjectUrl(kind, file);
        applyAssets();
      } catch (error) {
        console.error('[小粥×苏瞿 v0.4] 保存图片失败', error);
        alert('这张图片没有保存成功，请换一张稍小的图片再试。');
      } finally {
        input.remove();
      }
    }, { once: true });

    document.body.appendChild(input);
    input.click();
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      :root {
        --xz-v04-paper: 255, 253, 249;
        --xz-v04-ink: 15, 15, 15;
        --xz-v04-soft: 42, 42, 42;
        --xz-v04-font: "Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", serif;
        --xz-v04-background: none;
      }

      html.${ROOT_CLASS},
      html.${ROOT_CLASS} body {
        color-scheme: light !important;
        --text-primary: #0f0f0f !important;
        --text-secondary: #1f1f1f !important;
        --text-tertiary: #303030 !important;
        --text-quaternary: #424242 !important;
        min-height: 100%;
        color: #0f0f0f !important;
        background-color: #f4f0eb !important;
        background-image:
          linear-gradient(rgba(255, 255, 255, .39), rgba(255, 255, 255, .39)),
          var(--xz-v04-background) !important;
        background-position: center center !important;
        background-repeat: no-repeat !important;
        background-size: cover !important;
        background-attachment: fixed !important;
      }

      html.${ROOT_CLASS} #main,
      html.${ROOT_CLASS} main {
        background-color: transparent !important;
      }

      html.${ROOT_CLASS} #main [class*="bg-token-main-surface-primary"],
      html.${ROOT_CLASS} #main [class*="bg-token-main-surface-secondary"] {
        background-color: transparent !important;
      }

      /* 只换原生顶部栏的材质，不改变它的定位、层级或点击。 */
      html.${ROOT_CLASS} header {
        background: rgba(255, 253, 250, .58) !important;
        border-bottom-color: rgba(255, 255, 255, .52) !important;
        box-shadow: 0 5px 18px rgba(55, 48, 43, .035) !important;
        backdrop-filter: blur(15px) saturate(106%) !important;
        -webkit-backdrop-filter: blur(15px) saturate(106%) !important;
      }

      html.${ROOT_CLASS} header > div,
      html.${ROOT_CLASS} header nav {
        background-color: transparent !important;
      }

      /* 项目聊天列表使用另一套顶部节点，由脚本按真实可见位置标记。 */
      html.${ROOT_CLASS} .xz-header-v044 {
        background: rgba(255, 253, 250, .53) !important;
        border-bottom-color: rgba(255, 255, 255, .5) !important;
        box-shadow: 0 5px 18px rgba(30, 30, 30, .04) !important;
        backdrop-filter: blur(16px) saturate(106%) !important;
        -webkit-backdrop-filter: blur(16px) saturate(106%) !important;
      }

      html.${ROOT_CLASS} .xz-header-v044 > div,
      html.${ROOT_CLASS} .xz-header-v044 > nav {
        background-color: transparent !important;
        background-image: none !important;
      }

      html.${ROOT_CLASS} [class*="text-token-text-primary"] {
        color: #0f0f0f !important;
      }

      html.${ROOT_CLASS} [class*="text-token-text-secondary"] {
        color: rgba(15, 15, 15, .84) !important;
      }

      html.${ROOT_CLASS} [class*="text-token-text-tertiary"],
      html.${ROOT_CLASS} [class*="text-token-text-quaternary"] {
        color: rgba(15, 15, 15, .72) !important;
      }

      html.${ROOT_CLASS} #main [class*="text-token-text-secondary"],
      html.${ROOT_CLASS} #main [class*="text-token-text-tertiary"] {
        color: rgba(var(--xz-v04-ink), .82) !important;
      }

      .xz-identity-v04 {
        display: flex;
        width: max-content;
        max-width: 100%;
        box-sizing: border-box;
        align-items: center;
        gap: 9px;
        margin: 0 0 9px;
        color: rgba(var(--xz-v04-ink), .86);
        font-family: var(--xz-v04-font);
        font-size: 19px;
        font-style: italic;
        line-height: 1;
        letter-spacing: .08em;
        text-shadow: 0 1px 7px rgba(255, 255, 255, .78);
      }

      .xz-identity-v04[data-xz-role="assistant"] { margin-right: auto; }
      .xz-identity-v04[data-xz-role="user"] { margin-left: auto; }

      .xz-name-v04 {
        appearance: none;
        -webkit-appearance: none;
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        padding: 0;
        border: 0;
        border-radius: 0;
        color: inherit;
        background: transparent;
        font-family: "Songti SC", "STSong", "Kaiti SC", "KaiTi", serif;
        font-size: inherit;
        font-style: inherit;
        font-weight: 400;
        line-height: 1;
        letter-spacing: inherit;
        cursor: pointer;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .xz-avatar-button-v04 {
        appearance: none;
        -webkit-appearance: none;
        position: relative;
        flex: 0 0 42px;
        width: 42px;
        height: 42px;
        overflow: hidden;
        padding: 0;
        border: 1.5px solid rgba(255, 255, 255, .86);
        border-radius: 50%;
        background: rgba(239, 232, 226, .9);
        box-shadow: 0 4px 15px rgba(67, 56, 48, .11);
        cursor: pointer;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .xz-avatar-v04 {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .xz-avatar-fallback-v04 {
        display: grid;
        width: 100%;
        height: 100%;
        place-items: center;
        color: rgba(var(--xz-v04-ink), .68);
        font-family: var(--xz-v04-font);
        font-size: 15px;
      }

      .xz-music-v042 {
        position: relative;
        display: inline-block;
        width: 62px;
        height: 25px;
        flex: 0 0 62px;
        opacity: .48;
        background: repeating-linear-gradient(
          to bottom,
          transparent 0 4px,
          rgba(var(--xz-v04-soft), .7) 4px 5px
        );
        filter: drop-shadow(0 1px 3px rgba(255, 255, 255, .7));
      }

      .xz-music-v042::before {
        content: "♪";
        position: absolute;
        left: 12px;
        top: -2px;
        color: rgba(var(--xz-v04-soft), .86);
        font-family: Georgia, serif;
        font-size: 21px;
        font-style: normal;
        line-height: 1;
        transform: rotate(-8deg);
      }

      .xz-music-v042::after {
        content: "♪";
        position: absolute;
        right: 10px;
        top: 7px;
        color: rgba(var(--xz-v04-soft), .72);
        font-family: Georgia, serif;
        font-size: 16px;
        font-style: normal;
        line-height: 1;
        transform: rotate(7deg);
      }

      .xz-bubble-v04 {
        box-sizing: border-box !important;
        max-width: min(92%, 760px) !important;
        padding: 10px 14px !important;
        border: 1px solid rgba(255, 255, 255, .72) !important;
        border-radius: 16px !important;
        color: rgba(var(--xz-v04-ink), .96) !important;
        background: rgba(var(--xz-v04-paper), .7) !important;
        box-shadow: 0 5px 20px rgba(67, 56, 48, .045) !important;
        backdrop-filter: blur(9px) saturate(102%) !important;
        -webkit-backdrop-filter: blur(9px) saturate(102%) !important;
        font-family: var(--xz-v04-font) !important;
        line-height: 1.76 !important;
        letter-spacing: .008em;
      }

      .xz-bubble-v04[data-xz-role="assistant"] {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        margin-inline: 0 auto !important;
      }

      .xz-bubble-v04[data-xz-role="assistant"] > :where(p, ul, ol, blockquote, pre, table) {
        display: block;
        width: fit-content;
        max-width: 94%;
        box-sizing: border-box;
        margin: 0 0 9px !important;
        padding: 10px 14px !important;
        border: 1px solid rgba(255, 255, 255, .7) !important;
        border-radius: 16px !important;
        background: rgba(var(--xz-v04-paper), .68) !important;
        box-shadow: 0 5px 20px rgba(67, 56, 48, .04) !important;
        backdrop-filter: blur(9px) saturate(102%) !important;
        -webkit-backdrop-filter: blur(9px) saturate(102%) !important;
      }

      .xz-bubble-v04[data-xz-role="assistant"] > :where(p, ul, ol, blockquote, pre, table):last-child {
        margin-bottom: 0 !important;
      }

      .xz-bubble-v04[data-xz-role="user"] {
        width: fit-content !important;
        margin-inline: auto 0 !important;
        background: rgba(249, 246, 242, .74) !important;
      }

      /* ChatGPT 的正文子节点会单独指定黑体，这里只压正文标签，不碰图标。 */
      .xz-bubble-v04 :where(p, li, blockquote, h1, h2, h3, h4, h5, h6, td, th) {
        font-family: var(--xz-v04-font) !important;
      }

      .xz-bubble-v04 a {
        color: rgb(142, 96, 112) !important;
        text-decoration-color: rgba(142, 96, 112, .36) !important;
        text-underline-offset: .16em;
      }

      html.${ROOT_CLASS} ::selection {
        color: rgb(var(--xz-v04-ink));
        background: rgba(224, 183, 198, .38);
      }

      .xz-bubble-v04 pre,
      .xz-bubble-v04 code,
      .xz-bubble-v04 kbd,
      .xz-bubble-v04 samp {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      }

      .xz-composer-v04 {
        border: 1px solid rgba(255, 255, 255, .78) !important;
        border-radius: 25px !important;
        background: rgba(255, 253, 249, .62) !important;
        box-shadow: 0 8px 28px rgba(28, 28, 28, .065) !important;
        backdrop-filter: blur(15px) saturate(106%) !important;
        -webkit-backdrop-filter: blur(15px) saturate(106%) !important;
      }

      html.${ROOT_CLASS} .xz-composer-backdrop-v044 {
        background-color: transparent !important;
        background-image: none !important;
      }

      html.${ROOT_CLASS} #prompt-textarea {
        color: #0f0f0f !important;
        font-family: var(--xz-v04-font) !important;
      }

      html.${ROOT_CLASS} #prompt-textarea[data-placeholder]:empty::before {
        color: rgba(15, 15, 15, .58) !important;
      }

      @media (max-width: 720px) {
        .xz-identity-v04 {
          margin-bottom: 8px;
          padding-inline: 2px;
        }

        .xz-avatar-button-v04 {
          flex-basis: 40px;
          width: 40px;
          height: 40px;
        }

        .xz-bubble-v04 {
          max-width: 94% !important;
          padding: 10px 13px !important;
          border-radius: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createIdentity(role) {
    const row = document.createElement('div');
    row.className = 'xz-identity-v04';
    row.dataset.xzRole = role;

    const avatarButton = document.createElement('button');
    avatarButton.type = 'button';
    avatarButton.className = 'xz-avatar-button-v04';
    avatarButton.setAttribute('aria-label', role === 'user' ? '更换小粥头像' : '更换苏瞿头像');
    avatarButton.addEventListener('click', (event) => {
      event.stopPropagation();
      chooseImage(role);
    });

    const image = document.createElement('img');
    image.className = 'xz-avatar-v04';
    image.dataset.xzRole = role;
    image.alt = role === 'user' ? '小粥头像' : '苏瞿头像';

    const fallback = document.createElement('span');
    fallback.className = 'xz-avatar-fallback-v04';
    fallback.textContent = role === 'user' ? '粥' : '瞿';

    avatarButton.append(image, fallback);

    const name = document.createElement('button');
    name.type = 'button';
    name.className = 'xz-name-v04';
    name.textContent = role === 'user' ? '小粥' : '苏瞿';
    name.setAttribute('aria-label', '更换聊天背景');
    name.title = '更换聊天背景';
    name.addEventListener('click', (event) => {
      event.stopPropagation();
      chooseImage('background');
    });

    const music = document.createElement('span');
    music.className = 'xz-music-v042';
    music.setAttribute('aria-hidden', 'true');

    if (role === 'user') row.append(music, name, avatarButton);
    else row.append(avatarButton, name, music);
    return row;
  }

  function findBubble(roleElement, role) {
    if (role === 'user') {
      return roleElement.querySelector(':scope .user-message-bubble-color')
        || roleElement.querySelector(':scope [class~="bg-token-message-surface"]');
    }
    return roleElement.querySelector(':scope .markdown');
  }

  function decorateMessage(roleElement) {
    const role = roleElement.getAttribute('data-message-author-role');
    if (!roles.includes(role)) return;

    let identity = roleElement.previousElementSibling;
    if (!identity?.classList.contains('xz-identity-v04') || identity.dataset.xzRole !== role) {
      identity = createIdentity(role);
      roleElement.before(identity);
    }

    const bubble = findBubble(roleElement, role);
    roleElement.querySelectorAll('.xz-bubble-v04').forEach((oldBubble) => {
      if (oldBubble !== bubble) {
        oldBubble.classList.remove('xz-bubble-v04');
        delete oldBubble.dataset.xzRole;
      }
    });

    if (bubble) {
      bubble.classList.add('xz-bubble-v04');
      bubble.dataset.xzRole = role;
    }
  }

  function skinTopBar() {
    const oldBars = [...document.querySelectorAll('.xz-header-v044')];
    const matches = [];
    let probe = document.elementFromPoint(window.innerWidth / 2, 18);

    while (probe && probe !== document.body && probe !== document.documentElement) {
      const rect = probe.getBoundingClientRect?.();
      if (rect
        && rect.width >= window.innerWidth * .78
        && rect.height >= 42
        && rect.height <= 150
        && rect.top <= 12
        && rect.bottom >= 42) {
        matches.push({ element: probe, area: rect.width * rect.height });
      }
      probe = probe.parentElement;
    }

    if (!matches.length) {
      document.querySelectorAll('header, [role="banner"], [class*="sticky"], [class*="fixed"]')
        .forEach((element) => {
          const rect = element.getBoundingClientRect?.();
          if (rect
            && rect.width >= window.innerWidth * .78
            && rect.height >= 42
            && rect.height <= 150
            && rect.top <= 12
            && rect.bottom >= 42) {
            matches.push({ element, area: rect.width * rect.height });
          }
        });
    }

    matches.sort((a, b) => a.area - b.area);
    const current = matches[0]?.element || null;
    oldBars.forEach((element) => {
      if (element !== current) element.classList.remove('xz-header-v044');
    });
    current?.classList.add('xz-header-v044');
  }

  function skinComposer() {
    const prompt = document.querySelector('#prompt-textarea');
    if (!prompt) return;
    let surface = null;
    let node = prompt.parentElement;
    while (node && node !== document.body) {
      if (typeof node.className === 'string' && node.className.includes('composer-surface-primary')) {
        surface = node;
        break;
      }
      node = node.parentElement;
    }

    if (!surface) return;
    document.querySelectorAll('.xz-composer-v04').forEach((old) => {
      if (old !== surface) old.classList.remove('xz-composer-v04');
    });
    surface.classList.add('xz-composer-v04');

    document.querySelectorAll('.xz-composer-backdrop-v044').forEach((old) => {
      old.classList.remove('xz-composer-backdrop-v044');
    });

    let wrapper = surface.parentElement;
    for (let level = 0; level < 4 && wrapper && wrapper !== document.body; level += 1) {
      const rect = wrapper.getBoundingClientRect?.();
      if (!rect || rect.width < window.innerWidth * .75 || rect.height > 280) break;
      wrapper.classList.add('xz-composer-backdrop-v044');
      wrapper = wrapper.parentElement;
    }
  }

  function cleanOrphanIdentities() {
    document.querySelectorAll('.xz-identity-v04').forEach((identity) => {
      const message = identity.nextElementSibling;
      if (!message?.hasAttribute('data-message-author-role')) identity.remove();
    });
  }

  function refresh() {
    document.documentElement.classList.add(ROOT_CLASS);
    document.getElementById('xz-together-v041')?.remove();
    skinTopBar();
    cleanOrphanIdentities();
    document.querySelectorAll(
      '[data-message-author-role="user"], [data-message-author-role="assistant"]'
    ).forEach(decorateMessage);
    skinComposer();
    applyAssets();
  }

  function scheduleRefresh() {
    cancelAnimationFrame(refreshFrame);
    refreshFrame = requestAnimationFrame(refresh);
  }

  function registerBackgroundMenu() {
    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand('更换聊天背景', () => chooseImage('background'));
    }
  }

  function start() {
    injectStyle();
    registerBackgroundMenu();
    refresh();
    loadAssets();

    window.addEventListener('resize', scheduleRefresh, { passive: true });

    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else window.addEventListener('DOMContentLoaded', start, { once: true });
})();
