const { app } = require('@azure/functions');
const sql = require('mssql');

app.storageQueue('processDessertOrder', {
    queueName: 'adam-queue',
    connection: 'AdamQueueConnection',
    handler: async (queueItem, context) => {
        // Ensure the queueItem is an object
        const order = typeof queueItem === 'string' ? JSON.parse(queueItem) : queueItem;
        console.log('Processing order:', order);

        // Database connection configuration
        const sqlConfig = {
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_DATABASE,
            options: {
                encrypt: true,
                trustServerCertificate: true 
            }
        };

        try {
            // Connect to the database
            const pool = await sql.connect(sqlConfig);
            const request = pool.request();

            // Inserting the order into the Orders table
            request.input('CustomerId', sql.Int, order.customerId);
            request.input('OrderDateTime', sql.DateTime, new Date(order.orderDate)); 
            
            const orderInsertResult = await request.query(`
                INSERT INTO Orders (CustomerId, OrderDateTime) OUTPUT INSERTED.OrderId VALUES (@CustomerId, @OrderDateTime);
            `);
            const orderId = orderInsertResult.recordset[0].OrderId;
            console.log(`Order inserted with ID: ${orderId}`);

            // Inserting each meal into the OrderMeals table
            for (const meal of order.Meals) { 
                const mealRequest = pool.request();
                mealRequest.input('OrderId', sql.Int, orderId);
                mealRequest.input('MealId', sql.Int, meal.MealId); 
                await mealRequest.query(`
                    INSERT INTO OrderMeals (OrderId, MealId) VALUES (@OrderId, @MealId);
                `);
            }
            

            console.log('Meal details inserted for order ID:', orderId);
        } catch (err) {
            console.error('Error processing order:', err.message);
        } finally {
            // database connection closed
            await sql.close();
        }
    }
});