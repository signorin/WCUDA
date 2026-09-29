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
 * hero-split: 50/50 split hero — text panel (heading, text, CTA) + large side image.
 * Authored as: Row 1 image; Row 2 heading, paragraph, CTA link.
 * Tolerates the image and text in any row/cell order, a missing image, or extra cells.
 * @param {Element} block
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'hero-split-media';
  const content = document.createElement('div');
  content.className = 'hero-split-content';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      const imageOnly = pic && cell.textContent.trim() === '';
      if (imageOnly && !media.querySelector('picture')) {
        media.append(pic);
      } else {
        content.append(...cell.childNodes);
      }
    });
  });

  // drop empty paragraphs left over from authoring
  content.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('picture, img, a')) p.remove();
  });

  const img = media.querySelector('picture > img');
  if (img && isOptimizable(img)) {
    const optimized = createOptimizedPicture(img.src, img.alt, true, [
      { media: '(min-width: 900px)', width: '1600' },
      { width: '900' },
    ]);
    img.closest('picture').replaceWith(optimized);
  }

  const children = [content];
  if (media.querySelector('picture')) children.push(media);
  else block.classList.add('hero-split-no-image');
  block.replaceChildren(...children);
}
