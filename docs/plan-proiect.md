# Plan de proiect – Aplicație web pentru acordarea anonimă de note

## 1. Obiectiv general

Dezvoltarea unei aplicații web de tip Single Page Application (SPA) care permite:
- înscrierea proiectelor și definirea livrabilelor parțiale;
- selectarea aleatorie a unui juriu de studenți;
- acordarea anonimă de note (1–10, cu până la două zecimale);
- calculul notei finale pe livrabil (fără cea mai mare și cea mai mică notă);
- vizualizarea rezultatelor de către profesor, fără identitatea evaluatorilor.

---

## 2. Tehnologii planificate

- **Frontend (SPA)**: React + Vite
- **Backend (REST API)**: Node.js + Express
- **Bază de date**: SQLite
- **Control versiuni**: Git + (GitHub pentru repository remote)
- **Format schimb date**: JSON

---

## 3. Etape și livrabile (conform cerințelor)

### Etapa 1 – Specificații detaliate + proiect în Git  
**Deadline:** 16.11.2025  

**Livrabile:**
- Repository Git inițializat, structurat pe backend + frontend + documentație.
- Documentul de specificații (`docs/specificatii.md`) completat.
- Planul de proiect (`docs/plan-proiect.md`) completat.

**Task-uri principale:**
1. Analiză cerințe și definire actori / roluri / fluxuri principale.
2. Definire reguli de business pentru:
   - selecția juriului,
   - acordarea și modificarea notelor,
   - calculul notei finale.
3. Schiță model de date (entități + relații, la nivel logic).
4. Alegerea stack-ului tehnic (React + Node.js + SQLite) și documentarea lui în README.
5. Organizarea structurii de proiect:
   - folder `docs` – documentație,
   - folder `backend` – API REST (va fi implementat în etapa 2),
   - folder `frontend` – SPA (va fi implementat în etapa 3).
6. Crearea și commit-ul documentației în Git.

---

### Etapa 2 – Serviciu REST funcțional + instrucțiuni de rulare  
**Deadline:** 06.12.2025  

**Livrabile:**
- Backend Node.js + Express funcțional, cu bază de date SQLite.
- Endpoint-uri REST implementate pentru funcționalitățile de bază.
- Fișier cu instrucțiuni de rulare (`backend/README.md` sau `docs/rulare-backend.md`).

**Task-uri planificate:**
1. Inițializare proiect backend (Node.js + Express):
   - configurare `package.json`,
   - configurare scripturi de start.
2. Definire structură backend:
   - `models/` (entități: User, Project, Deliverable, JuryAssignment, Grade),
   - `routes/` (rute pentru autentificare, proiecte, livrabile, jurizare),
   - `controllers/` (logica fiecărei rute).
3. Configurare și creare bază de date SQLite:
   - tabelele corespunzătoare modelului de date,
   - migrații script (opțional).
4. Implementare API REST minim:
   - creare user / login,
   - creare proiect + livrabile,
   - alocare juriu (variantă simplificată),
   - acordare/actualizare notă de către juriu,
   - calcul nota finală pentru un livrabil.
5. Testare API cu Postman / Thunder Client.
6. Scriere instrucțiuni de rulare:
   - cum se instalează dependențele (`npm install`),
   - cum se pornește serverul (`npm run dev` / `npm start`),
   - ce endpoint-uri sunt disponibile pentru test.

---

### Etapa 3 – Aplicația completă (SPA + demo)  
**Deadline:** Ultimul seminar (demo proiect)  

**Livrabile:**
- Aplicație web completă SPA (frontend React) conectată la backend.
- Funcționalitățile descrise în specificații implementate la nivel de UI.
- Demo funcțional prezentat la seminar (scenariu de utilizare complet).

**Task-uri planificate:**
1. Inițializare proiect frontend (React + Vite):
   - structura de bază (pagini, componente, servicii API).
2. Implementare UI pentru:
   - autentificare și înregistrare utilizator,
   - vizualizare și creare proiecte + livrabile (rol MP),
   - ecran pentru evaluator (listă proiecte alocate, formular de notare),
   - ecran pentru profesor (listă proiecte, vizualizare note + note finale).
3. Integrare cu backend-ul prin API REST:
   - servicii JavaScript pentru apelarea endpoint-urilor,
   - gestionare token de autentificare (ex: stocare în localStorage).
4. Implementare regulă de business în UI:
   - afișarea notei finale (după eliminarea celei mai mari și mici note),
   - afișarea perioadei de evaluare,
   - dezactivarea modificării notei după expirarea termenului.
5. Design responsiv (layout care funcționează și pe mobil și pe desktop).
6. Testare end-to-end cu scenarii:
   - student creează proiect,
   - sistemul/judecătorii acordă note,
   - profesor verifică rezultatele.
7. Pregătirea demo-ului:
   - conturi de test (student, evaluator, profesor),
   - date de test în baza de date,
   - scenariu de prezentare clar.

---

## 4. Organizarea activității (workflow)

- Task-urile vor fi lucrate incremental, pe ramura principală (`master` sau `main`) sau pe branch-uri separate pentru funcționalități.
- Fiecare modificare importantă va fi însoțită de un commit Git cu mesaj clar (ex: `Add deliverable model`, `Implement grade calculation`).
- După etapa 2 și etapa 3 vor fi făcute tag-uri / release-uri intermediare (opțional) pentru versiunea curentă a aplicației.

---

## 5. Riscuri și simplificări posibile

- **Complexitatea selecției juriului** – dacă algoritmul aleatoriu devine prea complicat, se poate implementa inițial o variantă simplificată (ex: selectare manuală sau random dintr-o listă mică).
- **Timp limitat pentru frontend** – în caz de timp insuficient, UI-ul poate fi simplificat (mai puțin design, focus pe funcționalitate).
- **Probleme cu autentificarea** – dacă integrarea JWT devine dificilă, se poate începe cu o sesiune simplificată, apoi extinde.

Scopul final rămâne respectarea funcționalităților esențiale: roluri, anonimitate, acordare note și calcul nota finală.
