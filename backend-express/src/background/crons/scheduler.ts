import cron, { ScheduledTask } from "node-cron";

import { ALL_CRONS } from "./registery";

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
