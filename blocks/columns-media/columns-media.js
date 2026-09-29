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
 * columns-media: image + text side by side. Authored as 1 row x 2 cells —
 * [image | H2, text, CTA] or [H2, text | image]; image side follows authored order.
 * Tolerates extra rows (each rendered as its own media row) and text-only rows.
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-media-row');
    const cells = [...row.children];
    cells.forEach((cell, idx) => {
      const pic = cell.querySelector('picture');
      if (pic && cell.textContent.trim() === '') {
        cell.classList.add('columns-media-img-col');
        if (idx > 0) row.classList.add('columns-media-img-right');
      } else {
        cell.classList.add('columns-media-text-col');
      }
    });
    if (!row.querySelector('.columns-media-img-col')) row.classList.add('columns-media-no-image');
  });

  block.querySelectorAll('.columns-media-img-col picture > img').forEach((img) => {
    if (!isOptimizable(img)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [
      { media: '(min-width: 600px)', width: '900' },
      { width: '600' },
    ]));
  });
}
