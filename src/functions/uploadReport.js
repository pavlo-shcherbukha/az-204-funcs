import { app } from "@azure/functions"; 

app.http('uploadReport', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http method:  ${request.method}`);
        context.log(`Http url: ${request.url}`);
        context.log("========================================");
        context.log('Headers:', Object.fromEntries(request.headers));
        context.log("========================================");

        if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
            return { status: 400, jsonBody: { ok: false, message: 'Content-Type must be multipart/form-data' }};
        }

        // ОТРИМУЄМО FormData
        const formData = await request.formData();
        // Текстове поле
        const reportDate = formData.get('reportDate');
        // Файл
        const reportFile = formData.get('reportFile'); // це File-об'єкт
        // Для текстових файлів можна прочитати так:
        let fileContent = null;
        if (reportFile) {
            fileContent = await reportFile.text(); // або .arrayBuffer() для бінарних
        }

        context.log('reportDate:', reportDate);
        context.log('reportFile:', reportFile ? {
            name: reportFile.name,
            size: reportFile.size,
            type: reportFile.type
        } : null);

        return {
            status: 200,
            jsonBody: {
                ok: true,
                reportDate,
                file: reportFile ? {
                    name: reportFile.name,
                    size: reportFile.size,
                    type: reportFile.type,
                    content: fileContent // для текстових файлів
                } : null
            }
        };
    }
});