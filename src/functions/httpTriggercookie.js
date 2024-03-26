const { app, output } = require('@azure/functions');

// connection to storage q
const queueOutput = output.storageQueue({
    queueName: 'adam-queue',
    connection: 'AdamQueueConnection' 
});

app.http('receiveDessertOrder', {
    methods: ['POST'],
    authLevel: 'anonymous',
    extraOutputs: [queueOutput],
    handler: async (request, context) => {
        // Parse and validate the incoming order JSON
        const order = await request.json();
        console.log("Order received:", order);

        
        if (!order.customerId || !order.Meals || order.Meals.length === 0) {
            return { status: 400, body: "Invalid order format. Ensure customerId and at least one meal are included." };
        }
        
        
        // Send validated order to storage queue
        context.extraOutputs.set(queueOutput, order);

        return { body: "Success - Order submitted to queue." };
    }
});
