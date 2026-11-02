# PRD — PokéDex Explorer

> אפיון המערכת הקיימת, מסונכרן לקוד ולהיסטוריית Git ב-2026-11-02. תכנון עתידי מופרד במפורש מהמימוש.

## 1. Pitch וקהל יעד

פוקדקס אינטראקטיבי לחובבי Pokémon: גילוי פוקימונים לפי שם, מספר, סוג ודור; קריאת נתוני Pokédex אמיתיים; שמירת מועדפים והשוואת מדדי בסיס. הממשק בהשראת מכשיר Pokédex אדום, עם אזור מסך תכלת, פרטים מטאליים והדגשות לפי סוג.

## 2. טכנולוגיה והיקף

אפליקציית Frontend ב-React + Vite + TypeScript עם React Router ו-CSS מקומי. הנתונים מגיעים באמצעות fetch מ-PokéAPI; אין Backend ייעודי, בסיס נתונים, התחברות או חשבון משתמש. הטיפוסים מוגדרים ב-TypeScript מחמיר ו-Lint אוסר any מפורש. Vitest, React Testing Library ו-jsdom משמשים לבדיקות.

## 3. מסכים וניווט קיימים

| מסך | נתיב React Router | התנהגות |
|---|---|---|
| Pokédex | `/` | כותרת, Pokémon of the Day ו-Quick Access, חיפוש ומסננים, כרטיסים ודפדוף |
| Pokémon Details | `/pokemon/:id` | טעינה עצמאית לפי מזהה מספרי באמצעות useParams, גם בכניסה ישירה |
| Favorites | `/favorites` | נתוני המועדפים שנשמרו, הסרה ומעבר לפרטים |
| Pokémon Comparison | `/compare` | שתי בחירות עצמאיות והשוואת Base Stats |

הקטלוג מקשר ל-Favorites ול-Comparison; כרטיסים, פוקימון היום ושלבי התפתחות מובילים לפרטים. המסכים הנוספים מאפשרים חזרה לקטלוג. נתיב לא מוכר מפנה ל-`/`; מזהה פרטים לא תקין או חסר ב-API מציג שגיאה.

מצב החיפוש, המסננים, המיון והדפדוף נשמר בזיכרון App במהלך ניווט. רענון מלא מאפס מצב זה; הוא אינו נשמר בכתובת או ב-localStorage. בפריסה נדרש fallback ל-index.html עבור BrowserRouter.

## 4. יכולות שמומשו

### קטלוג וגילוי

- אינדקס שמות ומזהי מינים מ-PokéAPI; פרטי הכרטיסים נטענים לעמוד הנוכחי, עד 20 פוקימונים בעמוד.
- חיפוש שם חלקי באנגלית או מספר Pokédex מדויק, עם נרמול והשהיית 300ms בקטלוג.
- סינון לפי Type, Generation ו-Regular/Legendary/Mythical; מיון לפי שם או מספר בשני הכיוונים ו-Reset Filters.
- כרטיסי מידע עם תמונה, שם, מספר, הדגשת סוג, תגיות SVG לכל 18 הסוגים וכפתור מועדפים שאינו מפעיל ניווט.
- Pokémon of the Day בתוך ה-Header לצד הכותרת והניווט: תמונה, שם, מספר, סוגים ו-View Pokémon. הבחירה נעשית מאינדקס המינים המלא שנטען, בלי תלות במסננים, ונשמרת ב-localStorage לפי היום המקומי. היא מתעדכנת בחצות, בעת חזרה ללשונית ובבדיקת תאריך מחזורית; הבחירה הקודמת מוחרגת כשיש חלופה. כשל אחסון מאפשר שימוש זמני עם אזהרה.

### פרטי Pokémon

- Hero עם תמונה גדולה, אזור רספונסיבי ו-object-fit: contain; מרכוז אופקי ואנכי של התוכן הגלוי תוך התחשבות בשוליים שקופים, עם חלופה אם מדידת התמונה אינה זמינה.
- תאורה רדיאלית עדינה לפי הסוג הראשי. **אין פודיום, שכבות במה, צללי מגע או התאמות תנוחה לכל פוקימון.**
- פאנל מידע עם שם, מספר המין המקורי, סוגים וסמלי SVG, Genus ותיאור קצר באנגלית מ-flavor_text_entries. הטקסט מנוקה מרווחים ושבירות שורה, תיאורים כפולים מסוננים ונבחר תיאור אנגלי זמין; מידע חסר מציג fallback, ללא המצאת טקסט.
- HP, Attack, Defense, Special Attack, Special Defense ו-Speed, עם מספרים ופסים בסולם 0–255. צבעי הערכים: Low מתחת ל-50, Medium מ-50 עד 89 ו-High מ-90.
- כל ה-Abilities מהתגובה, עם שמות קריאים ותגית Regular Ability או Hidden Ability.
- Height במטרים ו-Weight בקילוגרמים, בחלוקה ב-10 מערכי ה-API בדצימטרים ובהקטוגרמים.
- Evolution Chain מלאה, ליניארית או מסועפת, עם תמונה, שם, חצים וקישורים לכל שלב. מקטע שרשרת בת פוקימון יחיד מוסתר; פוקימון שהוא שלב אחרון בשרשרת מרובת שלבים מציג את כולה.
- בקר Normal/Shiny, עם Normal כברירת מחדל, תמונות אמיתיות וטיפול בחוסר תמונה ובכשל טעינה. הבקר ובחירת Mega מופיעים באזור התמונה ומתחתיה.
- Mega מזוהה דרך varieties ו-forms ואימות is_mega; צורות חלופיות אחרות אינן נכללות אוטומטית. הבקר מוסתר כשאין Mega, מאפשר חזרה ל-Regular ומעדכן תמונה, סוגים, סטטיסטיקות, Abilities, גובה ומשקל. Shiny זמין גם ל-Mega אם קיימת תמונה. Evolution Chain הרגילה נשארת נפרדת.
- מועדפים לפי מזהה המין, המשותף ל-Regular/Shiny/Mega.

### Favorites

- לב נגיש בפרטים ובכרטיסי הקטלוג, עם מצב מלא/ריק ותווית מתאימה.
- שמירת מזהי מינים ייחודיים ב-localStorage והמשך שימוש בהם אחרי רענון ופתיחת האתר מחדש באותו דפדפן.
- עמוד ייעודי עם תמונה, שם, מספר וסוגים, כניסה לפרטים והסרה מיד לאחר שמירה מוצלחת.
- הודעה וקישור לקטלוג ברשימה ריקה; נתוני אחסון פגומים, טעינה ושגיאות מטופלים.

### Pokémon Comparison

- בחירה בכל צד באמצעות שם חלקי, מספר מדויק או My Favorites מתוך מנגנון המועדפים הקיים.
- החלפה עצמאית, שמירת הצד האחר ומניעת בחירת אותו מזהה גם בזמן בקשות ממתינות.
- הצגת תמונות, שמות, מספרים וסוגים; לאחר שתי בחירות מוצגים ששת מדדי הבסיס בפסים אופקיים ובערכים מספריים בסולם משותף.
- יתרון או Tie נגישים גם בטקסט, הפרש לכל מדד, Total Base Stats לכל צד ומספר היתרונות והתיקו.
- החלפה מוצלחת מעדכנת את ההשוואה; בזמן החלפה מוצג Loading, וכשל משמר את הבחירה התקינה הקודמת ומציג שגיאה.
- שימוש במדדים שכבר התקבלו בתגובות הפוקימונים, ללא בקשת סטטיסטיקות נפרדת. **אין סימולציית קרב או קביעה מי ינצח, ואין Mega Comparison.**

## 5. עיצוב, נגישות ומצבי מערכת

הקטלוג מוצג בתוך גוף Pokédex אדום ובזל מטאלי, עם רקע כחול מחזורי במסך הפנימי. פתיחת המכשיר מכסה את המסך וחושפת ישירות את תוכן האתר, ללא מסך תכלת ביניים; יש Skip Intro, Escape וניהול מיקוד. הפתיחה אינה מתחילה מחדש בכל ניווט, ומסומנת ב-sessionStorage.

משתני צבע, ריווח, טיפוגרפיה, מיקוד ובקרים משותפים; שימוש בכפתורים ושדות נגישים, סמלי סוג לצד שמות ותמיכה ב-prefers-reduced-motion. הפריסה מותאמת למחשב, טאבלט ומובייל. שדרוג העיצוב של Favorites ו-Comparison וסקירת האיכות הכוללת עדיין מתוכננים, ולא מוצגים כהושלמו.

Loading, Error ו-Empty מוצגים בהתאם למידע הנטען; פרטי species והתפתחות יכולים להציג שגיאה בלי להסתיר את נתוני הפוקימון הבסיסיים. בקשות מתבטלות כשהן מתייתרות. תמונה חסרה ו-localStorage חסום או פגום מטופלים בבטחה.

## 6. נתונים וניהול state

- REST: `https://pokeapi.co/api/v2/` — pokemon-species, pokemon, type, generation, evolution-chain ו-pokemon-form.
- GraphQL: `https://beta.pokeapi.co/graphql/v1beta` — מזהי Legendary ו-Mythical לפי שדות המין.
- אינדקס המינים נטען ב-App בבקשה עם limit=2000; אין הבטחה לטעינה בלתי מוגבלת אם ה-API יגדל מעבר למגבלה זו.
- state מקומי ו-Hooks לקטלוג, נתוני המסכים והצורות; reducer לבחירות ההשוואה. נתוני species משותפים למידע, Mega ו-Evolution, ונתונים שכבר נטענו משמשים שוב היכן שהמימוש מאפשר.
- localStorage למועדפים ולפוקימון היומי, sessionStorage לצפייה בפתיחה. אין סנכרון בין מכשירים או חשבונות ואין הבטחת עבודה ללא רשת.
- items.json הוא שריד מכוון לאבן הדרך המקומית הראשונה, ולא מקור נתוני הקטלוג הנוכחי.

## 7. Acceptance criteria

1. When I search by a partial name or an exact Pokédex number and change the type, generation, classification or sort order, I see the matching catalog results with up to 20 Pokémon per page, or a clear loading, error or empty state.
2. When I open a Pokémon details URL and select an available Mega form or Shiny appearance, I see an uncropped, centered image without a podium and the correct form data; unavailable images are handled clearly and the ordinary evolution chain remains separate.
3. When I add a Pokémon to Favorites and refresh the browser, I see the same species saved once, and when I remove it on the Favorites page, I see its card disappear without a page reload.
4. When I select two different Pokémon through Search or My Favorites and replace either one, I see updated six-stat values, differences, totals, leads and ties without losing the other selection or receiving a battle prediction.
5. When I reopen the catalog on the same local day, I see the same Pokémon of the Day; when the local date changes while the page remains open, I see a new daily selection without changing my search or filters, provided the API data and browser storage are available.

## 8. מתוכנן וטרם הושלם

- **משימה 11:** השלמת מעטפת וניווט משותפים, עיצוב משותף לכרטיסים ותגיות בעמודים הנוספים, יתר שיפורי הקטלוג לפי צורך, Favorites, Comparison, סקירת תנועה ונגישות ובדיקת איכות סופית. ה-Hero נשאר ללא פודיום.
- **משימה 10:** Pack Opening Simulator — עמוד מתוכנן לפתיחת חפיסות וירטואליות של קלפי Pokémon TCG עם תמונות קלפים אמיתיים ממקור נתונים מתאים; הסימולטור טרם מומש ואין כרגע נתיב פעיל.
- **משימה 12:** סקירת דרישות והגשה, תיעוד מעודכן, בדיקות תקינות והרצות סופיות, הכנה להגנה אישית של 7 דקות ו-Repository ציבורי ב-GitHub שמוכן להגשה. דרישת לפחות חמש בדיקות כבר מולאה; התוצאה האחרונה שתועדה היא 178 בדיקות ב-28 קבצים, ולא הרצה חדשה במסגרת כתיבת מסמך זה.

לפי הסדר שאושר, משלימים את משימה 11 לפני שחוזרים למשימה 10, ללא שינוי המספור. חשבונות משתמש, Backend, בסיס נתונים, Redux, Next.js, ספריות UI ומודלים תלת־ממדיים חיצוניים אינם בהיקף הנוכחי. ראו [tasks.md](tasks.md) לתוכנית העבודה המקוצרת, לסטטוסים ולהפניות ל-Commits ו-[README.md](README.md) להפעלה ולבדיקות.
