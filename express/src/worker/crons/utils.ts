import { sendNewsletterCron } from "./emails";

export const cleanCron = async () => {
    await sendNewsletterCron.stop();
};
