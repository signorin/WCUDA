/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-awards. Base: cards. Source: https://www.wingscu.com/
 * Source selector: .column-content.block — two sibling containers under one
 * .rpt-block (3 awards + 2 awards) that render as a single awards grid.
 *
 * Merge behaviour: on the first container, collect every .awards item from all
 * .column-content.block containers in the parent .rpt-block, emit ONE block,
 * and remove the other containers. When invoked on a container that has already
 * been removed (or is not the first in its group), do nothing.
 * Output: one row per award: [badge img | H3 title, caption <p>].
 */
export default function parse(element, { document }) {
  // Already removed by the first instance's merge -> skip
  if (!element.parentNode || element.dataset.cardsAwardsMerged === 'true') return;

  const group = element.closest('.rpt-block') || element.parentElement;
  let containers = [...group.querySelectorAll('.column-content.block')];
  if (!containers.includes(element)) containers = [element];
  // Only the first container in the group emits the block
  if (containers[0] !== element) return;

  const cells = [];
  containers.forEach((container) => {
    container.querySelectorAll('.awards').forEach((award) => {
      const img = award.querySelector('img');
      const heading = award.querySelector('h3, h2, h4');
      const body = [];
      if (heading && heading.textContent.trim()) {
        const h3 = document.createElement('h3');
        h3.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
        body.push(h3);
      }
      [...award.querySelectorAll(':scope > p')].forEach((p) => {
        if (p.querySelector('img')) return; // badge paragraph
        if (!p.textContent.trim()) return;
        body.push(p);
      });
      if (!img && !body.length) return;
      cells.push([img || '', body]);
    });
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Remove the other containers so they are not imported twice
  containers.slice(1).forEach((c) => {
    c.dataset.cardsAwardsMerged = 'true';
    c.remove();
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-awards', cells });
  element.replaceWith(block);
}
