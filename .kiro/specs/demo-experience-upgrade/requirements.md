# Requirements Document

## Introduction

שדרוג מקיף לחוויית הדמו של sal-ishi-v2. הפיצ'ר כולל: העברת כל הניווט לפנימי (ללא תלות באתרים חיצוניים), שיפור הדמו האוטומטי עם תחנות נוספות וזמן ארוך יותר, הצגת ויזואליזציית הסברה (Explainability) בדף שירות, אנימציית הפעלה של אייג'נטים עם תוצאה מדומה, ואיחוד שתי מערכות הדמו (GuidedDemo ו-AutoDemoOverlay) לארכיטקטורה אחידה.

## Glossary

- **Demo_System**: מערכת הדמו המאוחדת האחראית על הצגת סיור מודרך או אוטומטי במערכת סל אישי
- **DemoHome_Page**: דף הבית הראשי של sal-ishi-v2 (route: `/`) המציג כניסה ל-5 ממשקים
- **AutoDemo**: דמו אוטומטי עם תחנות מתוזמנות, banner עליון, ומעברים אוטומטיים בין דפים
- **GuidedDemo**: דמו ידני עם סרגל תחתון המאפשר ניווט חופשי בין שלבי ההדגמה
- **Matching_Engine**: אלגוריתם ההתאמה בן 5 השכבות (prevention, motivation, profileFit, proximity, socialProof) שמחשב ציון התאמה לכל שירות
- **Layer_Scores**: אובייקט המכיל 5 ציוני שכבה (0-100) עבור שירות ביחס לאזרח
- **Explainability_Panel**: רכיב ויזואלי המציג פירוק ציון ההתאמה ל-5 שכבות בצורה גרפית
- **Agent_Card**: כרטיס UI המציג מידע על אייג'נט AI בודד, כולל סטטוס ואפשרות הפעלה
- **Mock_Run_Animation**: אנימציה המדמה הפעלה של אייג'נט AI — כולל שלבי עבודה ותוצאה סופית
- **Internal_Navigation**: ניווט באמצעות react-router-dom (HashRouter) בתוך sal-ishi-v2 ללא קישורים חיצוניים
- **Demo_Stop**: תחנה בודדת בדמו אוטומטי הכוללת: route, כותרת, תיאור, ומשך זמן

## Requirements

### Requirement 1: Internal Navigation — ביטול תלות חיצונית

**User Story:** As a demo presenter, I want all DemoHome links to navigate internally within sal-ishi-v2, so that the demo works reliably without depending on external sites that may be down.

#### Acceptance Criteria

1. WHEN a user clicks on the "ממשק האזרח הוותיק" module card on DemoHome_Page, THE DemoHome_Page SHALL navigate to the internal route `/citizen` using Internal_Navigation
2. WHEN a user clicks on the "מערכת המלווה החברתית" module card on DemoHome_Page, THE DemoHome_Page SHALL navigate to the internal route `/coordinator` using Internal_Navigation
3. THE DemoHome_Page SHALL render all 5 module cards as internal react-router Link components without any `target="_blank"` or external URL attributes
4. THE DemoHome_Page SHALL remove all ExternalLink icon indicators from module cards that previously pointed to external URLs
5. WHEN the hero section CTA buttons are rendered, THE DemoHome_Page SHALL link the citizen button to `/citizen` using Internal_Navigation instead of the external libi-sal-ishi.vercel.app URL

### Requirement 2: AutoDemo — תחנות נוספות וזמן ארוך יותר

**User Story:** As a demo viewer, I want the automatic demo to include more pages (especially Agents, Intake, Algorithm) with longer per-stop durations, so that I have enough time to absorb each page.

#### Acceptance Criteria

1. THE AutoDemo SHALL include a minimum of 9 demo stops covering: DemoHome, CitizenHome, CitizenServices, CoordinatorDashboard, CoordinatorAgents, CoordinatorIntake, CoordinatorAlgorithm, ExecutiveOverview, and at least one additional page
2. WHEN the AutoDemo is running, THE AutoDemo SHALL display each Demo_Stop for a minimum of 7 seconds and a maximum of 10 seconds per stop
3. THE AutoDemo SHALL display a total duration of 60 seconds or more for the complete tour
4. WHEN navigating to the Agents stop, THE AutoDemo SHALL show a subtitle describing the 5 AI agents and their autonomous operation
5. WHEN navigating to the Intake stop, THE AutoDemo SHALL show a subtitle describing the AI-powered voice intake with Amazon Transcribe
6. WHEN navigating to the Algorithm stop, THE AutoDemo SHALL show a subtitle describing the 5-layer matching algorithm with adjustable weights
7. THE AutoDemo intro screen SHALL update the tour description text to reflect the increased number of stops and total duration

### Requirement 3: Explainability — ויזואליזציית ציון התאמה בדף שירות

**User Story:** As a citizen user, I want to see a visual breakdown of why a service was recommended to me showing 5 distinct layers, so that I understand and trust the AI recommendation.

#### Acceptance Criteria

1. WHEN a citizen views a service detail page and a valid MatchResult exists for that service, THE Explainability_Panel SHALL render a visual bar chart or radial visualization showing all 5 Layer_Scores (prevention, motivation, profileFit, proximity, socialProof)
2. THE Explainability_Panel SHALL display each layer's score as a percentage value (0-100) alongside its visual representation
3. THE Explainability_Panel SHALL label each layer with its Hebrew name: מניעה, מוטיבציה, התאמת פרופיל, קרבה גיאוגרפית, הוכחה חברתית
4. THE Explainability_Panel SHALL display the weight of each layer (e.g., 30%, 25%, 20%, 10%, 15%) adjacent to the layer label
5. THE Explainability_Panel SHALL display the total weighted score prominently with a visual indicator of match quality (color coding based on score threshold)
6. WHEN the total score is 80 or above, THE Explainability_Panel SHALL display a green visual indicator. WHEN the total score is between 60 and 79, THE Explainability_Panel SHALL display an amber indicator. WHEN the total score is below 60, THE Explainability_Panel SHALL display a gray indicator.
7. THE Explainability_Panel SHALL display at least one human-readable explanation text from the MatchResult explanations array for the highest-scoring layer

### Requirement 4: Agent Mock Run — אנימציית הפעלה עם תוצאה

**User Story:** As a coordinator or demo viewer, I want the "הפעל ידנית" button on each agent card to produce a visible step-by-step animation showing the agent working and a mock result, so that the AI agents feel tangible and alive.

#### Acceptance Criteria

1. WHEN a user clicks the "הפעל ידנית" button for an agent, THE Mock_Run_Animation SHALL display a multi-step progress sequence with at least 3 visible stages (e.g., "מתחבר למקורות", "מעבד נתונים", "מפיק תוצאות")
2. WHILE the Mock_Run_Animation is running, THE Agent_Card SHALL display a progress indicator showing the current stage out of the total number of stages
3. WHEN the Mock_Run_Animation completes, THE Agent_Card SHALL display a mock result summary specific to the agent type (e.g., for Service Discovery: "נמצאו 2 שירותים חדשים", for Matching Engine: "עודכנו 286 ציוני התאמה")
4. THE Mock_Run_Animation SHALL have a total duration between 4 and 8 seconds across all stages
5. WHILE the Mock_Run_Animation is running for one agent, THE Demo_System SHALL disable the "הפעל ידנית" button on all other Agent_Cards to prevent concurrent runs
6. WHEN the Mock_Run_Animation completes, THE Agent_Card SHALL keep the result summary visible for at least 10 seconds before reverting to the default state
7. THE Mock_Run_Animation SHALL include a visual element showing data being processed (e.g., animated progress bar, pulsing icon, or counter incrementing)

### Requirement 5: Demo Overlay Unification — איחוד מערכות הדמו

**User Story:** As a developer, I want the GuidedDemo and AutoDemoOverlay to share a unified state management approach and clear separation of concerns, so that they do not conflict with each other.

#### Acceptance Criteria

1. THE Demo_System SHALL ensure that only one demo overlay (either GuidedDemo or AutoDemo) is active at any given time
2. WHEN the AutoDemo is started while GuidedDemo is active, THE Demo_System SHALL deactivate GuidedDemo before starting AutoDemo
3. WHEN the GuidedDemo is started while AutoDemo is active, THE Demo_System SHALL deactivate AutoDemo before starting GuidedDemo
4. THE Demo_System SHALL use a single shared localStorage key namespace (prefix `sal_demo_`) for all demo state management
5. IF both demo localStorage keys (`sal_demo_active` and `sal_auto_demo_active`) are detected simultaneously, THEN THE Demo_System SHALL clear both and present the user with a clean state
6. THE Demo_System SHALL expose a unified API (`startAutoDemo`, `startGuidedDemo`, `stopAllDemos`) from a single module for controlling demo state

### Requirement 6: AutoDemo — narrative flow between stops

**User Story:** As a demo viewer, I want a visual narrative element between stops that explains the logical connection, so that the demo tells a coherent story rather than a random page tour.

#### Acceptance Criteria

1. WHEN transitioning between Demo_Stops, THE AutoDemo SHALL display a brief narrative text (up to 15 words) explaining how the current stop connects to the next stop
2. THE AutoDemo SHALL organize stops in a logical story order: citizen journey first, then coordinator oversight, then management/executive view
3. THE AutoDemo SHALL display a story arc label for each stop group (e.g., "חוויית האזרח", "ניהול המלווה", "בקרה ניהולית") in the banner area
