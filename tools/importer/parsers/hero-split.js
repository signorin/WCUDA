/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-split. Base: hero. Source: https://www.wingscu.com/
 * Source selector: .block.home-hero-block
 * Output: Row 1 = side image; Row 2 = H1 (keeps <sup>), description <p>, CTA link.
 * Image: img inside .image (prefers the one with alt), falling back to the
 * background-image url() in the block's inline <style>.
 */
const ORIGIN = 'https://www.wingscu.com';

function bgImageFromStyles(element, document) {
  const sources = [...element.querySelectorAll('style')].map((s) => s.textContent);
  element.querySelectorAll('[style*="background"]').forEach((el) => sources.push(el.getAttribute('style')));
  if (element.getAttribute('style')) sources.push(element.getAttribute('style'));
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
  const content = element.querySelector('.content') || element;

  // Image
  const imgs = [...element.querySelectorAll('.image img')];
  let image = imgs.find((i) => i.getAttribute('alt')) || imgs[0] || null;
  if (!image) image = bgImageFromStyles(element, document);

  // Heading (keep inline markup such as <sup>)
  const heading = content.querySelector('h1, h2, .title');
  if (heading) {
    heading.innerHTML = heading.innerHTML.trim();
  }

  // Description: non-empty text divs/paragraphs (skip &nbsp; spacers)
  const descriptions = [];
  content.querySelectorAll(':scope > div, :scope > p').forEach((node) => {
    if (node.querySelector('a.btn')) return;
    const text = (node.textContent || '').replace(/ /g, ' ').trim();
    if (!text) return;
    const p = document.createElement('p');
    p.innerHTML = node.innerHTML.trim();
    descriptions.push(p);
  });

  // CTA(s)
  const ctas = [...content.querySelectorAll('a.btn')].map((a) => {
    const p = document.createElement('p');
    p.append(a);
    return p;
  });

  if (!heading && !descriptions.length && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (image) cells.push([image]);
  const contentCell = [];
  if (heading) contentCell.push(heading);
  contentCell.push(...descriptions, ...ctas);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-split', cells });
  element.replaceWith(block);
}
