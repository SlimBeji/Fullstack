import { sendNewsletterCron } from "./emails";

export const closeCrons = async () => {
    await sendNewsletterCron.stop();
};
