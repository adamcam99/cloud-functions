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

        
        if (!order || typeof order.customerId !== 'number' || !Array.isArray(order.Meals) || order.Meals.length === 0) {
            context.res = { status: 400, body: "Invalid order format. Ensure customerId is a number and at least one meal is included." };
            return;
        }

        const hasInvalidMealIds = order.Meals.some(meal => typeof meal.MealId !== 'number');
        if (hasInvalidMealIds) {
            context.res = { status: 400, body: "Invalid MealId format. Each MealId must be a number." };
            return;
        }
        
        
        // Send validated order to storage queue
        context.extraOutputs.set(queueOutput, order);

        return { body: "Success - Order submitted to queue." };
    }
});
