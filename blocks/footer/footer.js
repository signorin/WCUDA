/*
 * Footer block.
 *
 * Copy, links and images come from the footer fragment (/content/footer.plain.html
 * locally, /footer.plain.html on DA/EDS). Sections are read in order:
 *   1. legal links (plain list items are static text, e.g. the routing number)
 *   2. social links (icon images)
 *   3. notices (paragraphs)
 *   4. certifications (badge links, text, privacy-choices link)
 *   5. copyright
 * Links pointing to "#cookie-preferences" / "#do-not-sell" open the consent
 * manager's preference center when one is present on the page.
 */

const CONSENT_HASHES = ['#cookie-preferences', '#do-not-sell'];

async function tryFetch(request, path) {
  try {
    const resp = await request;
    if (resp.ok) return { resp, path };
  } catch (e) {
    // network error: fall through to the next location
  }
  return null;
}

async function fetchFooterFragment() {
  // metadata-independent: /content first (localhost), then root (DA/EDS prod)
  let found = await tryFetch(fetch('/content/footer.plain.html'), '/content/footer.plain.html');
  if (!found) found = await tryFetch(fetch('/footer.plain.html'), '/footer.plain.html');
  if (!found) return null;

  const fragment = document.createElement('div');
  fragment.innerHTML = await found.resp.text();
  const main = fragment.querySelector('main');
  if (main) fragment.replaceChildren(...main.children);

  // resolve relative image paths against the fragment location
  const base = new URL(found.resp.url || found.path, window.location.href);
  fragment.querySelectorAll('img[src]').forEach((img) => {
    try {
      img.src = new URL(img.getAttribute('src'), base).href;
    } catch (e) {
      // leave the src as authored
    }
  });
  return fragment;
}

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function decorateList(list, className) {
  if (!list) return null;
  list.className = className;
  [...list.children].forEach((li) => {
    if (!li.querySelector('a')) li.classList.add('footer-static');
  });
  return list;
}

function openConsentManager(e) {
  // the hash is only a marker; never jump the page
  e.preventDefault();
  const tru = window.truste?.eu;
  if (tru && typeof tru.clickListener === 'function') tru.clickListener();
  else if (window.OneTrust?.ToggleInfoDisplay) window.OneTrust.ToggleInfoDisplay();
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooterFragment();
  block.textContent = '';
  if (!fragment) return;

  const [legal, social, notices, certs, copyright] = [...fragment.children]
    .filter((child) => child.tagName === 'DIV');

  const inner = el('div', 'footer-inner');

  const top = el('div', 'footer-top');
  const legalList = decorateList(legal?.querySelector('ul'), 'footer-legal');
  if (legalList) top.append(legalList);
  const socialList = decorateList(social?.querySelector('ul'), 'footer-social');
  if (socialList) {
    // icons render as decorative backgrounds (as on the source); the link keeps the name
    socialList.querySelectorAll('a').forEach((a) => {
      const img = a.querySelector('img');
      if (!img) return;
      a.setAttribute('aria-label', img.alt);
      const icon = el('span', 'footer-social-icon');
      icon.style.backgroundImage = `url("${img.src}")`;
      img.replaceWith(icon);
    });
    top.append(socialList);
  }
  inner.append(top);

  if (notices) {
    const notes = el('div', 'footer-notices');
    notes.append(...notices.querySelectorAll(':scope > p'));
    inner.append(notes);
  }

  const bottom = el('div', 'footer-bottom');
  const certList = decorateList(certs?.querySelector('ul'), 'footer-certs');
  if (certList) {
    certList.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; });
    bottom.append(certList);
  }
  if (copyright) {
    const copy = el('p', 'footer-copyright');
    copy.textContent = copyright.textContent.trim();
    bottom.append(copy);
  }
  inner.append(bottom);

  inner.querySelectorAll('a[href]').forEach((a) => {
    const hash = a.getAttribute('href');
    if (CONSENT_HASHES.includes(hash)) {
      if (a.closest('.footer-certs')) {
        // privacy choices is an action, not a destination: render it as a button
        const button = el('button', 'footer-consent-link footer-consent-button');
        button.type = 'button';
        button.textContent = a.textContent;
        button.addEventListener('click', openConsentManager);
        a.replaceWith(button);
        return;
      }
      a.classList.add('footer-consent-link');
      a.setAttribute('role', 'button');
      a.addEventListener('click', openConsentManager);
    }
    if (a.target === '_blank') a.rel = 'noopener';
  });

  block.append(inner);
}
