// בבדיקות בלבד: ממלא את רשימות השירותים מהקטלוג הישן (102 שירותים), כדי
// שבדיקות ה-golden של מנוע ההתאמה ימשיכו לבדוק את אותה התנהגות. הקובץ הזה לא
// נכנס לאפליקציה, ולכן נתוני הספקים האמיתיים לא מגיעים לאתר הציבורי.
import legacy from "@/data/services-research/services-catalog.json";
import { setRawServices } from "@/data/realServices";
import { setServiceCatalogRaw } from "@/data/serviceCatalog";

setRawServices(legacy as unknown as Record<string, unknown>[]);
setServiceCatalogRaw(legacy as unknown as Record<string, unknown>[]);
