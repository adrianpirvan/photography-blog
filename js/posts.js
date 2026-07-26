/* ============================================
   POSTS.JS — Loads and renders blog posts from markdown files.
   To add a post: create content/<slug>/article.md and add an
   entry to content/posts.json. No changes to index.html needed.
   ============================================ */

(function () {

  // ─── Markdown parser ────────────────────────────────────────────────────────

  function parseArticle(text, slug) {
    // Split on horizontal-rule separator lines
    const parts = text.split(/\r?\n---\r?\n/);
    const header = parts[0] || '';
    const body   = (parts[1] || '').trim();
    const photos =  parts[2] || '';

    // Title: first "# " line
    const titleMatch = header.match(/^# (.+)/m);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s*\|\s*/g, '<br>') : '';

    // Category and date
    const catMatch  = header.match(/\*\*Category:\*\*\s*(.+)/);
    const dateMatch = header.match(/\*\*Date:\*\*\s*(.+)/);
    const category  = catMatch  ? catMatch[1].trim()  : '';
    const date      = dateMatch ? dateMatch[1].trim() : '';

    // Body → parse into sections (text blocks and inline galleries)
    const bodySections = parseBodySections(body, slug);

    // Photo list: lines like "- photos/foo.jpg" or "- photos/foo.jpg 0.8"
    const photoFiles = (photos.match(/- photos\/[^\r\n]+/g) || [])
      .map(line => {
        const parts = line.slice(2).trim().split(/\s+/);
        const src   = `content/${slug}/${parts[0]}`;
        const style = parts[1] ? ` style="--w-mult:${parseFloat(parts[1])}"` : '';
        return { src, style };
      });

    return { title, category, date, bodySections, photos: photoFiles };
  }

  // ─── Inline gallery parser ───────────────────────────────────────────────────

  function parseBodySections(body, slug) {
    const sections = [];
    const galleryRe = /\[\[gallery([^\]]*)\]\]([\s\S]*?)\[\[\/gallery\]\]/g;
    let lastIndex = 0;
    let match;

    while ((match = galleryRe.exec(body)) !== null) {
      const textBefore = body.slice(lastIndex, match.index).trim();
      if (textBefore) sections.push({ type: 'text', content: textBefore });

      const layout = match[1].trim() || 'default';
      const images = match[2].trim().split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
        .map(line => {
          const featured = line.startsWith('*');
          const rest     = featured ? line.slice(1) : line;
          const parts    = rest.trim().split(/\s+/);
          const src      = parts[0].startsWith('http') ? parts[0] : `content/${slug}/${parts[0]}`;
          const position = parts.length > 1 ? parts.slice(1).join(' ') : null;
          return { src, featured, position };
        });

      sections.push({ type: 'gallery', layout, images });
      lastIndex = match.index + match[0].length;
    }

    const remaining = body.slice(lastIndex).trim();
    if (remaining) sections.push({ type: 'text', content: remaining });

    return sections;
  }

  function buildInlineGallery(section, loading) {
    if (section.layout === 'lookbook' || section.layout === 'lookbook-alt') return buildLookbookGallery(section.images, loading, section.layout);
    if (section.layout.startsWith('lookbook-v2')) {
      const rightCount = parseInt(section.layout.split(/\s+/)[1]) || 0;
      return buildLookbookV2Gallery(section.images, loading, rightCount);
    }

    const imgs = section.images.map(({ src, position }) => {
      const srcsetAttr = src.startsWith('http') ? '' : ` srcset="${webpSrcset(src)}" sizes="(max-width: 600px) 100vw, (max-width: 900px) 80vw, 60vw"`;
      const posStyle   = position ? ` style="object-position: ${position}"` : '';
      return `<img class="gallery-img" src="${src}"${srcsetAttr} alt="" loading="${loading}" draggable="false"${posStyle}>`;
    }).join('');
    const extraClass = section.layout !== 'default' ? ` inline-gallery--${section.layout}` : '';
    return `<div class="inline-gallery${extraClass}">${imgs}</div>`;
  }

  function buildLookbookGallery(images, loading, layout = 'lookbook') {
    const featIdx  = images.findIndex(img => img.featured);
    const featured = images[featIdx >= 0 ? featIdx : Math.floor(images.length / 2)];
    const thumbs   = images.filter(img => img !== featured);

    const featSrcset = featured.src.startsWith('http') ? '' : ` srcset="${webpSrcset(featured.src)}" sizes="(max-width: 600px) 100vw, (max-width: 900px) 80vw, 60vw"`;
    const featured_html = `<img class="gallery-img lb-featured" src="${featured.src}"${featSrcset} alt="" loading="${loading}" draggable="false">`;

    const thumbs_html = thumbs.map(({ src, position }) => {
      const srcsetAttr = src.startsWith('http') ? '' : ` srcset="${webpSrcset(src)}" sizes="(max-width: 600px) 100vw, (max-width: 900px) 80vw, 60vw"`;
      const posStyle   = position ? ` style="object-position: ${position}"` : '';
      return `<img class="gallery-img" src="${src}"${srcsetAttr} alt="" loading="lazy" draggable="false"${posStyle}>`;
    }).join('');

    return `<div class="inline-gallery inline-gallery--${layout}">${featured_html}<div class="lb-thumbs">${thumbs_html}</div></div>`;
  }

  function buildLookbookV2Gallery(images, loading, rightCount) {
    const featIdx  = images.findIndex(img => img.featured);
    const featured = images[featIdx >= 0 ? featIdx : 0];
    const thumbs   = images.filter(img => img !== featured);

    const N            = rightCount > 0 ? rightCount : thumbs.length;
    const rightPhotos  = thumbs.slice(0, N);
    const belowPhotos  = thumbs.slice(N);

    const buildImgs = (photos) => photos.map(({ src, position }) => {
      const srcsetAttr = src.startsWith('http') ? '' : ` srcset="${webpSrcset(src)}" sizes="(max-width: 600px) 100vw, (max-width: 900px) 80vw, 60vw"`;
      const posStyle   = position ? ` style="object-position: ${position}"` : '';
      return `<img class="gallery-img" src="${src}"${srcsetAttr} alt="" loading="lazy" draggable="false"${posStyle}>`;
    }).join('');

    const featSrcset = featured.src.startsWith('http') ? '' : ` srcset="${webpSrcset(featured.src)}" sizes="(max-width: 600px) 100vw, (max-width: 900px) 80vw, 60vw"`;
    const featPos    = featured.position ? ` style="object-position: ${featured.position}"` : '';
    const featured_html = `<img class="gallery-img lb-featured" src="${featured.src}"${featSrcset} alt="" loading="${loading}" draggable="false"${featPos}>`;

    const below_html = belowPhotos.length > 0
      ? `<div class="lbv2-below">${buildImgs(belowPhotos)}</div>`
      : '';

    return `<div class="inline-gallery inline-gallery--lookbook-v2"><div class="lbv2-top">${featured_html}<div class="lbv2-right" data-count="${rightPhotos.length}">${buildImgs(rightPhotos)}</div></div>${below_html}</div>`;
  }

  // ─── srcset builder ─────────────────────────────────────────────────────────

  function webpSrcset(src) {
    const base = src.replace(/\.[^.]+$/, '');
    return `${base}-800.webp 800w, ${base}-1600.webp 1600w, ${base}-2400.webp 2400w`;
  }

  // ─── Date formatter ─────────────────────────────────────────────────────────

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function shortDate(dateStr) {
    const s = dateStr.trim();
    // No slashes → already formatted, use as-is
    if (!s.includes('/')) return s;
    // "dd/mm/yy" → "Jan '26"
    const parts = s.split('/');
    const month = parseInt(parts[1], 10);
    const year  = parts[2];
    return `${MONTHS[month - 1]} '${year}`;
  }

  // ─── HTML builders ──────────────────────────────────────────────────────────

  function buildPostHTML(data, id, slug, index) {
    // Render body sections (alternating text blocks and inline galleries)
    const bodyContent = data.bodySections.map((section, si) => {
      if (section.type === 'gallery') {
        const loading = (index === 0 && si === 0) ? 'eager' : 'lazy';
        return buildInlineGallery(section, loading);
      }
      const html = section.content
        .split(/\n\n+/)
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => p.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'))
        .map(p => `<p>${p}</p>`)
        .join('');
      return `<div class="post-body">${html}</div>`;
    }).join('');

    // Trailing carousel — only rendered for posts using the old photo-list format
    const carouselHtml = data.photos.length > 0 ? `
    <div class="carousel-wrapper">
      <div class="photo-carousel" role="region" aria-label="Post photos, scroll horizontally">
        ${data.photos.map((photo, i) => {
          const loading = (index === 0 && i < 2) ? 'eager' : 'lazy';
          const hdSrc = photo.src.replace(/\.[^.]+$/, '') + '-2400.webp';
          return `<img class="carousel-img" src="${photo.src}" srcset="${webpSrcset(photo.src)}" sizes="(max-width: 600px) 86vw, (max-width: 900px) 70vw, 46vw" data-hd-src="${hdSrc}" alt="${data.title}" loading="${loading}" draggable="false"${photo.style}>`;
        }).join('\n        ')}
      </div>
    </div>` : '';

    return `
  <article class="post" id="${id}" data-slug="${slug}">
    <p class="post-meta">${data.category} • ${data.date}</p>
    <h1 class="post-title">${data.title}</h1>
    ${bodyContent}
    ${carouselHtml}
  </article>`;
  }

  function buildTimelineMarkers(posts) {
    const timeline = document.querySelector('.timeline');
    if (!timeline) return;

    // Clear any existing markers (keep .tl-track / .tl-fill)
    timeline.querySelectorAll('.tl-marker').forEach(m => m.remove());

    // One marker sits between each adjacent pair of posts
    for (let i = 0; i < posts.length - 1; i++) {
      const above = posts[i];
      const below = posts[i + 1];

      const btn = document.createElement('button');
      btn.className           = 'tl-marker';
      btn.dataset.above       = above.id;
      btn.dataset.below       = below.id;
      btn.dataset.labelUp     = shortDate(above.data.date);
      btn.dataset.labelDown   = shortDate(below.data.date);
      btn.setAttribute('aria-label', 'Scroll to next article');
      btn.innerHTML = '<span class="tl-dot"></span><span class="tl-marker-label"></span>';
      timeline.appendChild(btn);
    }
  }

  // ─── Loader ─────────────────────────────────────────────────────────────────

  async function loadPosts() {
    const main = document.querySelector('.stories-page');
    if (!main) return;

    try {
      const manifest = await fetch('content/posts.json', { cache: 'no-cache' }).then(r => r.json());

      // Fetch all markdown files in parallel, bypassing cache so edits show up on refresh
      const texts = await Promise.all(
        manifest.map(p => fetch(`content/${p.slug}/article.md`, { cache: 'no-cache' }).then(r => r.text()))
      );

      // Parse
      const posts = manifest.map((p, i) => ({
        id:   p.id,
        slug: p.slug,
        data: parseArticle(texts[i], p.slug),
      }));

      // Render posts
      main.innerHTML = posts.map((p, i) => buildPostHTML(p.data, p.id, p.slug, i)).join('');

      // Rebuild timeline markers from live post data
      buildTimelineMarkers(posts);

      // Signal carousel.js and timeline.js to initialise
      document.dispatchEvent(new CustomEvent('posts:loaded'));

    } catch (err) {
      console.error('Posts failed to load:', err);
      main.innerHTML = `
        <p style="text-align:center;padding:80px 24px;color:#aaa;font-size:0.9rem">
          Posts could not be loaded.<br>
          Please serve this site from a local server:<br><br>
          <code style="background:#f5f5f5;padding:4px 10px;border-radius:4px">python3 -m http.server 8000</code>
        </p>`;
    }
  }

  document.addEventListener('DOMContentLoaded', loadPosts);

})();
