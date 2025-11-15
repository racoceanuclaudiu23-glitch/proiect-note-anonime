# Aplicație web pentru acordarea anonimă de note

## Descriere

Aplicația este o platformă web tip Single Page Application (SPA) care permite acordarea de punctaje anonime de către un juriu anonim de studenți pentru proiectele altor studenți.

## Obiectiv

- Studenții își pot înscrie proiectele și livrabilele parțiale.
- Pentru fiecare livrabil parțial, un juriu de studenți este selectat aleatoriu.
- Membrii juriului pot acorda note între 1 și 10, cu până la 2 zecimale.
- Nota finală a unui proiect se calculează omitând cea mai mare și cea mai mică notă.
- Profesorul poate vedea evaluările proiectelor fără a vedea identitatea membrilor juriului.
- Platforma implementează un sistem de permisiuni (student, membru juriu, profesor).

## Tehnologii planificate

- Frontend: React + Vite (SPA)
- Backend: Node.js + Express (REST API)
- Bază de date: SQLite
