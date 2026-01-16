# Aplicație web pentru acordarea anonimă de note

## Link aplicație (deploy)

- **Backend (API):** https://project-note-anonime.onrender.com  
- **Health check:** https://project-note-anonime.onrender.com/api/health  

 Aplicația backend este deployată pe platforma **Render** și este accesibilă public.

---

## Descriere

Aplicația este o platformă web de tip **Single Page Application (SPA)** care permite acordarea de punctaje **anonime** de către un juriu anonim de studenți pentru proiectele altor studenți.

Evaluarea este realizată fără a dezvălui identitatea evaluatorilor, iar profesorul poate vizualiza rezultatele finale centralizate.

---

## Obiectiv

- Studenții își pot înscrie proiectele și livrabilele parțiale.
- Membrii juriului pot acorda note între **1 și 10**, cu până la **2 zecimale**.
- Nota finală se calculează eliminând **cea mai mare și cea mai mică notă**.
- Profesorul vede toate notele **fără a vedea evaluatorii**.
- Platforma definește roluri: **student, evaluator, profesor**.

---

## Tehnologii utilizate

### Backend
- **Node.js**
- **Express.js** – REST API
- **Prisma ORM**
- **SQLite** – bază de date
- **CORS** – middleware pentru cereri cross-origin
- **dotenv** – variabile de mediu

### Frontend
- **HTML**
- **JavaScript**
- **React (Vite)** – interfață SPA (versiune demo)

### Altele
- **Git & GitHub** – controlul versiunilor
- **Render** – deploy backend



## Instrucțiuni de rulare locală

### Cerințe
- **Node.js** minim versiunea **18**
- **npm**

Verificare:
```md
node -v
npm -v
### Pornire BACKEND (LOCAL)
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm start
### Pornire FRONTEND (LOCAL)
cd frontend
npm install
npm run dev
