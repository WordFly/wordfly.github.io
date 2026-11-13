---
---

window.gallery = (() => {
  const emailPathPattern = /^\/emails\//;
  let instance; // instance stores a reference to the Singleton

  // set random background class on body element
  document.body.classList.add(`background-${Math.floor(Math.random() * 3) + 1}`);

  // helps with item placement for simple masonry grid layout
  class MasonryGrid {
    constructor() {
      this.elPageWrapper = document.getElementById('gallery');
      window.addEventListener('load', this.resizeAllItems.bind(this));
      window.addEventListener('resize', this.resizeAllItems.bind(this));
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
        elPageWrapper = this.elPageWrapper = document.getElementById('gallery'),
        emailDetails = this;
      this.returnPath = window.location.pathname;
      this.state = {
        get value() {
          return window.location.pathname.replace(emailPathPattern, '');
        },
        set value(value) {
          if(value) {
            window.history.pushState('', document.title, `/emails${value}`);
          } else {
            // remove state
            window.history.pushState('', document.title, emailDetails.returnPath);
          }
          updateState();
        }
      };
      this.collection = collection;
      this.emails = collection;
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
      if(elDetails && elDetails.classList.contains('loaded')) {
        elDetails.classList.remove('loaded');
        this.afterTransition(elDetails, this.show.bind(this));
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

    onFilterClick(e) {
      const elTarget = e.currentTarget,
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
        this.elPageWrapper.classList.add('restore-grid');
        this.elPageWrapper.classList.remove('hide-grid');
        this.scrollToItem(document.getElementById(elDetails.id.replace(/-details$/, '')));
      }
    }

    // scroll to the email while the grid is invisible, then fade the grid in once the tiles on screen have settled
    scrollToItem(elItem) {
      const elPageWrapper = this.elPageWrapper,
        elItems = Array.from(elItem.parentNode.children),
        // layout position, so the tile's fade-in scale doesn't move the target
        anchor = () => {
          let top = 0,
            el = elItem;
          if(!elItem.offsetParent) return;
          while(el) {
            top += el.offsetTop;
            el = el.offsetParent;
          }
          window.scrollTo(0, top);
        },
        isSettled = () => elItems.every(el => {
          const rect = el.getBoundingClientRect(),
            isOffscreen = rect.bottom < 0 || rect.top > window.innerHeight;
          return el.classList.contains('hide') || isOffscreen || el.querySelector('img').complete;
        }),
        reveal = () => elPageWrapper.classList.remove('restore-grid'),
        // resize callbacks run before paint, so re-anchoring here never shows a jump
        observer = new ResizeObserver(() => {
          anchor();
          if(isSettled()) reveal();
        }),
        controller = new AbortController(),
        timers = [],
        stop = () => {
          observer.disconnect();
          timers.forEach(clearTimeout);
          controller.abort();
          reveal();
          this.stopRestore = null;
        };
      if(this.stopRestore) this.stopRestore();
      this.stopRestore = stop;
      anchor();
      elItems.concat(Array.from(elPageWrapper.children)).forEach(el => observer.observe(el));
      timers.push(setTimeout(reveal, 1000), setTimeout(stop, 2000));
      ['wheel', 'touchstart', 'keydown', 'pointerdown']
        .forEach(type => window.addEventListener(type, stop, { passive: true, signal: controller.signal }));
    }

    // toggle between desktop and mobile email view
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
      elDetails.querySelector('a[download]').href = elImage.dataset.full;
    }

    // finds and returns email's model based on id
    getEmailDetails(id) {
      const collection = this.collection,
        index = collection.findIndex(model => model.slug === id);
      // emails outside the active filter (e.g. reached via browser history) get no traversal
      if(index === -1) {
        return Object.assign({}, this.emails.find(model => model.slug === id),
          { hasPrevious: false, hasNext: false, previous: null, next: null });
      }
      return Object.assign({ hasPrevious: index > 0, hasNext: index < collection.length - 1 }, collection[index]);
    }

    // create email "page"
    create(model) {
      const elPageWrapper = this.elPageWrapper,
        elContainer = elPageWrapper.querySelector('.email-details') || document.createElement('article');
      let tagMarkup = '';
      elContainer.id = `${model.slug}-details`;
      elContainer.classList.add('email-details');
      model.tags.forEach(t => tagMarkup += `<li>${t.replace(/-/g, ' ')}</li>\n`);
      // build out container's contents
      elContainer.innerHTML = `
        <div class="inner">
          <nav class="traversal">
            <ul>
              <li>
                <button data-action="goto-previous"${!model.hasPrevious ? ' disabled' : ''}>
                  <i class="icon caret"></i>
                  <span class="offscreen">Previous</span>
                </button>
              </li>
              <li>
                <button data-action="goto-next"${!model.hasNext ? ' disabled' : ''}>
                  <i class="icon caret"></i>
                  <span class="offscreen">Next</span>
                </button>
              </li>
            </ul>
          </nav>
          <main>
            <div>
              <button data-action="close">
                <i class="icon caret"></i>
                Back to the Gallery
              </button>
              <ul class="tags">
                ${tagMarkup}
              </ul>
            </div>
            <figure>
              <figcaption>
                <h2>${model.credit}, ${new Date(model.date.replace(/\s/, 'T').replace(/\s.*/, '')).getUTCFullYear()}</h2>
                <h1>${model.title}</h1>
              </figcaption>
              <section>
                <nav class="views">
                  <ul>
                    <li>
                      <button class="active" data-action="toggle-desktop-view" data-hint="Show desktop">
                        <i class="icon desktop"></i>
                        <span class="offscreen">Desktop</span>
                      </button>
                    </li>
                    <li>
                      <button data-action="toggle-mobile-view" data-hint="Show mobile">
                        <i class="icon mobile"></i>
                        <span class="offscreen">Mobile</span>
                      </button>
                    </li>
                  </ul>
                </nav>
                <nav class="share">
                  <ul>
                    <li>
                      <a data-hint="Download image" download href="${model.images.desktop}" target="_blank">
                        <i class="icon download"></i>
                        <span class="offscreen">Download</span>
                      </a>
                    </li>
                    ${model.archiveurl ? `<li>
                      <a data-hint="View live email" href="${model.archiveurl}" target="_blank">
                        <i class="icon external"></i>
                        <span class="offscreen">Archive URL</span>
                      </a>
                    </li>` : ''}
                  </ul>
                </nav>
              </section>
              ${model.description ? `<div class="description">${model.description}</div>` : ''}
              <img alt="${model.title} - desktop view" class="desktop-view active"
                data-full="${model.images.desktop}" src="${model.images.grid}" />
              <img alt="${model.title} - mobile view" class="mobile-view"
                data-full="${model.images.mobile}" fetchpriority="low" src="${model.images.mobile}" />
            </figure>
          </main>
        </div>
      `;
      Array.from(elContainer.querySelectorAll('[data-action]')).forEach(el => {
        el.addEventListener('click', this.onFilterClick.bind(this), false);
      });
      elPageWrapper.appendChild(elContainer);
      elContainer.querySelector('img.active').addEventListener('load', this.onActiveImageLoad.bind(this), { once: true });
      this.loadFullImage(elContainer.querySelector('img.desktop-view'));
      this.model = model;
    }

    // show the cached grid image until the full-size image loads
    loadFullImage(elImage) {
      const fullImage = new Image();
      // stop a preload from a previous email competing with this one
      if(this.fullImage) this.fullImage.removeAttribute('src');
      this.fullImage = fullImage;
      fullImage.fetchPriority = 'high';
      fullImage.src = elImage.dataset.full;
      if(fullImage.complete) {
        elImage.src = fullImage.src;
        return;
      }
      elImage.classList.add('preview');
      fullImage.addEventListener('load', () => {
        fullImage.decode().catch(() => {}).then(() => {
          elImage.src = fullImage.src;
          elImage.classList.remove('preview');
        });
      }, { once: true });
      fullImage.addEventListener('error', () => elImage.classList.remove('preview'), { once: true });
    }

    show() {
      const id = this.state.value,
        elPageWrapper = this.elPageWrapper,
        elEmailsList = elPageWrapper.querySelector('.emails');
      if(this.stopRestore) this.stopRestore();
      this.model = null;
      if(id && id !== window.location.pathname) {
        if(!elPageWrapper.classList.contains('hide-grid')) {
          elPageWrapper.classList.add('hide-grid');
          this.afterTransition(elEmailsList, this.onShowTransitionend.bind(this, id));
        } else {
          this.create(this.getEmailDetails(id));
        }
      } else {
        this.remove();
      }
    }

    remove() {
      const elDetails = this.elPageWrapper.querySelector('.email-details');
      if(elDetails) {
        elDetails.classList.remove('loaded');
        this.afterTransition(elDetails, this.onRemoveTransitionend.bind(this));
      }
    }

    traverse(direction) {
      const model = this.model && this.model[direction];
      if(model) this.state.value = `/${model.slug}`;
    }

    // run callback on the next transitionend, or after a fallback delay if no transition runs
    afterTransition(el, callback) {
      const finish = () => {
          clearTimeout(timeout);
          el.removeEventListener('transitionend', finish);
          callback();
        },
        timeout = setTimeout(finish, 600);
      el.addEventListener('transitionend', finish);
    }
  }

  function initialize(data) {
    const emailDetails = new EmailDetails(data),
      masonryGrid = new MasonryGrid(),
      elSearch = document.getElementById('search'),
      elFilterNavigation = document.querySelector('#gallery .filter ul'),
      elFilterButtons = Array.from(document.querySelectorAll('#gallery .filter [data-tag]')),
      elFilterAll = findFilter('all'),
      elFilterActive = elFilterButtons.find(el => el.classList.contains('active'));

    let searchTimeout;

    // hides / shows filters
    function onNavigationClick(e) {
      const elTarget = e.target,
        elCurrentTarget = e.currentTarget;
      if(elTarget === elCurrentTarget || elTarget.nodeName === 'BUTTON') elCurrentTarget.classList.toggle('open');
    }

    // apply tag filter to email grid
    function onFilterClick(e) {
      const elTarget = e.currentTarget,
        filter = elTarget.dataset.tag,
        currentValue = elSearch.value;
      // clear out current search value
      elSearch.value = '';
      if(filter) {
        updateLocation(elTarget);
        filterList(filterData(filter));
        // add active state to new filter
        elTarget.classList.add('active');
      } else if(elTarget.dataset.action === 'show-search') {
        // add active state for search
        if(elTarget.classList.toggle('searching')) {
          elSearch.addEventListener('transitionend', e => e.target.focus(), { once: true });
        } else if(currentValue.length > 0) {
          triggerFilterClick('all');
        }
      }
    }

    // apply title/credit search filter to email grid
    function onSearchInput(e) {
      const value = e.target.value.toLowerCase();
      e.preventDefault();
      updateLocation(elFilterAll);
      if(searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(filterList
        .bind(null, data.filter(m => m.title.toLowerCase().indexOf(value) > -1 || m.credit.toLowerCase().indexOf(value) > -1)), 500);
    }

    function onSearchKeydown(e) {
      if(e.keyCode === 13) {
        e.target.blur();
        elFilterNavigation.classList.remove('open');
      }
    }

    // update push state
    function onItemClick(e) {
      const elTarget = e.currentTarget;
      e.preventDefault();
      e.stopPropagation();
      emailDetails.state.value = `/${elTarget.id}`;
    }

    // TODO: take some time to figure out a better way to delay without a timers
    function filterList(collection) {
      const ids = collection.map(m => m.slug),
        elWrapper = document.getElementById('gallery'),
        elActive = elWrapper.querySelector('.active');
      // remove active state from previous filter
      if(elActive) elActive.classList.remove('active');
      Array.from(elWrapper.querySelectorAll('.emails li')).forEach(el => {
        const resizeItem = () => {
            masonryGrid.resizeItem(el);
            if(!done) window.requestAnimationFrame(resizeItem);
          },
          hasId = ids.includes(el.id),
          elImage = el.querySelector('img');
        let done = false;
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
          if(hasId) {
            el.classList.remove('hide');
            if(elImage.complete) el.classList.remove('fade');
          }
          setTimeout(() => done = true, 600);
        }, 600);
      });
      setTimeout(() => {
        // update current item count on wrapper
        elWrapper.dataset.count = collection.length;
      }, 300);
      // re-map `previous` and `next` for each model in the collection
      remapPagination(collection);
    }

    function remapPagination(data) {
      // re-map `previous` and `next` for each email
      data.forEach((model, index) => {
        model.previous = index - 1 > -1 ? data[index - 1] : null;
        model.next = index + 1 < data.length ? data[index + 1] : null;
      });
      emailDetails.collection = data;
    }

    function triggerFilterClick(filter, bubbles = true) {
      const elFilter = findFilter(filter);
      if(elFilter) elFilter.dispatchEvent(new MouseEvent('click', { bubbles, cancelable: true }));
    }

    function filterData(tag) {
      return tag && tag !== 'all' ? data.filter(m => m.tags.includes(tag)) : data;
    }

    function findFilter(tag) {
      return elFilterButtons.find(el => el.dataset.tag === tag);
    }

    function updateLocation(elFilter) {
      document.title = elFilter.dataset.title;
      emailDetails.returnPath = elFilter.dataset.slug ? `/category/${elFilter.dataset.slug}/` : '/';
      window.history.replaceState('', document.title, emailDetails.returnPath);
    }

    // match the active filter to the URL, e.g. /category/giving/
    function syncFilterToPath() {
      const pathname = window.location.pathname,
        slug = (pathname.match(/^\/category\/([^/]+)/) || [])[1],
        elFilter = slug ? elFilterButtons.find(el => el.dataset.slug === slug) : elFilterAll;
      if(emailPathPattern.test(pathname)) return;
      emailDetails.returnPath = pathname;
      if(!(elSearch && elSearch.value) && elFilter && !elFilter.classList.contains('active')) {
        // no bubbling, so the mobile filter menu stays closed
        triggerFilterClick(elFilter.dataset.tag, false);
      }
    }

    // hide / show filters
    if(elFilterNavigation) elFilterNavigation.addEventListener('click', onNavigationClick);

    // search input events
    if(elSearch) {
      elSearch.addEventListener('input', onSearchInput);
      elSearch.addEventListener('keydown', onSearchKeydown);
    }

    Array.from(document.querySelectorAll('#gallery .filter button')).forEach(el => {
      // apply filter to email grid
      el.addEventListener('click', onFilterClick);
    });

    // resize email grid items
    Array.from(document.querySelectorAll('#gallery .emails li')).forEach(el => {
      const resizeItem = () => {
          masonryGrid.resizeItem(el);
          if(!done) window.requestAnimationFrame(resizeItem);
        },
        elImage = el.querySelector('img');
      let done = false;
      el.addEventListener('click', onItemClick);
      if(elImage.complete) {
        el.classList.remove('fade');
        window.requestAnimationFrame(resizeItem);
      }
      elImage.addEventListener('load', () => {
        window.requestAnimationFrame(resizeItem);
        el.classList.remove('fade');
        // TODO: take some time to figure out a better way to delay without a timer
        setTimeout(() => done = true, 600);
      }, false);
    });
    // size tiles before their lazy images load
    masonryGrid.resizeAllItems();
    // re-map `previous` and `next` for each email
    remapPagination(filterData(elFilterActive && elFilterActive.dataset.tag));
    syncFilterToPath();
    window.addEventListener('popstate', syncFilterToPath);
    return emailDetails;
  }

  return {
    // get the Singleton instance if one exists or create one if it doesn't
    getInstance(data) {
      if(!instance) instance = initialize(data);
      return instance;
    }
  };
})();
