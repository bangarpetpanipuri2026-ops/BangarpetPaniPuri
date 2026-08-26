document.addEventListener('DOMContentLoaded', function () {

  // ---- Footer year ----
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ---- Mobile nav toggle ----
  var menuToggle = document.querySelector('.menu-toggle');
  var siteNav = document.getElementById('site-nav');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', function () {
      var isOpen = siteNav.classList.toggle('open');
      menuToggle.setAttribute(
        'aria-expanded',
        isOpen ? 'true' : 'false'
      );
    });

    siteNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        siteNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Menu tab filtering ----
  var tabs = document.querySelectorAll('.menu-tab');
  var cards = document.querySelectorAll('.menu-item-card');
  var emptyState = document.getElementById('menu-empty-state');

  function applyFilter(filter) {
    var visibleCount = 0;

    cards.forEach(function (card) {
      var category = card.getAttribute('data-category');
      var matches = filter === 'all' || category === filter;

      card.classList.toggle('hidden', !matches);

      if (matches) {
        visibleCount++;
      }
    });

    if (emptyState) {
      emptyState.hidden = visibleCount > 0;
      emptyState.classList.toggle(
        'visible',
        visibleCount === 0
      );
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {

      tabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      applyFilter(tab.getAttribute('data-filter'));
    });
  });

  // Initial menu state
  applyFilter('all');


  // ==========================================
  // GRAND OPENING
  // ==========================================

  var intro = document.getElementById('grandOpening');
  var video = document.getElementById('grandOpeningVideo');

  // Make sure the Grand Opening HTML exists
  if (intro && video) {

    var hasSeenIntro =
      localStorage.getItem('bangarpetGrandOpening');

    // Already seen → remove immediately
    if (hasSeenIntro === 'true') {

      intro.remove();

    } else {

      // Finish the intro
      function finishIntro() {

        // Prevent this function from running multiple times
        if (!intro || intro.classList.contains('hide')) {
          return;
        }

        localStorage.setItem(
          'bangarpetGrandOpening',
          'true'
        );

        intro.classList.add('hide');

        setTimeout(function () {
          if (intro) {
            intro.remove();
          }
        }, 700);
      }

      // When video finishes
      video.addEventListener(
        'ended',
        finishIntro
      );

      // Backup timer
      setTimeout(
        finishIntro,
        3000
      );

      // Make sure video starts
      video.play().catch(function () {
        // If autoplay is blocked, still allow
        // the backup timer to remove the intro.
      });
    }
  }

});

  // ---- WhatsApp message ----
  const whatsappMessage = `Kia ora! 👋 I'd love to know more about Bangarpet Panipuri. Could you please send me your menu and details?`;

  const whatsappUrl =
    'https://wa.me/642040015331?text=' +
    encodeURIComponent(whatsappMessage);

  document.querySelectorAll('a[href*="wa.me"]').forEach(function (link) {
    link.href = whatsappUrl;
  });
