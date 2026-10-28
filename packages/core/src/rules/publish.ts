// פרסום לאזרח: רק שירותים בסטטוס שמופיע ב-publish_to_citizen_statuses.

import type { Service } from "../model";
import type { Settings } from "../seed";

export function isPublishable(service: Pick<Service, "status">, settings: Pick<Settings, "publish_to_citizen_statuses">) {
  return settings.publish_to_citizen_statuses.includes(service.status);
}

export function publishableServices(
  services: readonly Service[],
  neighborhoodId: string,
  settings: Pick<Settings, "publish_to_citizen_statuses">,
): Service[] {
  return services.filter((s) => s.neighborhoodId === neighborhoodId && isPublishable(s, settings));
}
