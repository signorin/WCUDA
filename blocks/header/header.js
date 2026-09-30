/*
 * Header block.
 *
 * All copy, links and image references come from the nav fragment
 * (/content/nav.plain.html locally, /nav.plain.html on DA/EDS). The fragment is a
 * flat list of sections, read in order:
 *   1. utility bar  – audience list (<strong> marks the active one), utility links,
 *                     search icon, search label, <em> placeholder, search link
 *                     (href = form action, text = button label), close icon
 *   2. brand        – linked full logo, compact logo (shown when scrolled)
 *   3. menus        – <h2> per menu trigger, followed by one <ul> per column; a list
 *                     whose item has a plain-text label + nested list is the aside group
 *   4. tools        – plain links; the last one opens the sign-in panel
 *   5. sign-in      – <h2> title, <ol> field labels (username, remember, submit),
 *                     <p> info text, <ul> help links
 *   6. mobile only  – quick links, <h2> headings for the main list and the "more"
 *                     list, more links, app link (added to the sign-in panel), and
 *                     the close-button label
 * Form controls are created here; the fragment only carries their copy.
 */

// the source switches to its desktop header at 1025px
const DESKTOP = window.matchMedia('(width >= 1025px)');
const SCROLL_THRESHOLD = 36;
const REMEMBER_KEY = 'nav-signin-username';

async function tryFetch(request, path) {
  try {
    const resp = await request;
    if (resp.ok) return { resp, path };
  } catch (e) {
    // network error or blocked request: fall through to the next location
  }
  return null;
}

async function fetchNavFragment() {
  // metadata-independent: /content first (localhost), then root (DA/EDS prod)
  let found = await tryFetch(fetch('/content/nav.plain.html'), '/content/nav.plain.html');
  if (!found) found = await tryFetch(fetch('/nav.plain.html'), '/nav.plain.html');
  // previews that serve the site under a path prefix
  const base = window.hlx?.codeBasePath || '';
  if (!found && base) {
    const prefixed = base.concat('/content/nav.plain.html');
    found = await tryFetch(fetch(prefixed), prefixed);
  }
  if (!found && base) {
    const prefixed = base.concat('/nav.plain.html');
    found = await tryFetch(fetch(prefixed), prefixed);
  }
  if (!found) return null;

  const fragment = document.createElement('div');
  fragment.innerHTML = await found.resp.text();
  // some servers wrap the fragment in a full page: use its <main> content
  const main = fragment.querySelector('main');
  if (main) fragment.replaceChildren(...main.children);
  // published fragments wrap list-item labels in <p> (e.g. <li><p><a>…</a></p><ul>…);
  // unwrap them so local and published markup read the same
  fragment.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));

  // resolve relative image paths against the fragment location
  // (resp.url can be empty, e.g. when a service worker answers the request)
  const fragmentUrl = new URL(found.resp.url || found.path, window.location.href);
  fragment.querySelectorAll('img[src]').forEach((img) => {
    try {
      img.src = new URL(img.getAttribute('src'), fragmentUrl).href;
    } catch (e) {
      // leave the src as authored
    }
  });
  return fragment;
}

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function directChildren(parent, selector) {
  return [...parent.children].filter((child) => child.matches(selector));
}

function ownLabel(li) {
  const link = directChildren(li, 'a')[0];
  if (link) return { link, text: link.textContent.trim() };
  const text = [...li.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent)
    .join('')
    .trim();
  return { link: null, text };
}

function markExternal(scope) {
  // links authored to open in a new tab (as on the source)
  scope.querySelectorAll('a[target="_blank"]').forEach((a) => { a.rel = 'noopener'; });
  scope.querySelectorAll('a[href]').forEach((a) => {
    try {
      const url = new URL(a.href);
      if (url.hostname && url.hostname !== window.location.hostname
        && !url.hostname.endsWith('wingscu.com')) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
    } catch (e) {
      // ignore malformed hrefs
    }
  });
}

/* ---------- open / close helpers ---------- */

function closeMenus(nav, except) {
  nav.querySelectorAll('.nav-drop[aria-expanded="true"]').forEach((drop) => {
    if (drop === except) return;
    drop.setAttribute('aria-expanded', 'false');
    drop.querySelector('.nav-drop-trigger').setAttribute('aria-expanded', 'false');
  });
}

function syncPanelState(nav) {
  // small screens: the main list slides away while a sub-panel is open
  const menu = nav.querySelector('.nav-menu');
  if (menu) menu.classList.toggle('has-open-panel', !!nav.querySelector('.nav-drop[aria-expanded="true"]'));
}

function setMenu(nav, drop, open) {
  if (open) closeMenus(nav, drop);
  drop.setAttribute('aria-expanded', open ? 'true' : 'false');
  drop.querySelector('.nav-drop-trigger').setAttribute('aria-expanded', open ? 'true' : 'false');
  syncPanelState(nav);
}

function setToggle(container, toggle, open, openClass = 'is-open') {
  container.classList.toggle(openClass, open);
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function closeAll(nav) {
  closeMenus(nav);
  syncPanelState(nav);
  nav.querySelectorAll('[data-toggle-scope]').forEach((scope) => {
    const toggle = scope.querySelector('[data-toggle]');
    setToggle(scope, toggle, false);
  });
}

/* ---------- builders ---------- */

function buildUtility(section, nav) {
  const lists = directChildren(section, 'ul');
  const allParagraphs = directChildren(section, 'p');
  const skipP = allParagraphs.find((p) => p.querySelector('a[href^="#"]'));
  const paragraphs = allParagraphs.filter((p) => p !== skipP);
  const bar = el('div', 'nav-utility');
  const inner = el('div', 'nav-utility-inner');

  // skip link: visually hidden until focused, targets <main>
  if (skipP) {
    const skip = skipP.querySelector('a');
    skip.className = 'nav-skip-link';
    const main = document.querySelector('main');
    const targetId = skip.getAttribute('href').slice(1);
    if (main && !main.id) main.id = targetId;
    if (main) main.setAttribute('tabindex', '-1');
    // keep it outside the utility bar so it is available at every width
    nav.prepend(skip);
  }

  const audience = lists[0];
  if (audience) {
    audience.className = 'nav-audience';
    audience.querySelectorAll('li').forEach((li) => {
      const strong = li.querySelector('strong');
      if (strong) {
        const link = strong.querySelector('a');
        strong.replaceWith(link);
        link.setAttribute('aria-current', 'true');
        li.classList.add('is-active');
      }
    });
    inner.append(audience);
  }

  const links = lists[1] || el('ul');
  links.className = 'nav-utility-links';
  inner.append(links);

  // search: icon, label, <em> placeholder, action link, close icon
  const [iconP, labelP, placeholderP, actionP, closeP] = paragraphs;
  if (iconP && actionP) {
    const searchItem = el('li', 'nav-search-item');
    const toggle = el('button', 'nav-search-toggle', {
      type: 'button', 'aria-expanded': 'false', 'aria-controls': 'nav-search-panel', 'data-toggle': '',
    });
    const icon = iconP.querySelector('img');
    toggle.setAttribute('aria-label', icon?.alt || 'Search');
    if (icon) toggle.append(icon);
    searchItem.append(toggle);
    links.append(searchItem);

    const action = actionP.querySelector('a');
    const panel = el('div', 'nav-search-panel', { id: 'nav-search-panel' });
    const panelInner = el('div', 'nav-search-inner');
    const form = el('form', 'nav-search-form', { action: action.getAttribute('href'), method: 'get', role: 'search' });
    const label = el('label', 'nav-search-label', { for: 'nav-search-input' });
    label.textContent = labelP?.textContent.trim() || '';
    const row = el('div', 'nav-search-row');
    const input = el('input', 'nav-search-input', {
      id: 'nav-search-input', type: 'search', name: 'searchtext', placeholder: placeholderP?.textContent.trim() || '',
    });
    const submit = el('button', 'nav-search-submit', { type: 'submit' });
    submit.textContent = action.textContent.trim();
    row.append(input, submit);
    form.append(label, row);
    const close = el('button', 'nav-search-close', { type: 'button' });
    const closeIcon = closeP?.querySelector('img');
    close.setAttribute('aria-label', closeIcon?.alt || 'Close search');
    if (closeIcon) close.append(closeIcon);
    panelInner.append(form, close);
    panel.append(panelInner);

    toggle.addEventListener('click', () => {
      const open = !nav.classList.contains('is-search-open');
      closeMenus(nav);
      setToggle(nav, toggle, open, 'is-search-open');
      if (open) input.focus();
    });
    close.addEventListener('click', () => {
      setToggle(nav, toggle, false, 'is-search-open');
      toggle.focus();
    });
    nav.append(panel);
  }

  bar.append(inner);
  return bar;
}

function buildBrand(section) {
  const brand = el('div', 'nav-brand');
  const paragraphs = directChildren(section, 'p');
  const link = section.querySelector('a') || el('a', '', { href: '/' });
  link.className = 'nav-brand-link';
  const [full, compact] = [...section.querySelectorAll('img')];
  link.textContent = '';
  if (full) {
    full.className = 'nav-logo-full';
    full.loading = 'eager';
    link.append(full);
  }
  if (compact) {
    compact.className = 'nav-logo-compact';
    compact.alt = '';
    link.append(compact);
  }
  link.setAttribute('aria-label', full?.alt || 'Home');
  brand.append(link);
  paragraphs.forEach((p) => p.remove());
  return brand;
}

function buildColumn(list) {
  const column = el('ul', 'nav-panel-column');
  directChildren(list, 'li').forEach((li) => {
    const { link } = ownLabel(li);
    const sub = directChildren(li, 'ul')[0];
    li.className = sub ? 'nav-group' : 'nav-flat';
    if (link) link.classList.add(sub ? 'nav-group-title' : 'nav-flat-link');
    if (sub) sub.className = 'nav-group-links';
    column.append(li);
  });
  return column;
}

function buildAside(list) {
  const li = directChildren(list, 'li')[0];
  const { text } = ownLabel(li);
  const aside = el('div', 'nav-panel-aside');
  const heading = el('h2', 'nav-panel-aside-title');
  heading.textContent = text;
  const links = directChildren(li, 'ul')[0] || el('ul');
  links.className = 'nav-panel-aside-links';
  aside.append(heading, links);
  return aside;
}

function buildMenus(section, nav) {
  const menus = el('ul', 'nav-sections');
  let current = null;
  [...section.children].forEach((child) => {
    if (child.tagName === 'H2') {
      const drop = el('li', 'nav-drop', { 'aria-expanded': 'false' });
      const id = `nav-panel-${menus.children.length + 1}`;
      const trigger = el('button', 'nav-drop-trigger', {
        type: 'button', 'aria-expanded': 'false', 'aria-controls': id,
      });
      trigger.textContent = child.textContent.trim();
      const panel = el('div', 'nav-panel', { id });
      // slide-in panel header on small screens
      const back = el('div', 'nav-panel-back');
      const backButton = el('button', 'nav-panel-back-button', { type: 'button', 'aria-label': 'Back' });
      const backTitle = el('p', 'nav-panel-back-title');
      backTitle.textContent = trigger.textContent;
      back.append(backButton, backTitle);
      backButton.addEventListener('click', () => {
        setMenu(nav, drop, false);
        trigger.focus();
      });
      const inner = el('div', 'nav-panel-inner');
      const columns = el('div', 'nav-panel-columns');
      inner.append(columns);
      panel.append(back, inner);
      drop.append(trigger, panel);
      menus.append(drop);
      current = { inner, columns };
    } else if (child.tagName === 'UL' && current) {
      const first = directChildren(child, 'li')[0];
      const isAside = first && !ownLabel(first).link && directChildren(first, 'ul').length;
      if (isAside) current.inner.append(buildAside(child));
      else current.columns.append(buildColumn(child));
    }
  });

  // small screens list the shared aside group (e.g. Digital Services) as its own item
  const aside = menus.querySelector('.nav-panel-aside');
  if (aside) {
    const title = aside.querySelector('.nav-panel-aside-title').textContent;
    const drop = el('li', 'nav-drop nav-mobile-only', { 'aria-expanded': 'false' });
    const id = `nav-panel-${menus.children.length + 1}`;
    const trigger = el('button', 'nav-drop-trigger', {
      type: 'button', 'aria-expanded': 'false', 'aria-controls': id,
    });
    trigger.textContent = title;
    const panel = el('div', 'nav-panel', { id });
    const back = el('div', 'nav-panel-back');
    const backButton = el('button', 'nav-panel-back-button', { type: 'button', 'aria-label': 'Back' });
    const backTitle = el('p', 'nav-panel-back-title');
    backTitle.textContent = title;
    back.append(backButton, backTitle);
    backButton.addEventListener('click', () => {
      setMenu(nav, drop, false);
      trigger.focus();
    });
    const inner = el('div', 'nav-panel-inner');
    const columns = el('div', 'nav-panel-columns');
    const column = el('ul', 'nav-panel-column');
    const group = el('li', 'nav-group');
    const links = aside.querySelector('.nav-panel-aside-links').cloneNode(true);
    links.className = 'nav-group-links';
    group.append(links);
    column.append(group);
    columns.append(column);
    inner.append(columns);
    panel.append(back, inner);
    drop.append(trigger, panel);
    menus.append(drop);
  }

  menus.querySelectorAll('.nav-drop').forEach((drop) => {
    const trigger = drop.querySelector('.nav-drop-trigger');
    trigger.addEventListener('click', () => {
      setMenu(nav, drop, drop.getAttribute('aria-expanded') !== 'true');
    });
    drop.addEventListener('mouseenter', () => {
      if (DESKTOP.matches) setMenu(nav, drop, true);
    });
    drop.addEventListener('mouseleave', () => {
      if (DESKTOP.matches) setMenu(nav, drop, false);
    });
  });
  return menus;
}

function buildSignInPanel(section, action) {
  const form = el('form', 'nav-signin-panel', { action, method: 'post', id: 'nav-signin-panel' });
  const content = el('div', 'nav-signin-content');
  const title = section.querySelector('h2');
  const heading = el('h2', 'nav-signin-title');
  heading.textContent = title?.textContent.trim() || '';
  const [userLabel, rememberLabel, submitLabel] = [...(section.querySelector('ol')?.children || [])]
    .map((li) => li.textContent.trim());

  const field = el('div', 'nav-signin-field');
  const input = el('input', 'nav-signin-username', {
    id: 'nav-signin-username', type: 'text', name: 'u', autocomplete: 'username', maxlength: '50', placeholder: ' ',
  });
  const label = el('label', 'nav-signin-label', { for: 'nav-signin-username' });
  label.textContent = userLabel || '';
  field.append(input, label);

  const remember = el('div', 'nav-signin-remember');
  const check = el('input', '', { type: 'checkbox', id: 'nav-signin-remember' });
  const checkLabel = el('label', '', { for: 'nav-signin-remember' });
  checkLabel.textContent = rememberLabel || '';
  remember.append(check, checkLabel);

  const submit = el('button', 'nav-signin-submit', { type: 'submit' });
  submit.textContent = submitLabel || '';

  const info = el('p', 'nav-signin-info');
  info.textContent = section.querySelector(':scope > p')?.textContent.trim() || '';
  const help = section.querySelector(':scope > ul');
  if (help) help.className = 'nav-signin-help';

  try {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      input.value = saved;
      check.checked = true;
    }
  } catch (e) {
    // storage unavailable
  }
  form.addEventListener('submit', () => {
    try {
      if (check.checked) localStorage.setItem(REMEMBER_KEY, input.value);
      else localStorage.removeItem(REMEMBER_KEY);
    } catch (e) {
      // storage unavailable
    }
  });

  const close = el('button', 'nav-signin-close nav-mobile-only', { type: 'button', 'aria-label': 'Close' });
  content.append(close, heading, field, remember, submit, info);
  if (help) content.append(help);
  form.append(content);
  return form;
}

function buildTools(section, signInSection, appLink, nav) {
  const tools = el('div', 'nav-tools');
  const links = [...section.querySelectorAll('a')];
  const signInLink = links.pop();
  links.forEach((link) => {
    link.className = 'nav-tools-link';
    tools.append(link);
  });
  let signIn = null;
  if (signInLink) {
    const scope = el('div', 'nav-signin', { 'data-toggle-scope': '' });
    const toggle = el('button', 'nav-signin-toggle', {
      type: 'button', 'aria-expanded': 'false', 'aria-controls': 'nav-signin-panel', 'data-toggle': '',
    });
    toggle.textContent = signInLink.textContent.trim();
    scope.append(toggle);
    if (signInSection) {
      const panel = buildSignInPanel(signInSection, signInLink.getAttribute('href'));
      if (appLink) {
        appLink.className = 'nav-signin-app nav-mobile-only';
        panel.append(appLink);
      }
      scope.append(panel);
      panel.querySelector('.nav-signin-close')?.addEventListener('click', () => {
        setToggle(scope, toggle, false);
        toggle.focus();
      });
    }
    toggle.addEventListener('click', () => {
      const open = !scope.classList.contains('is-open');
      closeMenus(nav);
      if (open && !DESKTOP.matches && nav.getAttribute('aria-expanded') === 'true') {
        nav.querySelector('.nav-hamburger')?.click();
      }
      setToggle(scope, toggle, open);
    });
    signIn = scope;
  }
  return { tools, signIn };
}

function buildMobileExtras(section, nav) {
  if (!section) return {};
  const [quickList, moreList] = directChildren(section, 'ul');
  const [mainHeading, moreHeading] = directChildren(section, 'h2').map((h) => {
    const heading = el('p', 'nav-mobile-heading nav-mobile-only');
    heading.textContent = h.textContent.trim();
    return heading;
  });
  const paragraphs = directChildren(section, 'p');
  const appLink = paragraphs.map((p) => p.querySelector('a')).find(Boolean) || null;
  const closeLabel = paragraphs.find((p) => !p.querySelector('a'))?.textContent.trim();

  let quick = null;
  if (quickList) {
    quick = el('div', 'nav-mobile-quick nav-mobile-only');
    quickList.className = 'nav-mobile-quick-links';
    const searchToggle = nav.querySelector('.nav-search-toggle');
    if (searchToggle) {
      const li = el('li', 'nav-mobile-search-item');
      const button = el('button', 'nav-mobile-search-toggle', {
        type: 'button',
        'aria-expanded': 'false',
        'aria-controls': 'nav-search-panel',
        'aria-label': searchToggle.getAttribute('aria-label'),
      });
      button.addEventListener('click', () => {
        const open = !nav.classList.contains('is-search-open');
        setToggle(nav, button, open, 'is-search-open');
        if (open) nav.querySelector('.nav-search-input')?.focus();
      });
      li.append(button);
      quickList.append(li);
    }
    quick.append(quickList);
  }
  if (moreList) moreList.className = 'nav-mobile-more nav-mobile-only';

  let close = null;
  if (closeLabel) {
    close = el('button', 'nav-mobile-close nav-mobile-only', { type: 'button' });
    close.textContent = closeLabel;
  }
  return {
    quick, mainHeading, moreHeading, moreList, appLink, close,
  };
}

/* ---------- decorate ---------- */

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNavFragment();
  block.textContent = '';
  if (!fragment) return;

  const sections = directChildren(fragment, 'div');
  const [utilitySection, brandSection, menuSection, toolsSection, signInSection,
    mobileSection] = sections;

  const nav = el('nav', 'nav', { id: 'nav', 'aria-label': 'Main' });
  nav.setAttribute('aria-expanded', 'false');

  const main = el('div', 'nav-main');
  const mainInner = el('div', 'nav-main-inner');
  const hamburger = el('button', 'nav-hamburger', {
    type: 'button', 'aria-controls': 'nav-menu', 'aria-expanded': 'false', 'aria-label': 'Open navigation',
  });
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';
  const menu = el('div', 'nav-menu', { id: 'nav-menu' });

  if (utilitySection) nav.append(buildUtility(utilitySection, nav));
  const mobile = buildMobileExtras(mobileSection, nav);

  if (brandSection) mainInner.append(buildBrand(brandSection));
  if (mobile.quick) menu.append(mobile.quick);
  if (mobile.mainHeading) menu.append(mobile.mainHeading);
  if (menuSection) menu.append(buildMenus(menuSection, nav));
  if (mobile.moreHeading) menu.append(mobile.moreHeading);
  if (mobile.moreList) menu.append(mobile.moreList);
  const { tools, signIn } = toolsSection
    ? buildTools(toolsSection, signInSection, mobile.appLink, nav) : {};
  if (tools) menu.append(tools);
  if (mobile.close) menu.append(mobile.close);
  mainInner.append(menu);
  if (signIn) mainInner.append(signIn);
  mainInner.append(hamburger);
  main.append(mainInner);

  nav.append(main);
  markExternal(nav);

  const setMobileMenu = (open) => {
    nav.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.style.overflowY = open && !DESKTOP.matches ? 'hidden' : '';
    if (!open) closeAll(nav);
  };
  mobile.close?.addEventListener('click', () => {
    setMobileMenu(false);
    hamburger.focus();
  });

  hamburger.addEventListener('click', () => {
    const open = nav.getAttribute('aria-expanded') !== 'true';
    if (open && signIn) setToggle(signIn, signIn.querySelector('[data-toggle]'), false);
    setMobileMenu(open);
  });

  // close on Escape / outside click / focus loss
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    closeAll(nav);
    const searchToggle = nav.querySelector('.nav-search-toggle');
    if (searchToggle) setToggle(nav, searchToggle, false, 'is-search-open');
  });
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      closeAll(nav);
    } else {
      nav.querySelectorAll('[data-toggle-scope].is-open').forEach((scope) => {
        if (!scope.contains(e.target)) setToggle(scope, scope.querySelector('[data-toggle]'), false);
      });
    }
  });

  // compact header once the utility bar has scrolled away
  const wrapper = el('div', 'nav-wrapper');
  const onScroll = () => wrapper.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // reset state when crossing the desktop breakpoint
  DESKTOP.addEventListener('change', () => {
    closeAll(nav);
    nav.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open navigation');
    document.body.style.overflowY = '';
    const searchToggle = nav.querySelector('.nav-search-toggle');
    if (searchToggle) setToggle(nav, searchToggle, false, 'is-search-open');
  });

  wrapper.append(nav);
  block.append(wrapper);
}
