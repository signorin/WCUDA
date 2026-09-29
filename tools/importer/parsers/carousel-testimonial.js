/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-testimonial. Base: carousel. Source: https://www.wingscu.com/
 * Source selector: .block.testimonials .quote-wrapper (4 x .testimonial slides)
 * Output: one row per slide:
 *   [optional member photo | quote <p>, <p><strong>name</strong></p>, <p>member-since</p>]
 * Slide controls (.controls prev/next/dots) are ignored.
 */
export default function parse(element, { document }) {
  let slides = [...element.querySelectorAll('.testimonials-wrap > .testimonial')];
  if (!slides.length) slides = [...element.querySelectorAll('.testimonial')];

  const cells = [];
  slides.forEach((slide) => {
    const img = slide.querySelector('.image img');

    const content = [];
    // Prefer the <blockquote>; fall back to the .quotation wrapper. Emit plain <p>.
    const quote = slide.querySelector('blockquote') || slide.querySelector('.quotation');
    if (quote && quote.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = quote.textContent.replace(/\s+/g, ' ').trim();
      content.push(p);
    }

    const primary = slide.querySelector('.citation .primary');
    if (primary && primary.textContent.trim()) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = primary.textContent.trim();
      p.append(strong);
      content.push(p);
    }

    const secondary = slide.querySelector('.citation .secondary');
    if (secondary && secondary.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = secondary.textContent.trim();
      content.push(p);
    }

    if (!content.length && !img) return;
    cells.push([img || '', content]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-testimonial', cells });
  element.replaceWith(block);
}
