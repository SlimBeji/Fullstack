import cron, { ScheduledTask, TaskFn, TaskOptions } from "node-cron";

import { NewsletterCronConfig } from "./emails";

interface CronConfig {
    name: string;
    expression: string;
    task: TaskFn;
    options: TaskOptions;
}

const ALL_CRONS: CronConfig[] = [NewsletterCronConfig];

export class TaskScheduler {
    private crons: Record<string, ScheduledTask> = {};

    public start(): void {
        ALL_CRONS.forEach((config) => {
            this.crons[config.name] = cron.schedule(
                config.expression,
                config.task,
                config.options
            );
        });
    }

    public async close(): Promise<void> {
        await Promise.all(Object.values(this.crons).map((cron) => cron.stop()));
    }
}

export const scheduler = new TaskScheduler();
