exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 201,
        message:"Hello from Lambda!",
    };
    return response;
};


const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { v4: uuidv4 } = require("uuid");

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    const requestBody = JSON.parse(event.body);

    const newItem = {
        id: { S: uuidv4() },
        principalId: { N: requestBody.principalId.toString() },
        createdAt: { S: new Date().toISOString() },
        body: { M: {} } // Ensure body is stored as a map
    };

    // Convert content object to DynamoDB Map format
    for (const key in requestBody.content) {
        newItem.body.M[key] = { S: requestBody.content[key].toString() };
    }

    await dynamoDb.send(new PutItemCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Item: newItem
    }));

    // Construct response
    return {
        statusCode: 201,
        body: JSON.stringify({
            event: {
                id: newItem.id.S,
                principalId: parseInt(newItem.principalId.N),
                createdAt: newItem.createdAt.S,
                body: requestBody.content // Send body as a JSON object
            }
        })
    };
};

