import "@azure/functions-extensions-blob";
import { app, output } from "@azure/functions"; // Додано 'output'
import { BlobServiceClient } from "@azure/storage-blob";


const queueOutput = output.storageQueue({
    queueName: 'blob-processing-queue',
    connection: 'AzureWebJobsStorage',
});

app.storageBlob("appBlobHandler", {
    path: 'app-container/{name}', // Переконайтеся, що це ваш контейнер
    connection: 'AzureWebJobsStorage',
    extraOutputs: [queueOutput],
    handler: async (blobContent, context) => {
        context.log(`Blob trigger processing: ${context.triggerMetadata.name}`);

        const blobName = context.triggerMetadata.name;
        const containerName = "app-container"; // Виправлено: щоб відповідало шляху тригера

        const connectionString = process.env["AzureWebJobsStorage"];
        if (!connectionString) {
            context.error("AzureWebJobsStorage connection string is not set.");
            return;
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(blobName);

        try {
            const blobProperties = await blobClient.getProperties();
            context.log(`Blob size: ${blobProperties.contentLength}`);
            context.log(`Blob content type: ${blobProperties.contentType}`);

            const queueData = {
                blobName: blobName,
                containerName: containerName,
                blobSize: blobProperties.contentLength,
                contentType: blobProperties.contentType,
                uploadedAt: new Date().toISOString(),
                blobUrl: blobClient.url
            };

            context.extraOutputs.set( queueOutput, queueData);
            context.log(`Message sent to blob-processing-queue: ${JSON.stringify(queueData)}`);

        } catch (error) {
            context.error(`Error processing blob or sending message: ${error.message}`);
        }

        if (blobContent instanceof Buffer) {
            context.log(`Blob content received as Buffer, length: ${blobContent.length}`);
        } else if (typeof blobContent === 'string') {
            context.log(`Blob content received as string, length: ${blobContent.length}`);
        } else {
             context.log(`Blob content received as unexpected type: ${typeof blobContent}`);
        }
    }
});