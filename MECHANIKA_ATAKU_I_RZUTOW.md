# Mechanika ataku i rzutow koscia (dokladny opis implementacji)

Ten dokument opisuje dokladnie, jak aktualny kod gry liczy ataki, trafienia, obrazenia i bloki tarcza.
Opis jest zgodny z implementacja w `src/pages/Game.jsx` oraz tym, co wyswietla okno wyniku ataku w `src/components/game/AttackDialog.jsx`.

## 1. Jednostki i statystyki bojowe

W grze sa dwa typy postaci:

- **Tank**
  - `maxHp = 40`
  - `armorClass = 12`
  - `strength = 16`, `dexterity = 10`, `constitution = 16`
  - `attackRange = 1`
  - `attackStat = strength`

- **Strzelec**
  - `maxHp = 20`
  - `armorClass = 6`
  - `strength = 10`, `dexterity = 16`, `constitution = 12`
  - `attackRange = 2`
  - `attackStat = dexterity`

Wartosci pochodza z `CHARACTER_TYPES`.

## 2. Rzuty i modyfikatory

### 2.1 Rzut k20

Kazdy rzut jest liczony funkcja:

`rollD20() = losowa liczba calkowita od 1 do 20`

Implementacja: `Math.floor(Math.random() * 20) + 1`.

### 2.2 Modyfikator cechy

Modyfikator cechy (sily lub zrecznosci) to:

`modifier = floor((stat - 10) / 2)`

Przykladowo:

- stat 16 -> +3
- stat 10 -> +0

## 3. Kiedy atak jest w ogole mozliwy

Atak na kliknietego przeciwnika wykona sie tylko gdy jednoczesnie:

1. Faza gry to `playing`.
2. Zaznaczona postac nalezy do aktywnego gracza.
3. Zaznaczona postac ma `canAttack = true`.
4. Cel jest przeciwnikiem (`playerId` inny), zyje (`hp > 0`) i stoi na polu kliknietym.
5. Cel jest w zasiegu liczonym przez `calculateAttackRange`:
   - odleglosc heksowa `<= attackRange` i `> 0`,
   - istnieje linia widzenia (`hasLineOfSight`),
   - sciana (`wall`) na polu pomiedzy atakujacym i celem blokuje strzal/atak.

## 4. Dokladny algorytm ataku

Po wywolaniu `performAttack(attacker, defender)`:

1. Rzut ataku:
   - `attackRoll = d20`

2. Wybor statystyki ofensywnej:
   - Tank: sila
   - Strzelec: zrecznosc

3. Modyfikator ataku:
   - `attackMod = calculateModifier(attackStat)`

4. Suma ataku:
   - `attackTotal = attackRoll + attackMod`

5. Specjalne wyniki k20:
   - `isCritical = (attackRoll === 20)` -> automatyczne trafienie krytyczne
   - `isFumble = (attackRoll === 1)` -> automatyczne pudlo

6. Trafienie (`isHit`) jest prawda, gdy:
   - krytyk, **albo**
   - nie ma pecha (`!isFumble`) i `attackTotal >= defender.armorClass`

Formalnie:

`isHit = isCritical || (!isFumble && attackTotal >= AC_celu)`

## 5. Liczenie obrazen

### 5.1 Maksymalny pulap obrazen napastnika

`maxDamage = max(1, attacker.strength)`

To oznacza, ze obrazenia skaluja sie bezposrednio z sila atakujacego.
W tej wersji gry nie ma osobnego rzutu koscia obrazen (np. k6/k8) - jest wyliczenie procentowe od sily.

### 5.2 Jakosci trafienia (hitQuality)

`hitQuality = clamp(0.25 + max(0, attackTotal - AC_celu) * 0.05, 0.25, 1)`

gdzie:

- `clamp(x, 0.25, 1)` ucina wartosc do zakresu 25%-100%
- przewaga nad KP (`attackTotal - AC`) podnosi jakosc o 5 punktow procentowych za kazdy 1 punkt przewagi

Przyklady:

- Jesli `attackTotal = AC`, to jakosc = 25%
- Jesli `attackTotal = AC + 5`, to jakosc = 50%
- Jesli wynik bardzo wysoki, jakosc i tak max 100%

### 5.3 Surowe obrazenia

Jesli nie ma trafienia, obrazenia zostaja `0`.

Jesli trafienie jest:

- Krytyk (`natural 20`):
  - `rawDamage = maxDamage`
- Zwykle trafienie:
  - `rawDamage = max(1, ceil(maxDamage * hitQuality))`

Aktualne obrazenia robocze:

`damage = rawDamage`

## 6. Blok tarcza (tylko obronca typu Tank)

Jesli cel ma role `tank` i atak trafil, wykonywany jest dodatkowy rzut obronny:

1. `shieldRoll = d20`
2. `shieldMod = modifier(defender.strength)`
3. `shieldTotal = shieldRoll + shieldMod`
4. Blok udany, gdy `shieldTotal >= 15`

Jesli blok jest udany:

`damage = max(1, ceil(damage / 2))`

Czyli obrazenia sa polowione, ale nigdy nie spadaja ponizej 1.

## 7. Aktualizacja HP i stanu akcji

Po wyliczeniu obrazen:

- `newDefenderHp = max(0, defender.hp - damage)`
- Atakujacy zawsze traci mozliwosc ataku w tej turze:
  - `updatedAttacker.canAttack = false`
  - dotyczy to trafienia, pudla i pecha (NAT 1)

Nastepnie zapisywany jest obiekt `attackResult` (do okna dialogowego), m.in.:

- `attackRoll`, `attackStatRoll`, `attackTotal`
- `targetAC`
- `isHit`, `isCritical`, `isFumble`
- `rawDamage`, `damage`, `hitQuality`, `maxDamage`
- `shieldRoll`, `shieldMod`, `shieldTotal`, `shieldBlocked`
- `defenderHpAfter`

## 8. Komunikaty i logika pokonania

Po ataku log gry dostaje komunikat:

- krytyk: osobny komunikat `KRYTYK!`
- zwykle trafienie: komunikat o zadanych obrazeniach
- pudlo: komunikat o chybieniu

Jesli `defenderHpAfter <= 0`, postac jest pokonana i uruchamia sie `checkVictory`.

## 9. Zwiazek z tura (reset mozliwosci)

Na koniec tury (`handleEndTurn`) tylko postacie nastepnego gracza dostaja reset:

- `canMove = true`
- `canAttack = true`

Czyli kazda postac moze atakowac max 1 raz na swoja ture, dopoki gracz nie zakonczy tury i nie dostanie jej z powrotem na kolejnej swojej turze.

## 10. Wazne uwagi implementacyjne

1. Losowosc opiera sie na `Math.random()` (brak seedu).
2. Obrazenia bazuja na sile postaci, nie na osobnym rzucie koscia obrazen.
3. Krytyk daje gwarantowane trafienie i pelne obrazenia rowne sile (`maxDamage`).
4. NAT 1 daje automatyczne pudlo niezaleznie od modyfikatorow.
5. Sciana (`wall`) blokuje linie widzenia i moze uniemozliwic atak dystansowy oraz melee przez przeszkode.
