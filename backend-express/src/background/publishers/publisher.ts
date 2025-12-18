import { TaskPublisher } from "@/lib/clients";

import { broker_config, Queues } from "../setup";

export const publisher = new TaskPublisher(
    Object.values(Queues),
    broker_config
);
