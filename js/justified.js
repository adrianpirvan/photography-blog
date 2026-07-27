/* ============================================
   JUSTIFIED.JS — Mobile justified layout
   Applies to: default galleries, split-2 galleries, lookbook-v2 galleries.
   Pairs photos into rows by natural aspect ratio.
   Odd last photo goes full width.
   Only runs on mobile (≤600px).
   ============================================ */
(function () {

  var BREAKPOINT = 600;
  var GAP        = 4;
  var MIN_H      = 100;
  var MAX_H      = 260;

  function aspect(img) {
    return (img.naturalWidth && img.naturalHeight)
      ? img.naturalWidth / img.naturalHeight
      : 1.5;
  }

  function containerW(el) {
    var cs = window.getComputedStyle(el);
    return el.clientWidth
      - (parseFloat(cs.paddingLeft)  || 0)
      - (parseFloat(cs.paddingRight) || 0);
  }

  function setImg(img, w, h) {
    img.style.flex     = '0 0 ' + w + 'px';
    img.style.width    = w + 'px';
    img.style.height   = h + 'px';
    img.style.maxWidth = 'none';
    img.style.minWidth = '0';
  }

  /* Process a gallery's imgs array into justified pairs */
  function processGallery(g, imgs) {
    imgs = imgs || Array.from(g.querySelectorAll(':scope > .gallery-img'));
    var W = containerW(g);

    for (var i = 0; i < imgs.length; i += 2) {
      var a = imgs[i], b = imgs[i + 1];

      if (!b) {
        a.style.flex     = '0 0 100%';
        a.style.width    = '100%';
        a.style.maxWidth = 'none';
        a.style.minWidth = '0';
        a.style.height   = '220px';
        continue;
      }

      var r1 = aspect(a), r2 = aspect(b);
      var p1 = r1 / (r1 + r2);
      var w1 = Math.round((W - GAP) * p1);
      var w2 = W - GAP - w1;
      var h  = Math.round(Math.min(MAX_H, Math.max(MIN_H,
                 Math.min(w1 / r1, w2 / r2))));

      setImg(a, w1, h);
      setImg(b, w2, h);
    }
  }

  /* Call callback once all imgs in the array have loaded (or errored) */
  function whenLoaded(imgs, callback) {
    if (!imgs.length) { callback(); return; }
    var done = 0, total = imgs.length;
    function tick() { if (++done >= total) callback(); }
    imgs.forEach(function (img) {
      if (img.complete && img.naturalWidth) tick();
      else {
        img.addEventListener('load',  tick, { once: true });
        img.addEventListener('error', tick, { once: true });
      }
    });
  }

  /* run() — used by the resize handler (all images are loaded by then) */
  function run() {
    if (window.innerWidth > BREAKPOINT) return;

    /* Default galleries (no layout modifier) */
    document.querySelectorAll('.inline-gallery:not([class*="inline-gallery--"])').forEach(function (g, idx) {
      var imgs = Array.from(g.querySelectorAll(':scope > .gallery-img'));

      if (idx === 0 && imgs.length > 2) {
        var orders      = [1, 4, 2, 6, 5, 3, 8, 7, 9];
        var visualOrder = [0, 2, 5, 1, 4, 3, 7, 6, 8];
        var orig = imgs.slice();
        imgs.forEach(function (img, i) {
          img.style.order = String(orders[i] !== undefined ? orders[i] : i + 1);
        });
        visualOrder.forEach(function (domIdx, vi) {
          if (orig[domIdx]) imgs[vi] = orig[domIdx];
        });
      }

      if (idx === 1 && imgs.length > 3) {
        var orders6      = [4, 1, 2, 3, 6, 5, 8, 7];
        var visualOrder6 = [1, 2, 3, 0, 5, 4, 7, 6];
        var orig6 = imgs.slice();
        imgs.forEach(function (img, i) {
          img.style.order = String(orders6[i] !== undefined ? orders6[i] : i + 1);
        });
        visualOrder6.forEach(function (domIdx, vi) {
          if (orig6[domIdx]) imgs[vi] = orig6[domIdx];
        });
      }

      processGallery(g, imgs);
      g.style.opacity = '1';
    });

    /* split-2 galleries */
    document.querySelectorAll('.inline-gallery--split-2').forEach(function (g) {
      processGallery(g);
      g.style.opacity = '1';
    });

    /* lookbook-v2 galleries */
    document.querySelectorAll('.inline-gallery--lookbook-v2').forEach(function (g, idx) {
      var imgs = Array.from(g.querySelectorAll('.gallery-img'));
      if (idx < 2 && imgs.length > 0) {
        var first = imgs[0];
        var W = containerW(g);
        var h = Math.round(Math.min(340, Math.max(160, W / aspect(first))));
        first.style.flex     = '0 0 100%';
        first.style.width    = '100%';
        first.style.maxWidth = 'none';
        first.style.minWidth = '0';
        first.style.height   = h + 'px';
        processGallery(g, imgs.slice(1));
      } else {
        processGallery(g, imgs);
      }
      g.style.opacity = '1';
    });
  }

  function reset() {
    document.querySelectorAll('.inline-gallery .gallery-img').forEach(function (img) {
      img.style.flex = img.style.width = img.style.height =
      img.style.maxWidth = img.style.minWidth = img.style.order = '';
    });
    document.querySelectorAll(
      '.inline-gallery:not([class*="inline-gallery--"]), .inline-gallery--split-2, .inline-gallery--lookbook-v2'
    ).forEach(function (g) { g.style.opacity = ''; });
  }

  document.addEventListener('posts:loaded', function () {
    if (window.innerWidth > BREAKPOINT) return;

    /* Each gallery watches only its own images and reveals itself independently.
       This prevents lazy-loaded galleries below the fold from blocking galleries
       that are already in view. */

    document.querySelectorAll('.inline-gallery:not([class*="inline-gallery--"])').forEach(function (g, idx) {
      var imgs = Array.from(g.querySelectorAll(':scope > .gallery-img'));
      whenLoaded(imgs, function () {
        if (window.innerWidth > BREAKPOINT) return;

        if (idx === 0 && imgs.length > 2) {
          var orders      = [1, 4, 2, 6, 5, 3, 8, 7, 9];
          var visualOrder = [0, 2, 5, 1, 4, 3, 7, 6, 8];
          var orig = imgs.slice();
          imgs.forEach(function (img, i) {
            img.style.order = String(orders[i] !== undefined ? orders[i] : i + 1);
          });
          visualOrder.forEach(function (domIdx, vi) {
            if (orig[domIdx]) imgs[vi] = orig[domIdx];
          });
        }

        if (idx === 1 && imgs.length > 3) {
          var orders6      = [4, 1, 2, 3, 6, 5, 8, 7];
          var visualOrder6 = [1, 2, 3, 0, 5, 4, 7, 6];
          var orig6 = imgs.slice();
          imgs.forEach(function (img, i) {
            img.style.order = String(orders6[i] !== undefined ? orders6[i] : i + 1);
          });
          visualOrder6.forEach(function (domIdx, vi) {
            if (orig6[domIdx]) imgs[vi] = orig6[domIdx];
          });
        }

        processGallery(g, imgs);
        g.style.opacity = '1';
      });
    });

    document.querySelectorAll('.inline-gallery--split-2').forEach(function (g) {
      var imgs = Array.from(g.querySelectorAll(':scope > .gallery-img'));
      whenLoaded(imgs, function () {
        if (window.innerWidth > BREAKPOINT) return;
        processGallery(g);
        g.style.opacity = '1';
      });
    });

    document.querySelectorAll('.inline-gallery--lookbook-v2').forEach(function (g, idx) {
      var imgs = Array.from(g.querySelectorAll('.gallery-img'));
      whenLoaded(imgs, function () {
        if (window.innerWidth > BREAKPOINT) return;
        var allImgs = Array.from(g.querySelectorAll('.gallery-img'));
        if (idx < 2 && allImgs.length > 0) {
          var first = allImgs[0];
          var W = containerW(g);
          var h = Math.round(Math.min(340, Math.max(160, W / aspect(first))));
          first.style.flex     = '0 0 100%';
          first.style.width    = '100%';
          first.style.maxWidth = 'none';
          first.style.minWidth = '0';
          first.style.height   = h + 'px';
          processGallery(g, allImgs.slice(1));
        } else {
          processGallery(g, allImgs);
        }
        g.style.opacity = '1';
      });
    });
  });

  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (window.innerWidth > BREAKPOINT) reset();
      else run();
    }, 150);
  });

})();
