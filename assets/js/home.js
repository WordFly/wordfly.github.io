---
---

window.home = (() => {
  let instance; // instance stores a reference to the Singleton

  // set random background class on body element
  document.body.classList.add(`background-${Math.floor(Math.random() * 3) + 1}`);

  // helps with item placement for simple masonry grid layout
  class MasonryGrid {
    constructor() {
      this.elPageWrapper = document.getElementById('gallery');
      window.addEventListener('load', this.onWindowLoad.bind(this));
      window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowLoad() {
      this.resizeAllItems();
    }

    onWindowResize() {
      this.resizeAllItems();
    }

    resizeItem(el) {
      const gridStyles = window.getComputedStyle(this.elPageWrapper.querySelector('.emails')),
        height = parseInt(gridStyles.getPropertyValue('grid-auto-rows'), 10),
        gap = parseInt(gridStyles.getPropertyValue('grid-row-gap'), 10),
        rowSpan = Math.ceil((el.querySelector('a').getBoundingClientRect().height + gap) / (height + gap));
      el.style.gridRowEnd = `span ${rowSpan}`;
    }

    resizeAllItems() {
      Array.from(this.elPageWrapper.querySelectorAll('.emails li')).forEach(this.resizeItem.bind(this));
    }
  }

  // generates and manages email details view (similar to a modal)
  class EmailDetails {
    constructor(collection) {
      const updateState = this.updateState.bind(this),
        elPageWrapper = this.elPageWrapper = document.getElementById('gallery');
      this.state = {
        get value() {
          return window.location.pathname.replace(/^\/emails\//, '');
        },
        set value(value) {
          if(value) {
            window.history.pushState('', document.title, `/emails${value}`);
          } else {
            // remove state
            window.history.pushState('', document.title, '/');
          }
          updateState();
        }
      };
      this.collection = collection;
      this.model = null;
      window.addEventListener('popstate', this.onPopstate.bind(this));
      elPageWrapper.addEventListener('touchstart', this.onWrapperTouchstart.bind(this));
      elPageWrapper.addEventListener('touchend', this.onWrapperTouchend.bind(this));
    }

    onPopstate() {
      this.updateState();
    }

    updateState() {
      const elDetails = this.elPageWrapper.querySelector('.email-details');
      // e.preventDefault();
      if(elDetails && elDetails.classList.contains('loaded')) {
        elDetails.classList.remove('loaded');
        elDetails.addEventListener('transitionend', this.show.bind(this), { once: true })
      } else {
        this.show();
      }
    }

    onWrapperTouchstart(e) {
      this.startClientX = e.changedTouches[0].clientX;
    }

    onWrapperTouchend(e) {
      const startClientX = this.startClientX,
        endClientX = e.changedTouches[0].clientX;
      if(Math.abs(startClientX - endClientX) >= 30) {
        e.preventDefault();
        e.stopPropagation();
        this.traverse(startClientX > endClientX ? 'next' : 'previous');
      }
    }

    onActionClick(e) {
      const elTarget = e.currentTarget,
        elDetails = this.elPageWrapper.querySelector('.email-details'),
        action = elTarget.dataset.action;
      if(action === 'close') {
        this.state.value = '';
        this.remove();
      } else if(/^toggle-/.test(action)) {
        this.toggleEmailView(elTarget, action);
      } else if(/^goto-/.test(action)) {
        this.traverse(action.replace(/^goto-/, ''));
      }
    }

    onActiveImageLoad() {
      const elDetails = this.elPageWrapper.querySelector('.email-details');
      elDetails.classList.add('loaded');
      // scroll to the top of the container
      elDetails.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    onShowTransitionend(id) {
      if(!this.model) this.create(this.getEmailDetails(id));
    }

    onRemoveTransitionend() {
      const elDetails = this.elPageWrapper.querySelector('.email-details');
      if(elDetails) {
        elDetails.parentNode.removeChild(elDetails);
        // scroll back to email in the gallery
        document.getElementById(elDetails.id.replace(/-details$/, '')).scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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

    getEmailDetails(id) {
      return this.collection.find(m => m.slug === id);
    }

    create(model) {
      const elPageWrapper = this.elPageWrapper,
        elContainer = elPageWrapper.querySelector('.email-details') || document.createElement('article'),
        encodedHref = encodeURIComponent(window.location.href);
      elContainer.id = `${model.slug}-details`;
      elContainer.classList.add('email-details'),
      // build out container's contents
      elContainer.innerHTML = `
        <div class="inner">
          <nav class="traversal">
            <ul>
              <li>
                <button data-action="goto-previous">
                  <i class="icon caret"></i>
                  <span class="offscreen">Previous</span>
                </button>
              </li>
              <li>
                <button data-action="goto-next">
                  <i class="icon caret"></i>
                  <span class="offscreen">Next</span>
                </button>
              </li>
            </ul>
          </nav>
          <main>
            <button data-action="close">
              <i class="icon caret"></i>
              Back to the Gallery
            </button>
            <figure>
              <figcaption>
                <h2>${model.credit}, ${new Date(model.date.replace(/\s/, 'T').replace(/\s/, '')).getUTCFullYear()}</h2>
                <h1>${model.title}</h1>
              </figcaption>
              <nav class="views">
                <ul>
                  <li>
                    <button class="active" data-action="toggle-desktop-view">
                      <i class="icon desktop"></i>
                      <span class="offscreen">Desktop</span>
                    </button>
                  </li>
                  <li>
                    <button data-action="toggle-mobile-view">
                      <i class="icon mobile"></i>
                      <span class="offscreen">Mobile</span>
                    </button>
                  </li>
                </ul>
              </nav>
              <nav class="share">
                <ul>
                  <li>
                    <a href="https://twitter.com/intent/tweet?hashtags=emailmarketing%2C%20mome&original_referer=${encodedHref}&ref_src=twsrc%5Etfw&text=AOGU%20Newsletter%2C%20The%20Loom%20May%202019&tw_p=tweetbutton&url=${encodedHref}&via=wordfly" target="_blank">
                      <i class="icon twitter"></i>
                      <span class="offscreen">Tweet</span>
                    </a>
                  </li>
                  <li>
                    <a download href="${model.images.desktop}" target="_blank">
                      <i class="icon download"></i>
                      <span class="offscreen">Download</span>
                    </a>
                  </li>
                </ul>
              </nav>
              <img alt="${model.title} - desktop view" class="desktop-view active" src="${model.images.desktop}" />
              <img alt="${model.title} - mobile view" class="mobile-view" src="${model.images.mobile}" />
            </figure>
          </main>
        </div>
      `;
      Array.from(elContainer.querySelectorAll('[data-action]')).forEach(el => {
        el.addEventListener('click', this.onActionClick.bind(this), false);
      });
      elPageWrapper.appendChild(elContainer);
      elContainer.querySelector('img.active').addEventListener('load', this.onActiveImageLoad.bind(this), { once: true });
      this.model = model;
    }

    show() {
      const id = this.state.value,
        elPageWrapper = this.elPageWrapper,
        elEmailsList = elPageWrapper.querySelector('.emails');
      this.model = null;
      if(id && id !== '/') {
        if(!elPageWrapper.classList.contains('hide-grid')) {
          elPageWrapper.classList.add('hide-grid');
          elEmailsList.addEventListener('transitionend', this.onShowTransitionend.bind(this, id), { once: true });
        } else {
          this.create(this.getEmailDetails(id));
        }
      } else {
        this.remove();
      }
    }

    remove() {
      const elDetails = this.elPageWrapper.querySelector('.email-details'),
        elPageWrapper = this.elPageWrapper;
      if(elDetails) {
        elDetails.classList.remove('loaded');
        elPageWrapper.classList.remove('hide-grid');
        elDetails.addEventListener('transitionend', this.onRemoveTransitionend.bind(this), { once: true });
      }
    }

    traverse(direction) {
      const model = this.model[direction];
      if(model) this.state.value = `/${model.slug}`;
    }
  }

  function initialize(data) {
    const emailDetails = new EmailDetails(data),
      masonryGrid = new MasonryGrid();

    function onNavigationClick(e) {
      const elTarget = e.target,
        elCurrentTarget = e.currentTarget;
      if(elTarget === elCurrentTarget || elTarget.nodeName === 'BUTTON') elCurrentTarget.classList.toggle('open');
    }

    function onFilterClick(e) {
      const filter = e.target.dataset.tag,
        collection = filter !== 'all' ? data.filter(m => m.tags.includes(filter)) : data,
        ids = collection.map(m => m.slug),
        elWrapper = document.getElementById('gallery'),
        elActive = elWrapper.querySelector('.active');
      // remove active state from previous filter
      if(elActive) elActive.classList.remove('active');
      // add active state to new filter
      e.currentTarget.classList.add('active');
      Array.from(elWrapper.querySelectorAll('.emails li')).forEach(el => {
        let done = false;
        const resizeItem = () => {
            masonryGrid.resizeItem(el);
            if(!done) window.requestAnimationFrame(resizeItem);
          },
          hasId = ids.includes(el.id);
        el.classList.add('fade');
        setTimeout(() => {
          if(hasId) {
            el.classList.remove('hide');
          } else {
            el.classList.add('hide');
          }
        }, 300);
        setTimeout(() => {
          window.requestAnimationFrame(resizeItem);
          if(hasId) el.classList.remove('hide', 'fade');
          setTimeout(() => done = true, 600);
        }, 600);
      });
      // re-map `previous` and `next` for each model in the collection
      collection.forEach((model, index) => {
        model.previous = index - 1 > -1 ? collection[index - 1] : null;
        model.next = index + 1 < collection.length ? collection[index + 1] : null;
      });
      emailDetails.collection = collection;
    }

    function onItemClick(e) {
      const elTarget = e.currentTarget;
      e.preventDefault();
      e.stopPropagation();
      emailDetails.state.value = `/${elTarget.id}`;
    }

    document.querySelector('#gallery .filter ul').addEventListener('click', onNavigationClick);

    Array.from(document.querySelectorAll('#gallery .filter button')).forEach(el => {
      el.addEventListener('click', onFilterClick);
    });

    Array.from(document.querySelectorAll('#gallery .emails li')).forEach(el => {
      let done = false;
      const resizeItem = () => {
          masonryGrid.resizeItem(el);
          if(!done) window.requestAnimationFrame(resizeItem);
        },
        elImage = el.querySelector('img');
      el.addEventListener('click', onItemClick);
      if(elImage.complete) {
        el.classList.remove('fade');
        window.requestAnimationFrame(resizeItem);
      }
      elImage.addEventListener('load', () => {
        window.requestAnimationFrame(resizeItem);
        el.classList.remove('fade');
        setTimeout(() => done = true, 600);
      }, false);
    });
  }

  return {
    // get the Singleton instance if one exists or create one if it doesn't
    getInstance(data) {
      if(!instance) instance = initialize(data);
      return instance;
    }
  };
})();