/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-callout. Base: hero. Source: https://www.wingscu.com/
 * Source selector: .block.callout
 * Output: Row 1 = background image; Row 2 = H2, paragraph,
 *   <strong>primary CTA</strong>, <em>secondary CTA</em>.
 * Image: the live DOM has no <img>; the photo is a background-image url() in the
 * block's inline <style> (#section-xxx{background-image:url(/getmedia/.../img)}).
 * It is resolved to an absolute https://www.wingscu.com URL. A direct-child <img>
 * (present in scraped/cleaned HTML) is used when available.
 */
const ORIGIN = 'https://www.wingscu.com';

function bgImageFromStyles(element, document) {
  const sources = [...element.querySelectorAll('style')].map((s) => s.textContent);
  if (element.getAttribute('style')) sources.push(element.getAttribute('style'));
  element.querySelectorAll('[style*="background"]').forEach((el) => sources.push(el.getAttribute('style')));
  for (const css of sources) {
    const m = /background(?:-image)?\s*:[^;{}]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i.exec(css || '');
    if (m) {
      const img = document.createElement('img');
      try { img.src = new URL(m[1], ORIGIN).href; } catch (e) { img.src = m[1]; }
      return img;
    }
  }
  return null;
}

export default function parse(element, { document }) {
  const image = element.querySelector(':scope > img')
    || element.querySelector(':scope > picture img')
    || bgImageFromStyles(element, document);

  const content = element.querySelector('.content') || element;
  const heading = content.querySelector('h2, h1, h3');

  const paragraphs = [];
  content.querySelectorAll(':scope > p').forEach((p) => {
    if (p.classList.contains('button-holder') || p.querySelector('a.btn')) return;
    if (!p.textContent.replace(/ /g, ' ').trim()) return;
    const np = document.createElement('p');
    np.textContent = p.textContent.replace(/\s+/g, ' ').trim();
    paragraphs.push(np);
  });

  const ctas = [];
  content.querySelectorAll('a.btn').forEach((a) => {
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.trim();
    const wrap = document.createElement(a.classList.contains('btn-secondary') ? 'em' : 'strong');
    wrap.append(link);
    const p = document.createElement('p');
    p.append(wrap);
    ctas.push(p);
  });

  if (!heading && !paragraphs.length && !ctas.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (image) cells.push([image]);
  const contentCell = [];
  if (heading) contentCell.push(heading);
  contentCell.push(...paragraphs, ...ctas);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-callout', cells });
  element.replaceWith(block);
}
