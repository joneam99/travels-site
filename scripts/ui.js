(function () {

  // ── PAGE TRANSITION ───────────────────────────────────────
  const overlay = document.getElementById('page-overlay');
  if (overlay) {
    const fadeOut = () => {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    };
    requestAnimationFrame(() => requestAnimationFrame(fadeOut));

    // bfcache에서 복원 시 (뒤로가기) overlay 강제 해제
    window.addEventListener('pageshow', e => {
      if (e.persisted) fadeOut();
    });

    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('mailto') || href.startsWith('tel') ||
          a.target === '_blank') return;
      e.preventDefault();
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'all';
      setTimeout(() => { window.location.href = href; }, 360);
    });
  }

  // ── CUSTOM CURSOR ─────────────────────────────────────────
  const cursor = document.getElementById('custom-cursor');
  if (!cursor) return;

  let visible = false;

  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
    if (!visible) { cursor.style.opacity = '1'; visible = true; }
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    visible = false;
  });

  window.setCursorState = function (state) {
    cursor.className = 'custom-cursor' + (state ? ' ' + state : '');
  };

})();
