document.addEventListener('DOMContentLoaded', function() {
  const openBtn = document.getElementById('open-review-popup');
  const popup = document.getElementById('review-popup');
  const closeBtn = document.querySelector('#review-popup .popup-close');

  if (!popup) {
    console.warn('review-popup element not found');
    return;
  }

  if (openBtn) {
    openBtn.addEventListener('click', function(e) {
      e.preventDefault();
      popup.classList.remove('hidden');
    });
  } else {
    console.warn('open-review-popup button not found');
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      popup.classList.add('hidden');
    });
  }

  popup.addEventListener('click', function(e) {
    if (e.target === popup) {
      popup.classList.add('hidden');
    }
  });
});