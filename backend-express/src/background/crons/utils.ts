import { TaskFn, TaskOptions } from "node-cron";

export interface CronConfig {
    name: string;
    expression: string;
    task: TaskFn;
    options: TaskOptions;
}
