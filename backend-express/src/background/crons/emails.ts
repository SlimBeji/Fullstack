import { CronConfig } from "@/lib/clients";

import { sendNewsletter } from "../publishers";

export const NewsletterCronConfig: CronConfig = {
    name: "Newsletter Job",
    expression: "0 * * * *",
    task: () => {
        sendNewsletter("Slim Beji", "mslimbjei@gmail.com");
    },
    options: { timezone: "Africa/Tunis" },
};
