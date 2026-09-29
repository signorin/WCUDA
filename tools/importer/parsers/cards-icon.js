/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-icon. Base: cards. Source: https://www.wingscu.com/
 * Source selector: .block.icon-grid .gis (6 x .gi items)
 * Output: one row per card: [icon img | H3 title, description <p>, text link].
 * The source .lnk anchor only wraps an arrow image, so a new text link is
 * created using the card title (with <br> stripped) as its label.
 */
export default function parse(element, { document }) {
  let items = [...element.querySelectorAll(':scope > .gi')];
  if (!items.length) items = [...element.querySelectorAll('.gi')];

  const cells = [];
  items.forEach((item) => {
    const icon = item.querySelector('.icon img') || item.querySelector(':scope > img');
    const srcHeading = item.querySelector('h3, h2, h4');
    const titleText = srcHeading
      ? srcHeading.textContent.replace(/\s+/g, ' ').trim()
      : '';

    const body = [];
    if (titleText) {
      const h3 = document.createElement('h3');
      h3.textContent = titleText;
      body.push(h3);
    }

    const desc = item.querySelector('.desc');
    if (desc && desc.textContent.trim()) {
      const p = document.createElement('p');
      p.innerHTML = desc.innerHTML.trim();
      body.push(p);
    }

    const srcLink = item.querySelector('.lnk a[href]') || item.querySelector('a[href]');
    if (srcLink) {
      const a = document.createElement('a');
      a.href = srcLink.getAttribute('href');
      const label = titleText
        || (srcLink.getAttribute('title') || '').replace(/<br\s*\/?>/gi, '').trim()
        || srcLink.textContent.trim();
      a.textContent = label;
      const p = document.createElement('p');
      p.append(a);
      body.push(p);
    }

    if (!icon && !body.length) return;
    cells.push([icon || '', body]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-icon', cells });
  element.replaceWith(block);
}
