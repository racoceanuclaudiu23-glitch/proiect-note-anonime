// URL-ul backend-ului (merge cu backend-ul tău actual)
const API_BASE = 'http://localhost:3000';

// Așteptăm să se încarce tot HTML-ul
document.addEventListener('DOMContentLoaded', () => {
  // Referințe la elementele din formular
  const form = document.getElementById('notaForm');
  const profesorInput = document.getElementById('profesorId');
  const studentInput = document.getElementById('studentId');
  const valoareInput = document.getElementById('valoareNota');
  const comentariuInput = document.getElementById('comentariu');
  const statusMessage = document.getElementById('statusMessage');

  // Buton + listă pentru zona „Vezi toate notele”
  const incarcaBtn = document.getElementById('incarcaNoteBtn');
  const listaNote = document.getElementById('listaNote');

  // -------------------------------
  // 1. Trimitere notă (rol profesor)
  // -------------------------------
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // nu lăsăm formularul să dea refresh la pagină

    // Resetăm mesajul
    statusMessage.textContent = '';
    statusMessage.style.color = 'red';

    // Construim obiectul trimis la backend
    const payload = {
      profesor_id: profesorInput.value.trim(),
      student_id: studentInput.value.trim(),
      valoare: parseFloat(valoareInput.value),
      comentariu: comentariuInput.value.trim()
    };

    // Validări simple în frontend
    if (!payload.profesor_id || !payload.student_id || isNaN(payload.valoare)) {
      statusMessage.textContent = 'Completează toate câmpurile și o notă validă (0–10).';
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/api/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();

      if (!resp.ok) {
        statusMessage.textContent = data.error || 'A apărut o eroare la trimiterea notei.';
        return;
      }

      // Dacă ajungem aici, totul e ok
      statusMessage.style.color = 'green';
      statusMessage.textContent = 'Nota a fost trimisă cu succes!';
      form.reset();
    } catch (err) {
      console.error('Eroare la fetch /api/note', err);
      statusMessage.textContent = 'A apărut o eroare la trimiterea notei.';
    }
  });

  // ---------------------------------
  // 2. Încărcare toate notele existente
  // ---------------------------------
  async function incarcaNote() {
    statusMessage.textContent = '';

    try {
      const resp = await fetch(`${API_BASE}/api/note`);
      const data = await resp.json();

      // Golește lista
      listaNote.innerHTML = '';

      if (!data.note || data.note.length === 0) {
        listaNote.textContent = 'Nu există note încă.';
        return;
      }

      // Afișăm fiecare notă într-un <li>
      data.note.forEach((n) => {
        const li = document.createElement('li');
        li.textContent =
          `Profesor: ${n.profesor_id} | ` +
          `Student: ${n.student_id} | ` +
          `Notă: ${n.valoare} | ` +
          `Comentariu: ${n.comentariu || '-'} | ` +
          `Data: ${n.data}`;
        listaNote.appendChild(li);
      });
    } catch (err) {
      console.error('Eroare la fetch /api/note', err);
      statusMessage.textContent = 'A apărut o eroare la încărcarea notelor.';
    }
  }

  // Legăm funcția la buton
  incarcaBtn.addEventListener('click', incarcaNote);
});
