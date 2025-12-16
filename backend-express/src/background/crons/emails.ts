import { sendNewsletter } from "../publishers";
import { CronConfig } from "./utils";

export const NewsletterCronConfig: CronConfig = {
    name: "Newsletter Job",
    expression: "0 * * * *",
    task: () => {
        sendNewsletter("Slim Beji", "mslimbjei@gmail.com");
    },
    options: { timezone: "Africa/Tunis" },
};
