import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * EDS image-optimization params only apply to same-origin media; leave cross-origin
 * (not yet ingested) images as authored instead of emitting malformed query strings.
 * @param {HTMLImageElement} img
 * @returns {boolean}
 */
function isOptimizable(img) {
  try {
    return new URL(img.src, window.location.href).origin === window.location.origin;
  } catch (e) {
    return false;
  }
}

/**
 * cards-icon: grid of feature cards — icon, title, description, arrow link.
 * Authored as one row per card: [icon image | H3 title, description, link].
 * Tolerates a missing icon cell, a single combined cell, or a missing link.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-icon-card';

    const icon = document.createElement('div');
    icon.className = 'cards-icon-card-icon';
    const body = document.createElement('div');
    body.className = 'cards-icon-card-body';

    [...row.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      if (pic && cell.textContent.trim() === '' && !icon.querySelector('picture')) {
        icon.append(pic);
      } else {
        body.append(...cell.childNodes);
      }
    });

    // the last link in the body is the card's arrow link
    const links = body.querySelectorAll('a');
    const link = links[links.length - 1];
    if (link) {
      const holder = link.closest('p') || link;
      holder.classList.add('cards-icon-card-link');
      link.classList.remove('button', 'primary', 'secondary');
      link.closest('.button-container')?.classList.remove('button-container');
      if (!link.getAttribute('aria-label')) {
        const title = body.querySelector('h1, h2, h3, h4, h5, h6');
        link.setAttribute('aria-label', (title || link).textContent.trim());
      }
    }

    if (icon.querySelector('picture')) li.append(icon);
    li.append(body);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    if (!isOptimizable(img)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]));
  });

  block.replaceChildren(ul);
}
