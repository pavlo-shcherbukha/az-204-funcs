import { app } from "@azure/functions"

app.http('deletePayment', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http method:  ${request.method}`);
        context.log(`Http url: ${request.url}`);
        try {
         
        const transactionId = request.query.get('transactionId'); // Тут запитуємо дату операційного дня
        context.log(`Query parameter transactionId: ${transactionId}`);
        if (!transactionId){
            throw new Error('Query parameter transactionId is required');
        }
        return { status: 200, jsonBody: { ok: true, transactionId: transactionId}};
        } 
        catch (error) {
            context.error(`Error occured: ${error.message}`);
            return { status: 422, jsonBody: { ok: false, message: error.message }};
        } 
    }
});
