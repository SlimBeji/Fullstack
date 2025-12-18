import { CronConfig, TaskScheduler } from "@/lib/clients";

import { NewsletterCronConfig } from "./emails";

export const ALL_CRONS: CronConfig[] = [NewsletterCronConfig];

export const scheduler = new TaskScheduler(ALL_CRONS);
