# HeksaDnD  
Gra przeglądarkowa inspirowana klimatem **Dungeons & Dragons**, oparta na heksagonalnej mapie i mechanikach turowych. Projekt tworzony z myślą o lokalnej rozgrywce dla kilku graczy na jednym urządzeniu.

## Opis projektu  
HeksaDnD to prototyp gry taktycznej, w której gracze poruszają się po heksagonalnej planszy, wykonują akcje, walczą i eksplorują świat.  
Celem projektu jest stworzenie lekkiej, przeglądarkowej wersji gry RPG z elementami strategii i systemem tur.

W repozytorium znajdują się m.in.:  
- logika gry (ruch, tury, interakcje),  
- renderer mapy heksagonalnej,  
- podstawowy UI,  
- struktura pod dalszą rozbudowę (klasy postaci, statystyki, walka, zdarzenia).

---

## Technologie użyte w projekcie  

| Technologia | Zastosowanie |
|------------|--------------|
| **JavaScript (ES6+)** | logika gry, obsługa mapy, tury, interakcje |
| **Vite** | szybki bundler i dev‑server |
| **TailwindCSS** | stylowanie interfejsu |
| **PostCSS** | przetwarzanie CSS |
| **HTML5 Canvas** | renderowanie heksów i elementów gry |
| **Node.js + npm** | zarządzanie zależnościami |

---

## Jak uruchomić projekt lokalnie

### 1. Sklonuj repozytorium
```bash
git clone https://github.com/C-BULLKA/HeksaDnD.git
cd HeksaDnD
```
### 2. Zainstaluj zależności
```bash
npm install
```
### 3. Uruchom tryb deweloperski
```bash
npm run dev
```
### Po uruchomieniu Vite wyświetli lokalny adres, np.:
http://localhost:3000

### 4. Budowanie wersji produkcyjnej
```bash
npm run build
```
## Struktura projektu (skrót)
```bash
HeksaDnD/
 ├── src/                # logika gry, renderer, komponenty
 ├── index.html          # główny plik aplikacji
 ├── package.json        # zależności i skrypty
 ├── vite.config.js      # konfiguracja Vite
 ├── tailwind.config.js  # konfiguracja TailwindCSS
 └── postcss.config.js   # konfiguracja PostCSS
```
## Funkcjonalności (obecne i planowane)
✔️ heksagonalna mapa

✔️ system tur

✔️ podstawowe akcje graczy

⏳ system walki

⏳ klasy postaci i statystyki

⏳ zdarzenia losowe

## Cel projektu

### Stworzenie modularnej, łatwej do rozbudowy gry taktycznej w przeglądarce, która pozwoli na szybkie prototypowanie mechanik RPG i testowanie pomysłów na heksagonalnej planszy.

# Made with ♥️ by Piotr Cebula
