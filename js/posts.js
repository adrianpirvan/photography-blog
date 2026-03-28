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

    // Body → split on blank lines, wrap each chunk in <p>
    const bodyHtml = body
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => p.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'))
      .map(p => `<p>${p}</p>`)
      .join('');

    // Photo list: lines like "- photos/foo.jpg" or "- photos/foo.jpg 0.8"
    const photoFiles = (photos.match(/- photos\/[^\r\n]+/g) || [])
      .map(line => {
        const parts = line.slice(2).trim().split(/\s+/);
        const src   = `content/${slug}/${parts[0]}`;
        const style = parts[1] ? ` style="--w-mult:${parseFloat(parts[1])}"` : '';
        return { src, style };
      });

    return { title, category, date, bodyHtml, photos: photoFiles };
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

  function buildPostHTML(data, id, index) {
    const imgs = data.photos.map((photo, i) => {
      const loading = (index === 0 && i < 2) ? 'eager' : 'lazy';
      return `<img class="carousel-img" src="${photo.src}" alt="${data.title}" loading="${loading}" draggable="false"${photo.style}>`;
    }).join('\n        ');

    return `
  <article class="post" id="${id}">
    <p class="post-meta">${data.category} • ${data.date}</p>
    <h1 class="post-title">${data.title}</h1>
    <div class="post-body">${data.bodyHtml}</div>
    <div class="carousel-wrapper">
      <div class="photo-carousel" role="region" aria-label="Post photos, scroll horizontally">
        ${imgs}
      </div>
    </div>
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
      main.innerHTML = posts.map((p, i) => buildPostHTML(p.data, p.id, i)).join('');

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
