import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: "eu-west-1" });
const docClient = DynamoDBDocumentClient.from(client);

const AUDIT_TABLE = "Audit"; // Replace with your actual audit table name

export const handler = async (event) => {
    try {
        const records = event.Records || [];

        for (const record of records) {
            const { eventName, dynamodb } = record;
            if (!dynamodb || !eventName) continue; // Skip invalid records

            const itemKey = dynamodb.Keys?.key?.S;
            if (!itemKey) continue; // Skip if itemKey is missing

            const modificationTime = new Date().toISOString();
            let auditEntry = {
                id: uuidv4(),
                itemKey,
                modificationTime,
            };

            if (eventName === "INSERT") {
                // Handling INSERT event
                const newValue = {
                    key: itemKey,
                    value: parseInt(dynamodb.NewImage?.value?.N, 10),
                };

                auditEntry.newValue = newValue;
            } 
            else if (eventName === "MODIFY") {
                // Handling MODIFY event
                const oldValue = parseInt(dynamodb.OldImage?.value?.N, 10);
                const newValue = parseInt(dynamodb.NewImage?.value?.N, 10);

                auditEntry.oldValue = oldValue;
                auditEntry.newValue = newValue;
            } else {
                continue; // Skip DELETE events or unknown events
            }

            // Store the audit entry in the DynamoDB "Audit" table
            await docClient.send(new PutCommand({
                TableName: AUDIT_TABLE,
                Item: auditEntry
            }));
        }

        return { statusCode: 200, body: "Processing completed." };
    } catch (error) {
        console.error("Error processing stream event:", error);
        return { statusCode: 500, body: "Error processing event." };
    }
};
