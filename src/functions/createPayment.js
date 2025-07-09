import { app } from "@azure/functions"
import { v4 as uuidv4 } from 'uuid';

app.http('createPayment', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http method:  ${request.method}`);
        context.log(`Http url: ${request.url}`);
        const allowedCurrencies = [ 'EUR', 'UAH'];
        try{
            const body = await request.json();
            context.log(`Http body: ${JSON.stringify(body)}`);

            if (body.amount > 100.00){
                throw new Error('Amount exceeded the limit of 100.00');
            }

            if (!allowedCurrencies.includes(body.currency)) {
                throw new Error(`Currency:  ${body.currency} -  is not allowed`);
            }

            const transactionId = uuidv4();
            return { status: 200, jsonBody: { ok: true, transactionId: transactionId, message: 'payment created sucessfully' }};
        }
        catch (error) {
            context.error(`Error parsing request body: ${error.message}`);
            return { status: 422, jsonBody: { ok: false, message: error.message }};
        }
        
    }
});
 

