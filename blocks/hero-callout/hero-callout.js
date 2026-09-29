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
 * hero-callout: full-bleed background photo with a content box overlaid on the left
 * (heading, text, primary + secondary CTA). Used mid/bottom of page as a CTA banner.
 * Authored as: Row 1 background image; Row 2 H2, paragraph, **primary CTA**, _secondary CTA_.
 * Tolerates image/text in any row order, a missing image, or extra cells.
 * @param {Element} block
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'hero-callout-media';
  const box = document.createElement('div');
  box.className = 'hero-callout-content';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      if (pic && cell.textContent.trim() === '' && !media.querySelector('picture')) {
        media.append(pic);
      } else {
        box.append(...cell.childNodes);
      }
    });
  });

  box.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('picture, img, a')) p.remove();
  });

  // group consecutive CTA paragraphs so they can be laid out together
  const ctaParas = [...box.querySelectorAll(':scope > p')].filter((p) => {
    const a = p.querySelector('a');
    return a && p.textContent.trim() === a.textContent.trim();
  });
  if (ctaParas.length) {
    const actions = document.createElement('div');
    actions.className = 'hero-callout-actions';
    ctaParas[0].before(actions);
    actions.append(...ctaParas);
  }

  const img = media.querySelector('picture > img');
  if (img && isOptimizable(img)) {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [
      { media: '(min-width: 900px)', width: '2000' },
      { width: '900' },
    ]));
  }

  const inner = document.createElement('div');
  inner.className = 'hero-callout-inner';
  inner.append(box);

  const children = [];
  if (media.querySelector('picture')) children.push(media);
  else block.classList.add('hero-callout-no-image');
  children.push(inner);
  block.replaceChildren(...children);
}
