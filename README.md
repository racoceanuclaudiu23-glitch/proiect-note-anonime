# Aplicație web pentru acordarea anonimă de note

## Descriere
Aplicația este o platformă web tip Single Page Application (SPA) care permite acordarea de punctaje anonime de către un juriu anonim de studenți pentru proiectele altor studenți.

---

## Obiectiv
- Studenții își pot înscrie proiectele și livrabilele parțiale.
- Membrii juriului pot acorda note între 1 și 10, cu până la 2 zecimale.
- Nota finală se calculează eliminând cea mai mare și cea mai mică notă.
- Profesorul vede toate notele fără a vedea evaluatorii.
- Platforma are roluri: student, evaluator, profesor.

---

## Tehnologii utilizate
- Frontend: HTML + JavaScript (versiune demo)
- Backend: Node.js + Express (REST API)
- Bază de date: SQLite
- Control versiuni: Git + GitHub

---

# Instrucțiuni de rulare

## 1. Cerințe
- Node.js minim versiunea 18
- npm

Verificare în terminal:
```bash
node -v
npm -v
