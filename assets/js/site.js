---
---

(() => {
  function onScroll() {
    const headerHeight = document.getElementById('mome-header').offsetHeight;
    document.getElementById('back-to-top')
      .classList[document.body.scrollTop > headerHeight || document.documentElement.scrollTop > headerHeight ? 'remove' : 'add']('hide');
  }

  function onBackToTopClick(e) {
    e.preventDefault();
    document.getElementById('mome-header')
      .scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // listen to scroll for "back to top" functionality
  window.addEventListener('scroll', onScroll);

  // trigger scroll "back to top" functionality
  document.getElementById('back-to-top').addEventListener('click', onBackToTopClick);
})();
