import { app } from "@azure/functions"

app.timer('timerFunc', {
    schedule: '0 */15 * * * *', // кожні 5 хвилин
    handler: async (myTimer, context) => {
        context.log('Timer function executed at:', new Date().toISOString());
    }
});