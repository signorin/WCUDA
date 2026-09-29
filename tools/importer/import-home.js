/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroSplitParser from './parsers/hero-split.js';
import cardsIconParser from './parsers/cards-icon.js';
import columnsMediaParser from './parsers/columns-media.js';
import carouselTestimonialParser from './parsers/carousel-testimonial.js';
import cardsAwardsParser from './parsers/cards-awards.js';
import heroCalloutParser from './parsers/hero-callout.js';

// TRANSFORMER IMPORTS
import wingscuCleanupTransformer from './transformers/wingscu-cleanup.js';
import wingscuSectionsTransformer from './transformers/wingscu-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-split': heroSplitParser,
  'cards-icon': cardsIconParser,
  'columns-media': columnsMediaParser,
  'carousel-testimonial': carouselTestimonialParser,
  'cards-awards': cardsAwardsParser,
  'hero-callout': heroCalloutParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'home',
  description: 'Wings Credit Union homepage: split hero, product icon grid, promo sections, testimonials carousel, awards and membership callout',
  urls: [
    'https://www.wingscu.com/',
  ],
  blocks: [
    { name: 'hero-split', instances: ['.block.home-hero-block'] },
    { name: 'cards-icon', instances: ['.block.icon-grid .gis'] },
    { name: 'columns-media', instances: ['.block.content-text'] },
    { name: 'carousel-testimonial', instances: ['.block.testimonials .quote-wrapper'] },
    { name: 'cards-awards', instances: ['.column-content.block'] },
    { name: 'hero-callout', instances: ['.block.callout'] },
  ],
  sections: [
    {
      id: '1', name: 'hero', selector: ['.block.home-hero-block'], style: null, blocks: ['hero-split'], defaultContent: [],
    },
    {
      id: '2', name: 'product-icon-grid', selector: ['.block.icon-grid'], style: null, blocks: ['cards-icon'], defaultContent: ['.block.icon-grid .block-intro'],
    },
    {
      id: '3', name: 'hunger-action-month', selector: ['.rpt-block:has(> .block.headline-text.light-gray-bg)', '.block.headline-text.light-gray-bg'], style: 'light-grey', blocks: [], defaultContent: ['.block.headline-text.light-gray-bg .block-intro'],
    },
    {
      id: '4', name: 'medicare-promo', selector: ['.rpt-block:has(.block.content-text.theme-breeze)', '.block.content-text.theme-breeze'], style: 'dark', blocks: ['columns-media'], defaultContent: [],
    },
    {
      id: '5', name: 'social-follow-promo', selector: ['.rpt-block:has(.block.content-text.theme-cream-small-arrow)', '.block.content-text.theme-cream-small-arrow'], style: 'cream', blocks: ['columns-media'], defaultContent: [],
    },
    {
      id: '6', name: 'testimonials', selector: ['.block.testimonials'], style: null, blocks: ['carousel-testimonial'], defaultContent: ['.block.testimonials .block-intro'],
    },
    {
      id: '7', name: 'awards', selector: ['.rpt-block:has(> .column-content.block)'], style: null, blocks: ['cards-awards'], defaultContent: ['.block.headline-text.white-bg .block-intro'],
    },
    {
      id: '8', name: 'membership-callout', selector: ['.block.callout'], style: null, blocks: ['hero-callout'], defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY - section transformer runs after cleanup
const transformers = [
  wingscuCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [wingscuSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Initial cleanup + section breaks
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements detached by an earlier parser, e.g. merged cards-awards)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup + section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root URL maps to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
