/* ============================================================
   Harsh Shah — Portfolio interactions
   ============================================================ */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- nav: shadow on scroll ---------- */
  const nav = $('#nav');
  const onScroll = () => { if (nav) nav.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  const toggle = $('#nav-toggle');
  const links = $('#nav-links');
  if (toggle && links) {
    const setOpen = (open) => { links.classList.toggle('open', open); toggle.classList.toggle('open', open); };
    toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
    links.addEventListener('click', (e) => { if (e.target.tagName === 'A') setOpen(false); });
    document.addEventListener('click', (e) => {
      if (links.classList.contains('open') && !links.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) setOpen(false);
    });
  }

  /* ---------- reveal on scroll ---------- */
  const reveals = $$('.reveal');
  if (reveals.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('in'));
    } else {
      // gentle stagger for grouped items
      $$('.cards, .skills-grid, .edu-grid, .pub-grid, .facts').forEach((group) => {
        $$('.reveal', group).forEach((el, i) => { el.style.transitionDelay = Math.min(i * 60, 300) + 'ms'; });
      });
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      reveals.forEach((el) => io.observe(el));
      // safety net: never leave content hidden if the observer never fires
      setTimeout(() => {
        if (!document.querySelector('.reveal.in')) reveals.forEach((el) => el.classList.add('in'));
      }, 2500);
    }
  }

  /* ---------- scroll-spy: active nav link ---------- */
  const sections = $$('main section[id]');
  const navAnchors = $$('#nav-links a');
  if (sections.length && navAnchors.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navAnchors.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
        }
      });
    }, { threshold: 0.1, rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }
})();
