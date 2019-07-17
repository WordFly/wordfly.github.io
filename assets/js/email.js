---
---

window.email = (() => {
  let instance; // instance stores a reference to the Singleton

  // set random background class on body element
  document.body.classList.add(`background-${Math.floor(Math.random() * 3) + 1}`);

  // generates and manages email details view (similar to a modal)
  class EmailDetails {
    constructor() {
      const elPageWrapper = this.elPageWrapper = document.getElementById('gallery');
      Array.from(elPageWrapper.querySelectorAll('[data-action]')).forEach(el => {
        el.addEventListener('click', this.onActionClick.bind(this), false);
      });
    }

    onActionClick(e) {
      const elTarget = e.currentTarget,
        action = elTarget.dataset.action;
      if(/^toggle-/.test(action)) this.toggleEmailView(elTarget, action);
    }

    toggleEmailView(elTarget, action) {
      const elDetails = this.elPageWrapper.querySelector('.email-details'),
        elImage = elDetails.querySelector(`.${action.replace(/^toggle-/, '')}`);
      // remove active class from active nav item
      elDetails.querySelector('nav.views .active').classList.remove('active');
      // remove active class from actively visible image
      elDetails.querySelector('figure .active').classList.remove('active');
      // set active nav item
      elTarget.classList.add('active');
      // set activly visible image
      elImage.classList.add('active');
      // update download link
      elDetails.querySelector('a[download]').href = elImage.src;
    }
  }

  function initialize() {
    new EmailDetails();
  }

  return {
    // get the Singleton instance if one exists or create one if it doesn't
    getInstance() {
      if(!instance) instance = initialize();
      return instance;
    }
  };
})();
