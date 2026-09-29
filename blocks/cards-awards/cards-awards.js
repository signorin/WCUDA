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
 * cards-awards: centered, wrapping grid of award badges (3 per row on desktop, a short
 * final row stays centered). Authored as one row per award: [badge image | H3 title, caption].
 * Tolerates a missing badge, a single combined cell, or a missing caption.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-awards-card';

    const badge = document.createElement('div');
    badge.className = 'cards-awards-card-badge';
    const body = document.createElement('div');
    body.className = 'cards-awards-card-body';

    [...row.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      if (pic && cell.textContent.trim() === '' && !badge.querySelector('picture')) {
        badge.append(pic);
      } else {
        body.append(...cell.childNodes);
      }
    });

    if (badge.querySelector('picture')) li.append(badge);
    if (body.textContent.trim() || body.children.length) li.append(body);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    if (!isOptimizable(img)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '300' }]));
  });

  block.replaceChildren(ul);
}
