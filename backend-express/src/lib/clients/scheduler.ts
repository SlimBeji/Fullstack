import cron, { ScheduledTask, TaskFn, TaskOptions } from "node-cron";

export interface CronConfig {
    name: string;
    expression: string;
    task: TaskFn;
    options: TaskOptions;
}

export class TaskScheduler {
    private crons: Record<string, ScheduledTask> = {};

    constructor(private tasks: CronConfig[]) {}

    public start(): void {
        this.tasks.forEach((config) => {
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
