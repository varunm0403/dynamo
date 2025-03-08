const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { v4: uuidv4 } = require("uuid");

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        
        if (!requestBody.principalId || !requestBody.content) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing required fields: principalId or content" })
            };
        }

        const newItem = {
            id: { S: uuidv4() },
            principalId: { N: requestBody.principalId.toString() },
            createdAt: { S: new Date().toISOString() },
            body: { M: {} }  // Ensure body is stored as a map
        };

        // Convert content object to DynamoDB Map format
        for (const key in requestBody.content) {
            newItem.body.M[key] = { S: requestBody.content[key].toString() };
        }

        await dynamoDb.send(new PutItemCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Item: newItem
        }));

        // Constructing expected response
        const responseEvent = {
            id: newItem.id.S,
            principalId: parseInt(newItem.principalId.N),
            createdAt: newItem.createdAt.S,
            body: requestBody.content  // Send body as a JSON object, not string
        };

        return {
            statusCode: 201,
            body: JSON.stringify({ event: responseEvent })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error", details: error.message })
        };
    }
};
