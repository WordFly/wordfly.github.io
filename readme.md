# The Museum of Modern Email
----------------------------

The Museum of Modern Email is dedicated to advancing the email arts. We feature beautiful and thoughtfully designed email campaigns created by performing arts and culture organizations from around the world.

Development
-----------

### Run the site locally
```bash
gem install jekyll bundler # first time only
bundle install # first time only
bundle exec jekyll serve
```

Browse to [http://localhost:4000](http://localhost:4000)

About the code
--------------

This site is hosted on Github using [GitHub Pages](http://pages.github.com/). The code is generated by [Jekyll](http://jekyllrb.com), an open source static site generator, using content stored in markdown files. Upon deployment, Github runs the code through Jekyll's processing to generate and deploy the static HTML site.

CSS is generated using [SASS](https://sass-lang.com/), an open source CSS preprocessor.

JavaScript is processed through [Babel](https://babeljs.io/) to convert modern ECMAScript code to a more broadly supported syntax.

Release notes
-------------

5/8/2020 - Added a temporary exhibition space. Commit ae1a06. Added option to link to archive URL. Commit 215cea.


Adding emails
--------------

1. Create three folders: `/desktop/`, `/mobile/`, and `/grid/`. Save desktop screenshots in both `\desktop\` and `\grid\` folders, and save mobile screenshots in the `/mobile/` folder.
2. Take email screenshots. [This technique works pretty well.](https://www.howtogeek.com/423558/how-to-take-full-page-screenshots-in-google-chrome-without-using-an-extension/) (Note about screenshots: Take screenshots on a retina screen only. All desktop emails should be 1000px wide when screenshot is taken. This will create a 2000px-wide image. All mobile emails should be 320px wide when screenshot is taken. This will create a 640px-wide image.)
3. In Photoshop, go to File > Scripts > Image Processor. Choose folder for processing. Settings are JPEG Quality 5. Desktop: 2000x30000. Mobile: 640x30000. Grid: 440x30000. Run images.
4. Upload processed images to the WordFly account on go.wordfly.com. `/mome/desktop/`, `/mome/grid/`, `/mome/desktop/`
5. Open GitHub project in an editor (e.g., Atom)
6. Add new `/.md` file for each image set
7. Commit to Master
