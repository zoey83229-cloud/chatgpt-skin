// ==UserScript==
// @name         小粥 × 苏瞿｜ChatGPT 手机网页美化 v0.4
// @namespace    xiaozhou-suqu
// @version      0.4.0
// @description  iPhone Safari 轻量版：照片背景、单层奶白气泡、左右头像与名字、宋体；保留 ChatGPT 原生交互。
// @match        https://chatgpt.com/*
// @match        https://www.chatgpt.com/*
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// ==/UserScript==

(() => {
  'use strict';

  const ROOT_CLASS = 'xz-skin-v04';
  const STYLE_ID = 'xz-suqu-style-v04';
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
        --xz-v04-ink: 57, 52, 48;
        --xz-v04-soft: 105, 97, 91;
        --xz-v04-font: "Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", serif;
        --xz-v04-background: none;
      }

      html.${ROOT_CLASS},
      html.${ROOT_CLASS} body {
        color-scheme: light !important;
        min-height: 100%;
        background-color: #f4f0eb !important;
        background-image:
          linear-gradient(rgba(255, 255, 255, .53), rgba(255, 255, 255, .53)),
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

      .xz-identity-v04 {
        display: flex;
        width: 100%;
        box-sizing: border-box;
        align-items: center;
        gap: 8px;
        margin: 0 0 7px;
        color: rgba(var(--xz-v04-ink), .84);
        font-family: var(--xz-v04-font);
        font-size: 15px;
        line-height: 1;
        letter-spacing: .025em;
      }

      .xz-identity-v04[data-xz-role="assistant"] { justify-content: flex-start; }
      .xz-identity-v04[data-xz-role="user"] { justify-content: flex-end; }

      .xz-name-v04 {
        appearance: none;
        -webkit-appearance: none;
        display: inline-flex;
        align-items: center;
        min-height: 32px;
        padding: 0;
        border: 0;
        border-radius: 0;
        color: inherit;
        background: transparent;
        font: inherit;
        letter-spacing: inherit;
        cursor: pointer;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .xz-avatar-button-v04 {
        appearance: none;
        -webkit-appearance: none;
        position: relative;
        flex: 0 0 38px;
        width: 38px;
        height: 38px;
        overflow: hidden;
        padding: 0;
        border: 1px solid rgba(255, 255, 255, .78);
        border-radius: 50%;
        background: rgba(239, 232, 226, .9);
        box-shadow: 0 3px 12px rgba(67, 56, 48, .08);
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

      .xz-bubble-v04 {
        box-sizing: border-box !important;
        max-width: min(92%, 760px) !important;
        padding: 12px 15px !important;
        border: 1px solid rgba(255, 255, 255, .68) !important;
        border-radius: 18px !important;
        color: rgb(var(--xz-v04-ink)) !important;
        background: rgba(var(--xz-v04-paper), .75) !important;
        box-shadow: 0 7px 25px rgba(67, 56, 48, .055) !important;
        backdrop-filter: blur(11px) saturate(105%) !important;
        -webkit-backdrop-filter: blur(11px) saturate(105%) !important;
        font-family: var(--xz-v04-font) !important;
        line-height: 1.76 !important;
        letter-spacing: .008em;
      }

      .xz-bubble-v04[data-xz-role="assistant"] {
        width: fit-content !important;
        margin-inline: 0 auto !important;
      }

      .xz-bubble-v04[data-xz-role="user"] {
        width: fit-content !important;
        margin-inline: auto 0 !important;
        background: rgba(249, 246, 242, .82) !important;
      }

      .xz-bubble-v04 pre,
      .xz-bubble-v04 code,
      .xz-bubble-v04 kbd,
      .xz-bubble-v04 samp {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      }

      .xz-composer-v04 {
        border: 1px solid rgba(255, 255, 255, .72) !important;
        border-radius: 25px !important;
        background: rgba(255, 253, 249, .79) !important;
        box-shadow: 0 8px 28px rgba(61, 51, 43, .07) !important;
        backdrop-filter: blur(13px) saturate(106%) !important;
        -webkit-backdrop-filter: blur(13px) saturate(106%) !important;
      }

      html.${ROOT_CLASS} #prompt-textarea {
        color: rgb(var(--xz-v04-ink)) !important;
        font-family: var(--xz-v04-font) !important;
      }

      @media (max-width: 720px) {
        .xz-identity-v04 {
          margin-bottom: 6px;
          padding-inline: 2px;
        }

        .xz-avatar-button-v04 {
          flex-basis: 36px;
          width: 36px;
          height: 36px;
        }

        .xz-bubble-v04 {
          max-width: 94% !important;
          padding: 11px 13px !important;
          border-radius: 17px !important;
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

    if (role === 'user') row.append(name, avatarButton);
    else row.append(avatarButton, name);
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

  function skinComposer() {
    const prompt = document.querySelector('#prompt-textarea');
    if (!prompt) return;
    let node = prompt.parentElement;
    while (node && node !== document.body) {
      if (typeof node.className === 'string' && node.className.includes('composer-surface-primary')) {
        document.querySelectorAll('.xz-composer-v04').forEach((old) => {
          if (old !== node) old.classList.remove('xz-composer-v04');
        });
        node.classList.add('xz-composer-v04');
        return;
      }
      node = node.parentElement;
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

    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else window.addEventListener('DOMContentLoaded', start, { once: true });
})();
