# PRD — PokéDex Explorer

> אפיון קצר לפי תבנית המרצה; פרויקט Frontend בלבד ב-React + Vite.

## 1. Pitch
פוקדקס אינטראקטיבי שמאפשר לחובבי פוקימון לגלות יצורים, לסנן אותם וללמוד על כל אחד מהם.

## 2. Who it is for
חובבי פוקימון שרוצים למצוא פוקימון לפי שם, מספר או סוג, לקרוא נתונים ולהחזיק רשימת מועדפים בדפדפן.

## 3. Screens
- **List** — כרטיסי פוקימונים עם מספר, תמונה, שם וסוג; חיפוש, סינון ומיון.
- **Details** — מידע על הפוקימון שנבחר: תמונה, סוגים, גובה, משקל, יכולות, סטטיסטיקות ושרשרת התפתחות. עיצוב עם תחושת עומק (CSS בלבד), לא מודל 3D.

## 4. Must-have features
1. רשימת פוקימונים שמגיעה מ-PokéAPI, עם טעינה, שגיאה ומצב ללא תוצאות.
2. בחירה בכרטיס והצגת פרטים באמצעות `useState` ברכיב האב והעברת `props`.
3. חיפוש לפי שם/מספר, סינון לפי סוג ומיון לפי שם/מספר.
4. סימון מועדפים ושמירתם ב-`localStorage`.
5. ממשק רספונסיבי עם תמונות רשמיות ואפקטי עומק עדינים ב-CSS במסך הפרטים.

## 5. Acceptance criteria
- When I open the app, I see a populated Pokémon list; loading and network errors are handled visibly.
- When I select a Pokémon, I see its details, stats and evolution information.
- When I search, filter or sort, I see the corresponding results or an empty-state message.
- When I mark a favorite and refresh, it remains saved on the same browser.
- When I view the app on a phone, the layout stays readable and usable.

## 6. Not now
חשבון משתמש, Backend, מסד נתונים, מודלים תלת־ממדיים מלאים, React Router, Redux, TypeScript וספריות UI.

## 7. Data
- **API:** `https://pokeapi.co/api/v2/`
- **Endpoints:** `pokemon`, `pokemon-species`, `evolution-chain`, `type` (לפי הצורך).
- **שדות ברשימה:** `id`, `name`, `sprites`, `types`.
- **שדות בפרטים:** `height`, `weight`, `abilities`, `stats`, `species`, `evolution_chain`.
- **משימה 1 בלבד:** קובץ מקומי `src/data/items.json`; API יתווסף במשימה 3.
