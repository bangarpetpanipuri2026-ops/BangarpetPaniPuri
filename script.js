// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, orderBy, where, onSnapshot } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Firebase configuration (same as admin)
const firebaseConfig = {
  apiKey: "AIzaSyDElY-ymgLDDpsLCmwP_nArVq3cZVcD-VU",
  authDomain: "fir-project-ad1c8.firebaseapp.com",
  projectId: "fir-project-ad1c8",
  storageBucket: "fir-project-ad1c8.firebasestorage.app",
  messagingSenderId: "726974224635",
  appId: "1:726974224635:web:eba30088877932befa785e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

  // TEMPORARILY DISABLE GRAND OPENING - set to true to disable
  const TEMP_DISABLE_GRAND_OPENING = true;

  // ==========================================
  // GRAND OPENING
  // ==========================================

  // Handle grand opening based on temporary disable flag
  var intro = document.getElementById('grandOpening');
  var video = document.getElementById('grandOpeningVideo');

  if (TEMP_DISABLE_GRAND_OPENING) {
    // TEMPORARILY DISABLE GRAND OPENING - remove element entirely
    if (intro) {
      intro.remove();
      console.log('Grand Opening: temporarily disabled - element removed from DOM');
    }
    // Ensure variables are defined (possibly null) for applyConfig function
  } else {
    // Run normal grand opening logic
    // Make sure the Grand Opening HTML exists
    if (intro && video) {

      var hasSeenIntro =
        localStorage.getItem('bangarpetGrandOpening');

      console.log('Grand Opening: hasSeenIntro =', hasSeenIntro);

      // Already seen → remove immediately
      if (hasSeenIntro === 'true') {
        console.log('Grand Opening: already seen, removing intro');
        intro.remove();

      } else {
        console.log('Grand Opening: showing intro');

        // Finish the intro
        function finishIntro() {
          console.log('Grand Opening: finishIntro called');
          // Prevent this function from running multiple times
          if (!intro || intro.classList.contains('hide')) {
            console.log('Grand Opening: finishIntro early return');
            return;
          }

          localStorage.setItem(
            'bangarpetGrandOpening',
            'true'
          );
          console.log('Grand Opening: set localStorage true');

          intro.classList.add('hide');
          console.log('Grand Opening: added hide class');

          // Remove after transition ends (opacity transition 0.7s)
          intro.addEventListener('transitionend', function removeIntro(e) {
            if (e.propertyName === 'opacity') {
              intro.removeEventListener('transitionend', removeIntro);
              if (intro) {
                intro.remove();
                console.log('Grand Opening: removed intro from DOM via transitionend');
              }
            }
          });

          // Fallback timer
          setTimeout(function () {
            if (intro) {
              intro.remove();
              console.log('Grand Opening: removed intro from DOM via fallback timer');
            }
          }, 1000);
        }

        // When video finishes
        video.addEventListener(
          'ended',
          finishIntro
        );
        console.log('Grand Opening: attached ended listener');

        // Allow clicking to dismiss
        intro.addEventListener('click', finishIntro);
        video.addEventListener('click', finishIntro);
        console.log('Grand Opening: attached click listeners');

        // Backup timer
        setTimeout(
          finishIntro,
          1500
        );
        console.log('Grand Opening: set backup timer 1500ms');

        // Make sure video starts
        video.play().catch(function (e) {
          console.log('Grand Opening: video.play failed, error:', e);
          // If autoplay is blocked, still allow
          // the backup timer to remove the intro.
        });
      }
    }
  }

  // ---- WhatsApp message ----
  const whatsappMessage = `Kia ora! 👋 I'd love to know more about Bangarpet Panipuri. Could you please send me your menu and details?`;

  const whatsappUrl =
    'https://wa.me/+642040015331?text=' +
    encodeURIComponent(whatsappMessage);

  document.querySelectorAll('a[href*="wa.me"]').forEach(function (link) {
    link.href = whatsappUrl;
  });

  // ==========================================
  // FIREBASE REAL-TIME UPDATES
  // ==========================================

  // References
  const configRef = doc(db, "siteConfig", "public");
  const menuQuery = query(collection(db, "menuItems"), where("visible", "==", true), orderBy("order"));

  // State to hold current config
  let currentConfig = {
    sections: {},
    grandOpening: {enabled:true, video:"/photos/videos/grand-opening.mp4", display:"first"},
    story: {visible:true, heading:"From Bangarpet streets to the heart of New Zealand.", text:"Our family-run kitchen brings Bangarpet street-food traditions to New Zealand."},
    featured: {visible:true, heading:"Featured Menu", subheading:""},
    contact: {visible:true, phone:"+64 20 4001 5331", email:"", whatsapp:""},
    social: {}
  };

  // Apply config to UI
  function applyConfig(config) {
    // Temporarily disable grand opening if needed
    if (typeof TEMP_DISABLE_GRAND_OPENING !== 'undefined' && TEMP_DISABLE_GRAND_OPENING) {
      // Override to force disabled state
      config = {...config};
      if (!config.grandOpening) {
        config.grandOpening = {enabled:false};
      } else {
        config.grandOpening = {...config.grandOpening, enabled:false};
      }
    }
    // Merge with defaults
    currentConfig = {...currentConfig, ...config};

    // Update sections visibility
    Object.keys(currentConfig.sections).forEach(sectionId => {
      const visible = currentConfig.sections[sectionId];
      const el = document.getElementById(sectionId);
      if (el) {
        el.style.display = visible ? '' : 'none';
      }
    });
    // Also handle grandOpening container (intro) based on enabled flag
    // Only modify if element still exists in DOM (might have been removed)
    if (intro && intro.parentElement) {
      intro.style.display = currentConfig.grandOpening.enabled ? '' : 'none';
    }
    // Update logo (if we had brand.logoUrl)
    // TODO: implement if needed

    // Update grand opening video
    // Only update if video element still exists in DOM
    if (video && video.parentElement) {
      const vidSrc = currentConfig.grandOpening.video;
      if (vidSrc) {
        const sourceEl = video.querySelector('source');
        if (sourceEl) {
          sourceEl.src = vidSrc;
          video.load();
        }
      }
    }

    // Update hero video (static for now, could be from config)
    // TODO

    // Update story section
    const storyImg = document.querySelector('#story .story-image img');
    const storyHeading = document.getElementById('story-title');
    const storyText = document.querySelector('#story .story-copy p');
    if (storyImg) {
      storyImg.src = currentConfig.story.imageUrl || './photos/site/ourstory.png';
    }
    if (storyHeading) {
      storyHeading.textContent = currentConfig.story.heading || '';
    }
    if (storyText) {
      storyText.textContent = currentConfig.story.text || '';
    }

    // Update contact section
    const contactPhone = document.getElementById('phone');
    const contactEmail = document.getElementById('contactEmail');
    const contactWhatsapp = document.getElementById('whatsapp');
    if (contactPhone) {
      contactPhone.textContent = currentConfig.contact.phone || '';
    }
    if (contactEmail) {
      contactEmail.textContent = currentConfig.contact.email || '';
    }
    if (contactWhatsapp) {
      contactWhatsapp.href = 'https://wa.me/' + currentConfig.contact.whatsapp.replace(/\D/g,'');
      contactWhatsapp.textContent = currentConfig.contact.whatsapp || '';
    }

    // Update footer social links (if we had them)
    // TODO
  }

  // Render menu items from snapshot
  function renderMenuItems(snapshot) {
    const menuGrid = document.getElementById('menu-items-grid');
    if (!menuGrid) return;
    menuGrid.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const itemEl = document.createElement('article');
      itemEl.className = 'menu-item-card';
      itemEl.dataset.category = data.category || 'all';
      itemEl.innerHTML = `
        <div class="menu-item-wrapper">
          <img src="${data.imageUrl || './photos/site/logo.png'}" alt="" loading="lazy">
          <div class="menu-item-content">
            <div class="menu-item-header">
              <h3>${data.name || 'Unnamed'}</h3>
              <span class="menu-item-price">${data.price || ''}</span>
            </div>
            <p class="menu-item-ingredients">${data.description || ''}</p>
          </div>
        </div>
      `;
      menuGrid.appendChild(itemEl);
    });
    // Update empty state based on whether any items after filtering? We'll rely on tab filtering.
    // We'll trigger applyFilter for current active tab to show empty state if needed.
    const activeTab = document.querySelector('.menu-tab.active');
    if (activeTab) {
      applyFilter(activeTab.getAttribute('data-filter'));
    }
  }

  // Set up real-time listeners
  // Config listener
  onSnapshot(configRef, (docSnap) => {
    if (docSnap.exists()) {
      applyConfig(docSnap.data());
    } else {
      // No config yet, apply defaults
      applyConfig({});
    }
  }, (error) => {
    console.error("Error listening to config:", error);
    // Fallback to defaults
    applyConfig({});
  });

  // Menu items listener
  onSnapshot(menuQuery, (snapshot) => {
    renderMenuItems(snapshot);
  }, (error) => {
    console.error("Error listening to menu items:", error);
    // Optionally fallback to static menu (hardcoded)
  });
});