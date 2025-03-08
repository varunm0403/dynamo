const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { v4: uuidv4 } = require("uuid");

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        const newItem = {
            id: { S: uuidv4() },
            principalId: { N: requestBody.principalId.toString() },
            createdAt: { S: new Date().toISOString() },
            body: { S: JSON.stringify(requestBody.content) }
        };

        await dynamoDb.send(new PutItemCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Item: newItem
        }));

        return {
            statusCode: 201,
            body: JSON.stringify({ event: newItem })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error", details: error.message })
        };
    }
};
