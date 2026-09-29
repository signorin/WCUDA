import { createOptimizedPicture, fetchPlaceholders } from '../../scripts/aem.js';

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
 * carousel-testimonial: rotating member quotes, one bordered card visible at a time,
 * chevron arrows overlaid on either side (slide dots are rendered but hidden, as on the source).
 * Heart rating is decorative (CSS).
 * Authored as one row per quote: [optional member photo | quote, name (strong), member-since].
 * Tolerates a missing/empty photo cell, a single content cell, and a single slide.
 * @param {Element} block
 */

let instanceId = 0;

function updateActive(block, index) {
  block.dataset.activeSlide = index;
  block.querySelectorAll('.carousel-testimonial-slide').forEach((slide, idx) => {
    const isActive = idx === index;
    slide.setAttribute('aria-hidden', !isActive);
    slide.querySelectorAll('a, button').forEach((el) => {
      if (isActive) el.removeAttribute('tabindex');
      else el.setAttribute('tabindex', '-1');
    });
  });
  block.querySelectorAll('.carousel-testimonial-indicator button').forEach((btn, idx) => {
    if (idx === index) btn.setAttribute('disabled', 'true');
    else btn.removeAttribute('disabled');
  });
}

function showSlide(block, index) {
  const slides = block.querySelectorAll('.carousel-testimonial-slide');
  if (!slides.length) return;
  let target = index;
  if (target < 0) target = slides.length - 1;
  if (target >= slides.length) target = 0;
  block.querySelector('.carousel-testimonial-slides').scrollTo({
    top: 0,
    left: slides[target].offsetLeft,
    behavior: 'smooth',
  });
  updateActive(block, target);
}

function createSlide(row, idx, id) {
  const slide = document.createElement('li');
  slide.className = 'carousel-testimonial-slide';
  slide.id = `carousel-testimonial-${id}-slide-${idx}`;
  slide.dataset.slideIndex = idx;

  const card = document.createElement('div');
  card.className = 'carousel-testimonial-card';
  const photo = document.createElement('div');
  photo.className = 'carousel-testimonial-photo';
  const content = document.createElement('div');
  content.className = 'carousel-testimonial-content';

  [...row.children].forEach((cell) => {
    const pic = cell.querySelector('picture');
    const text = cell.textContent.trim();
    if (pic && text === '' && !photo.querySelector('picture')) {
      photo.append(pic);
    } else if (text !== '' || cell.querySelector('picture')) {
      content.append(...cell.childNodes);
    }
  });

  // mark the attribution lines (name in <strong>, member-since after it)
  const nameEl = content.querySelector('strong');
  const nameP = nameEl?.closest('p');
  if (nameP) {
    nameP.classList.add('carousel-testimonial-name');
    let next = nameP.nextElementSibling;
    while (next) {
      next.classList.add('carousel-testimonial-meta');
      next = next.nextElementSibling;
    }
    const first = content.firstElementChild;
    if (first && first !== nameP) first.classList.add('carousel-testimonial-quote');
  }

  if (photo.querySelector('picture')) {
    card.classList.add('carousel-testimonial-card-photo');
    card.append(photo);
  }
  card.append(content);
  slide.append(card);
  return slide;
}

export default async function decorate(block) {
  instanceId += 1;
  const id = instanceId;
  block.id = `carousel-testimonial-${id}`;
  const rows = [...block.children];
  const isSingle = rows.length < 2;

  const placeholders = await fetchPlaceholders();
  block.setAttribute('role', 'region');
  const roleKey = 'carousel';
  block.setAttribute('aria-roledescription', placeholders[roleKey] || 'Carousel');

  const container = document.createElement('div');
  container.className = 'carousel-testimonial-container';
  const slides = document.createElement('ul');
  slides.className = 'carousel-testimonial-slides';

  rows.forEach((row, idx) => slides.append(createSlide(row, idx, id)));

  slides.querySelectorAll('picture > img').forEach((img) => {
    if (!isOptimizable(img)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  container.append(slides);
  const children = [container];

  if (!isSingle) {
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'carousel-testimonial-prev';
    prev.setAttribute('aria-label', placeholders.previousSlide || 'Previous Slide');
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'carousel-testimonial-next';
    next.setAttribute('aria-label', placeholders.nextSlide || 'Next Slide');
    container.prepend(prev);
    container.append(next);

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    const indicators = document.createElement('ol');
    indicators.className = 'carousel-testimonial-indicators';
    rows.forEach((row, idx) => {
      const li = document.createElement('li');
      li.className = 'carousel-testimonial-indicator';
      li.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}"></button>`;
      li.querySelector('button').addEventListener('click', () => showSlide(block, idx));
      indicators.append(li);
    });
    nav.append(indicators);
    children.push(nav);

    prev.addEventListener('click', () => showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1));
    next.addEventListener('click', () => showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1));
  }

  block.replaceChildren(...children);
  updateActive(block, 0);

  if (!isSingle) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          updateActive(block, parseInt(entry.target.dataset.slideIndex, 10));
        }
      });
    }, { root: slides, threshold: 0.6 });
    slides.querySelectorAll('.carousel-testimonial-slide').forEach((s) => observer.observe(s));
  }
}
