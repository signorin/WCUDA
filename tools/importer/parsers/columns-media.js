/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-media. Base: columns. Source: https://www.wingscu.com/
 * Source selector: .block.content-text (2 instances)
 * Output: 1 row x 2 cells. The block renders the image on the side it is
 * authored in, so cells are emitted in visual order:
 *   - default (e.g. theme-breeze): image on the left  -> [image | content]
 *   - .image-right:                image on the right -> [content | image]
 * (Source DOM order is .content then .image for both; side is driven by the class.)
 */
export default function parse(element, { document }) {
  const contentEl = element.querySelector('.content') || element.querySelector('.wrap > div');
  const imageEl = element.querySelector('.image img') || element.querySelector('img');

  const contentCell = [];
  if (contentEl) {
    [...contentEl.children].forEach((child) => {
      const text = (child.textContent || '').replace(/ /g, ' ').trim();
      if (!text && !child.querySelector('img, a')) return;
      contentCell.push(child);
    });
  }

  if (!contentCell.length && !imageEl) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const imageRight = element.classList.contains('image-right');
  const imageCell = imageEl || '';
  const row = imageRight ? [contentCell, imageCell] : [imageCell, contentCell];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells: [row] });
  element.replaceWith(block);
}
