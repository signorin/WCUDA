/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-split.js
  var ORIGIN = "https://www.wingscu.com";
  function bgImageFromStyles(element, document2) {
    const sources = [...element.querySelectorAll("style")].map((s) => s.textContent);
    element.querySelectorAll('[style*="background"]').forEach((el) => sources.push(el.getAttribute("style")));
    if (element.getAttribute("style")) sources.push(element.getAttribute("style"));
    for (const css of sources) {
      const m = /background(?:-image)?\s*:[^;{}]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i.exec(css || "");
      if (m) {
        const img = document2.createElement("img");
        try {
          img.src = new URL(m[1], ORIGIN).href;
        } catch (e) {
          img.src = m[1];
        }
        return img;
      }
    }
    return null;
  }
  function parse(element, { document: document2 }) {
    const content = element.querySelector(".content") || element;
    const imgs = [...element.querySelectorAll(".image img")];
    let image = imgs.find((i) => i.getAttribute("alt")) || imgs[0] || null;
    if (!image) image = bgImageFromStyles(element, document2);
    const heading = content.querySelector("h1, h2, .title");
    if (heading) {
      heading.innerHTML = heading.innerHTML.trim();
    }
    const descriptions = [];
    content.querySelectorAll(":scope > div, :scope > p").forEach((node) => {
      if (node.querySelector("a.btn")) return;
      const text = (node.textContent || "").replace(/ /g, " ").trim();
      if (!text) return;
      const p = document2.createElement("p");
      p.innerHTML = node.innerHTML.trim();
      descriptions.push(p);
    });
    const ctas = [...content.querySelectorAll("a.btn")].map((a) => {
      const p = document2.createElement("p");
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
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-split", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-icon.js
  function parse2(element, { document: document2 }) {
    let items = [...element.querySelectorAll(":scope > .gi")];
    if (!items.length) items = [...element.querySelectorAll(".gi")];
    const cells = [];
    items.forEach((item) => {
      const icon = item.querySelector(".icon img") || item.querySelector(":scope > img");
      const srcHeading = item.querySelector("h3, h2, h4");
      const titleText = srcHeading ? srcHeading.textContent.replace(/\s+/g, " ").trim() : "";
      const body = [];
      if (titleText) {
        const h3 = document2.createElement("h3");
        h3.textContent = titleText;
        body.push(h3);
      }
      const desc = item.querySelector(".desc");
      if (desc && desc.textContent.trim()) {
        const p = document2.createElement("p");
        p.innerHTML = desc.innerHTML.trim();
        body.push(p);
      }
      const srcLink = item.querySelector(".lnk a[href]") || item.querySelector("a[href]");
      if (srcLink) {
        const a = document2.createElement("a");
        a.href = srcLink.getAttribute("href");
        const label = titleText || (srcLink.getAttribute("title") || "").replace(/<br\s*\/?>/gi, "").trim() || srcLink.textContent.trim();
        a.textContent = label;
        const p = document2.createElement("p");
        p.append(a);
        body.push(p);
      }
      if (!icon && !body.length) return;
      cells.push([icon || "", body]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-icon", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  function parse3(element, { document: document2 }) {
    const contentEl = element.querySelector(".content") || element.querySelector(".wrap > div");
    const imageEl = element.querySelector(".image img") || element.querySelector("img");
    const contentCell = [];
    if (contentEl) {
      [...contentEl.children].forEach((child) => {
        const text = (child.textContent || "").replace(/ /g, " ").trim();
        if (!text && !child.querySelector("img, a")) return;
        contentCell.push(child);
      });
    }
    if (!contentCell.length && !imageEl) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const imageRight = element.classList.contains("image-right");
    const imageCell = imageEl || "";
    const row = imageRight ? [contentCell, imageCell] : [imageCell, contentCell];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-media", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-testimonial.js
  function parse4(element, { document: document2 }) {
    let slides = [...element.querySelectorAll(".testimonials-wrap > .testimonial")];
    if (!slides.length) slides = [...element.querySelectorAll(".testimonial")];
    const cells = [];
    slides.forEach((slide) => {
      const img = slide.querySelector(".image img");
      const content = [];
      const quote = slide.querySelector("blockquote") || slide.querySelector(".quotation");
      if (quote && quote.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = quote.textContent.replace(/\s+/g, " ").trim();
        content.push(p);
      }
      const primary = slide.querySelector(".citation .primary");
      if (primary && primary.textContent.trim()) {
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        strong.textContent = primary.textContent.trim();
        p.append(strong);
        content.push(p);
      }
      const secondary = slide.querySelector(".citation .secondary");
      if (secondary && secondary.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = secondary.textContent.trim();
        content.push(p);
      }
      if (!content.length && !img) return;
      cells.push([img || "", content]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-testimonial", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-awards.js
  function parse5(element, { document: document2 }) {
    if (!element.parentNode || element.dataset.cardsAwardsMerged === "true") return;
    const group = element.closest(".rpt-block") || element.parentElement;
    let containers = [...group.querySelectorAll(".column-content.block")];
    if (!containers.includes(element)) containers = [element];
    if (containers[0] !== element) return;
    const cells = [];
    containers.forEach((container) => {
      container.querySelectorAll(".awards").forEach((award) => {
        const img = award.querySelector("img");
        const heading = award.querySelector("h3, h2, h4");
        const body = [];
        if (heading && heading.textContent.trim()) {
          const h3 = document2.createElement("h3");
          h3.textContent = heading.textContent.replace(/\s+/g, " ").trim();
          body.push(h3);
        }
        [...award.querySelectorAll(":scope > p")].forEach((p) => {
          if (p.querySelector("img")) return;
          if (!p.textContent.trim()) return;
          body.push(p);
        });
        if (!img && !body.length) return;
        cells.push([img || "", body]);
      });
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    containers.slice(1).forEach((c) => {
      c.dataset.cardsAwardsMerged = "true";
      c.remove();
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-awards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-callout.js
  var ORIGIN2 = "https://www.wingscu.com";
  function bgImageFromStyles2(element, document2) {
    const sources = [...element.querySelectorAll("style")].map((s) => s.textContent);
    if (element.getAttribute("style")) sources.push(element.getAttribute("style"));
    element.querySelectorAll('[style*="background"]').forEach((el) => sources.push(el.getAttribute("style")));
    for (const css of sources) {
      const m = /background(?:-image)?\s*:[^;{}]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i.exec(css || "");
      if (m) {
        const img = document2.createElement("img");
        try {
          img.src = new URL(m[1], ORIGIN2).href;
        } catch (e) {
          img.src = m[1];
        }
        return img;
      }
    }
    return null;
  }
  function parse6(element, { document: document2 }) {
    const image = element.querySelector(":scope > img") || element.querySelector(":scope > picture img") || bgImageFromStyles2(element, document2);
    const content = element.querySelector(".content") || element;
    const heading = content.querySelector("h2, h1, h3");
    const paragraphs = [];
    content.querySelectorAll(":scope > p").forEach((p) => {
      if (p.classList.contains("button-holder") || p.querySelector("a.btn")) return;
      if (!p.textContent.replace(/ /g, " ").trim()) return;
      const np = document2.createElement("p");
      np.textContent = p.textContent.replace(/\s+/g, " ").trim();
      paragraphs.push(np);
    });
    const ctas = [];
    content.querySelectorAll("a.btn").forEach((a) => {
      const link = document2.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = a.textContent.trim();
      const wrap = document2.createElement(a.classList.contains("btn-secondary") ? "em" : "strong");
      wrap.append(link);
      const p = document2.createElement("p");
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
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-callout", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wingscu-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function isEmptyDiv(div) {
    if (div.children.length > 0) return false;
    const text = (div.textContent || "").replace(/ /g, " ").trim();
    return text === "";
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#consent-banner",
        "#truste-consent-track",
        ".trustarc-banner-wrapper",
        "#salemove",
        "#sm-visitor-app-container",
        "#nuanMessagingFrame",
        "#external-link-modal",
        "#interstitial-modal",
        "a.skip-nav",
        "script",
        "noscript"
      ]);
      const doc = payload && payload.document || element.ownerDocument;
      doc.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach((meta) => {
        const content = meta.getAttribute("content") || "";
        meta.setAttribute("content", content.replace(/^(https?:\/\/[^/]+)\/{2,}/, "$1/"));
      });
      element.querySelectorAll(".block.home-hero-block .content > div").forEach((div) => {
        if (isEmptyDiv(div)) div.remove();
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        ".mobile-header",
        "#mobileSignin",
        "#mobilemenu",
        "footer",
        "#teconsent",
        "iframe",
        "style",
        "link",
        "noscript",
        "script"
      ]);
      element.querySelectorAll("div").forEach((div) => {
        if (isEmptyDiv(div)) div.remove();
      });
      element.querySelectorAll("[onclick], [data-track]").forEach((el) => {
        el.removeAttribute("onclick");
        el.removeAttribute("data-track");
      });
    }
  }

  // tools/importer/transformers/wingscu-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "hero-split": parse,
    "cards-icon": parse2,
    "columns-media": parse3,
    "carousel-testimonial": parse4,
    "cards-awards": parse5,
    "hero-callout": parse6
  };
  var PAGE_TEMPLATE = {
    name: "home",
    description: "Wings Credit Union homepage: split hero, product icon grid, promo sections, testimonials carousel, awards and membership callout",
    urls: [
      "https://www.wingscu.com/"
    ],
    blocks: [
      { name: "hero-split", instances: [".block.home-hero-block"] },
      { name: "cards-icon", instances: [".block.icon-grid .gis"] },
      { name: "columns-media", instances: [".block.content-text"] },
      { name: "carousel-testimonial", instances: [".block.testimonials .quote-wrapper"] },
      { name: "cards-awards", instances: [".column-content.block"] },
      { name: "hero-callout", instances: [".block.callout"] }
    ],
    sections: [
      {
        id: "1",
        name: "hero",
        selector: [".block.home-hero-block"],
        style: null,
        blocks: ["hero-split"],
        defaultContent: []
      },
      {
        id: "2",
        name: "product-icon-grid",
        selector: [".block.icon-grid"],
        style: null,
        blocks: ["cards-icon"],
        defaultContent: [".block.icon-grid .block-intro"]
      },
      {
        id: "3",
        name: "hunger-action-month",
        selector: [".rpt-block:has(> .block.headline-text.light-gray-bg)", ".block.headline-text.light-gray-bg"],
        style: "light-grey",
        blocks: [],
        defaultContent: [".block.headline-text.light-gray-bg .block-intro"]
      },
      {
        id: "4",
        name: "medicare-promo",
        selector: [".rpt-block:has(.block.content-text.theme-breeze)", ".block.content-text.theme-breeze"],
        style: "dark",
        blocks: ["columns-media"],
        defaultContent: []
      },
      {
        id: "5",
        name: "social-follow-promo",
        selector: [".rpt-block:has(.block.content-text.theme-cream-small-arrow)", ".block.content-text.theme-cream-small-arrow"],
        style: "cream",
        blocks: ["columns-media"],
        defaultContent: []
      },
      {
        id: "6",
        name: "testimonials",
        selector: [".block.testimonials"],
        style: null,
        blocks: ["carousel-testimonial"],
        defaultContent: [".block.testimonials .block-intro"]
      },
      {
        id: "7",
        name: "awards",
        selector: [".rpt-block:has(> .column-content.block)"],
        style: null,
        blocks: ["cards-awards"],
        defaultContent: [".block.headline-text.white-bg .block-intro"]
      },
      {
        id: "8",
        name: "membership-callout",
        selector: [".block.callout"],
        style: null,
        blocks: ["hero-callout"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
