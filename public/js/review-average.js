document.addEventListener('DOMContentLoaded', async () => {
  const averageBox = document.getElementById('average-rating');
  const eventId = averageBox?.dataset.event;

  if (!averageBox || !eventId) return;

  try {
    const response = await fetch(`/review/${eventId}/average`);
    const data = await response.json();

    if (data.average) {
      averageBox.textContent = `Gennemsnitlig rating: ${data.average} ⭐`;
    } else {
      averageBox.textContent = 'Ingen anmeldelser endnu';
    }
  } catch (err) {
    console.error('Kunne ikke hente gennemsnit:', err);
    averageBox.textContent = 'Fejl ved hentning af rating';
  }
});
