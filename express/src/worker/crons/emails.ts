import cron from "node-cron";
import { sendNewsletter } from "../tasks";

export const sendNewsletterCron = cron.schedule(
    "0 * * * *",
    () => {
        sendNewsletter("Slim Beji", "mslimbjei@gmail.com");
    },
    {
        timezone: "Africa/Tunis",
    }
);
