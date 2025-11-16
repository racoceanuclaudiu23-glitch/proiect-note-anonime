# Specificații detaliate – Aplicație web pentru acordarea anonimă de note

## 1. Scopul aplicației

Aplicația permite acordarea de punctaje anonime pentru proiectele studenților, de către un juriu format tot din studenți. Evaluarea se face pe baza unor livrabile parțiale, iar nota finală este calculată automat, respectând reguli prestabilite (eliminarea celei mai mari și a celei mai mici note).

Aplicația este de tip Single Page Application (SPA), accesibilă din browser de pe desktop, tabletă și telefon mobil.

---

## 2. Actori și roluri

1. **Student membru de proiect (MP)**  
   - Este studentul care face parte din echipa unui proiect.  
   - Poate înscrie un proiect în platformă.  
   - Poate defini livrabile parțiale pentru proiect.  
   - Poate încărca linkuri sau video-uri demonstrative pentru fiecare livrabil.  
   - Devine automat și **posibil evaluator** în juriul altor proiecte.

2. **Student evaluator / membru al juriului**  
   - Orice student înscris în platformă poate fi ales aleatoriu în juriul unui proiect (dacă nu este MP la acel proiect).  
   - Poate vizualiza detaliile proiectului și livrabilul curent, doar dacă a fost selectat în juriu.  
   - Poate acorda o notă proiectului pentru livrabilul respectiv.  
   - Poate modifica doar **propria notă**, într-o perioadă de timp limitată (fereastră de evaluare).

3. **Profesor**  
   - Poate vizualiza lista tuturor proiectelor și a livrabilelor.  
   - Poate vizualiza toate notele acordate unui proiect și nota finală calculată.  
   - **Nu** poate vedea identitatea membrilor juriului (evaluatorii rămân anonimi).

4. **Administrator (opțional, dacă este nevoie)**  
   - Gestionează conturile (activare/dezactivare).  
   - Poate reseta parole / configura perioade de evaluare.  
   - Poate vedea loguri tehnice (nu este obligatoriu pentru cerința minimă).

---

## 3. Tipuri de utilizatori și autentificare

- Fiecare utilizator are un cont cu:
  - email / username
  - parolă
  - rol (student, profesor, admin)
- Autentificarea se face cu email + parolă.
- După autentificare, backend-ul emite un **token de sesiune** (ex: JWT) folosit de SPA pentru apelurile REST.
- Nu se afișează numele evaluatorilor lângă note; legătura notă–utilizator este stocată doar în baza de date, dar profesorul nu o poate vedea din interfață.

---

## 4. Funcționalități principale

### 4.1. Funcționalități pentru student membru de proiect (MP)

- Creează un proiect nou:
  - titlu
  - descriere
  - tehnologie folosită (opțional)
  - membrii echipei (lista de studenți)
- Definește livrabile parțiale pentru proiect:
  - denumire livrabil (ex: „Specificații detaliate”, „Serviciu REST funcțional”, „Aplicație completă”)
  - descriere
  - data-limită de livrare.
- Pentru fiecare livrabil:
  - adaugă un **link video demonstrativ** (ex: YouTube, Stream) **sau**
  - adaugă un **link către server / repo / demo**.
- Poate vizualiza notele agregate primite (nota finală), dar nu vede cine a oferit fiecare notă.

### 4.2. Funcționalități pentru student evaluator / membru al juriului

- Primește automat (aleatoriu) atribuirea într-un juriu pentru unul sau mai multe proiecte (nu poate fi juriu la propriul proiect).
- Poate vedea detaliile proiectului și livrabilului **doar** pentru proiectele la care este în juriu.
- Poate acorda o notă pentru un livrabil:
  - valoare în intervalul [1, 10]
  - se acceptă până la 2 zecimale (ex: 8.50, 9.25).
- Poate modifica propria notă:
  - doar în perioada activă de evaluare (ex: până la data-limită a livrabilului + X ore).
- Nu poate vedea identitatea celorlalți membri ai juriului.

### 4.3. Funcționalități pentru profesor

- Vizualizează lista proiectelor înscrise:
  - titlu proiect
  - echipă
  - status (număr livrabile, dacă au fost evaluate etc.)
- Vizualizează, pentru fiecare livrabil:
  - lista notelor acordate (ex: 8.50, 9.00, 7.75 etc.) fără numele evaluatorilor;
  - nota finală calculată (după regula de mai jos).
- Poate exporta/consulta situația notelor pentru un proiect (ex: tabel cu note pe livrabile).

---

## 5. Reguli de business

1. **Selecția juriului**
   - La data unui livrabil parțial, sistemul selectează aleatoriu un set de studenți care:
     - sunt înrolați în platformă;
     - **nu** fac parte din echipa proiectului evaluat;
     - nu au fost deja selectați în juriul acelui proiect pentru același livrabil.
   - Numărul de membri în juriu (ex: 3, 5 sau 7) poate fi configurabil.

2. **Acordarea notelor**
   - Notele sunt numere reale între 1 și 10, cu maximum 2 zecimale.
   - Doar membrii juriului pot introduce / modifica note pentru proiectele la care au fost repartizați.
   - Un evaluator poate acorda **o singură notă** per livrabil per proiect (aceasta poate fi ulterior modificată în fereastra de timp activă).

3. **Calculul notei finale pentru un livrabil**
   - Pentru un livrabil, nota finală se calculează pe baza tuturor notelor acordate de juriu.
   - Se elimină **cea mai mare** și **cea mai mică** notă (dacă există minim 3 note).
   - Nota finală este media aritmetică a notelor rămase.
   - Dacă există mai puțin de 3 note, media se calculează fără eliminare (regulă de fallback).

4. **Anonimizarea evaluatorilor**
   - În baza de date se păstrează relația (proiect, livrabil, evaluator, notă), dar:
     - interfața profesorului nu afișează identitatea evaluatorilor;
     - interfața MP vede doar valorile notelor și nota finală, fără nume.

5. **Fereastra de timp pentru evaluare**
   - Pentru fiecare livrabil există o perioadă de timp în care:
     - evaluatorii pot introduce/modifica note;
     - după expirare, notele devin finale și nu mai pot fi schimbate.

---

## 6. Model de date (nivel logic – propunere)

Entități principale (vor deveni tabele în baza de date):

1. **User**
   - id
   - nume
   - email
   - parolă (hash-uită)
   - rol (STUDENT / PROFESOR / ADMIN)

2. **Project**
   - id
   - titlu
   - descriere
   - ownerId (userul care a creat proiectul)
   - dataCreării

3. **ProjectMember**
   - id
   - projectId
   - userId
   - rol în proiect (ex: membru, coordonator – opțional)

4. **Deliverable**
   - id
   - projectId
   - nume
   - descriere
   - dueDate (data-limită)
   - linkVideo (opțional)
   - linkDemo (opțional)

5. **JuryAssignment**
   - id
   - deliverableId
   - jurorId (userId al studentului evaluator)
   - assignedAt (data atribuirii)

6. **Grade**
   - id
   - juryAssignmentId
   - value (nota 1–10, max 2 zecimale)
   - createdAt
   - lastUpdatedAt

Nota finală pe livrabil poate fi calculată la cerere (din mai multe Grade) sau memorată într-un câmp separat, ex: `Deliverable.finalGrade`.

---

## 7. Cerințe ne-funcționale

- **SPA (Single Page Application)**:  
  Interfața este o aplicație web React, care comunică cu backend-ul prin API REST (JSON).

- **Responsivitate**:  
  Layout-ul trebuie să fie utilizabil pe laptop, tabletă și telefon.

- **Performanță**:  
  Răspunsurile API ar trebui să fie rapide pentru un număr mic/mediu de utilizatori (scenariu academic).

- **Securitate de bază**:
  - parolele nu se stochează în clar;
  - rutele REST protejate necesită token de autentificare;
  - utilizatorii pot modifica doar informațiile pentru care au permisiuni (ex: evaluatorul doar nota lui).

- **Ușurință în utilizare**:
  - interfață clară, cu liste de proiecte și butoane intuitive pentru notare;
  - mesaje de eroare explicite (ex: „Nu aveți dreptul să evaluați acest proiect”).
