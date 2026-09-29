/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Wings Credit Union (wingscu.com) site-wide cleanup.
 *
 * Selectors verified in migration-work/cleaned.html (line refs approximate):
 * - header.js-is-sticky (L3), a.skip-nav (L9)
 * - .mobile-header (L482) incl. #mobileSignin, #mobilemenu (mobile nav + search + sign-in forms)
 * - main#MainContent (L920) holds all authorable content
 * - footer (L1286) incl. #teconsent, #nuanMessagingFrame
 * - #consent-banner > #truste-consent-track.trustarc-banner-wrapper (L1380)
 * - #external-link-modal, #interstitial-modal (L1391, L1406)
 * - iframe#universal_pixel_vbs5huh tracking pixel (L1440)
 * - Hero spacer <div>&nbsp;</div> inside .block.home-hero-block .content (L926-929)
 * - Empty <div></div> spacers after blocks inside main / rpt-blocks
 * Chat widgets #salemove / #sm-visitor-app-container are injected at runtime (verified on live DOM).
 *
 * NOTE: <style> tags are NOT removed in beforeTransform: .block.home-hero-block and
 * .block.callout carry inline <style> with their background-image url() that the block
 * parsers read. They are removed in afterTransform once parsing is done.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

function isEmptyDiv(div) {
  if (div.children.length > 0) return false;
  const text = (div.textContent || '').replace(/ /g, ' ').trim();
  return text === '';
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / widgets that may interfere with parsing
    WebImporter.DOMUtils.remove(element, [
      '#consent-banner',
      '#truste-consent-track',
      '.trustarc-banner-wrapper',
      '#salemove',
      '#sm-visitor-app-container',
      '#nuanMessagingFrame',
      '#external-link-modal',
      '#interstitial-modal',
      'a.skip-nav',
      'script',
      'noscript',
    ]);

    // og:image on source has a double slash (https://www.wingscu.com//assets/...),
    // which createMetadata resolves to https://assets/... — normalize it
    const doc = (payload && payload.document) || element.ownerDocument;
    doc.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach((meta) => {
      const content = meta.getAttribute('content') || '';
      meta.setAttribute('content', content.replace(/^(https?:\/\/[^/]+)\/{2,}/, '$1/'));
    });

    // Hero spacer divs: <div>&nbsp;</div> inside hero content
    element.querySelectorAll('.block.home-hero-block .content > div').forEach((div) => {
      if (isEmptyDiv(div)) div.remove();
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Global site chrome (non-authorable)
    WebImporter.DOMUtils.remove(element, [
      'header',
      '.mobile-header',
      '#mobileSignin',
      '#mobilemenu',
      'footer',
      '#teconsent',
      'iframe',
      'style',
      'link',
      'noscript',
      'script',
    ]);

    // Empty spacer / trailing divs (no child elements, no text)
    element.querySelectorAll('div').forEach((div) => {
      if (isEmptyDiv(div)) div.remove();
    });

    // Tracking / inline handler attributes
    element.querySelectorAll('[onclick], [data-track]').forEach((el) => {
      el.removeAttribute('onclick');
      el.removeAttribute('data-track');
    });
  }
}
