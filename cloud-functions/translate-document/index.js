const functions = require("@google-cloud/functions-framework");
const { Storage } = require("@google-cloud/storage");
const { TranslationServiceClient } = require("@google-cloud/translate").v3beta1;
const Joi = require("joi");

const storage = new Storage();

const translationClient = new TranslationServiceClient();

functions.cloudEvent("translateDocument", async (cloudEvent) => {
  const envVarsSchema = Joi.object()
    .keys({
      REGION: Joi.string().required(),
      TARGET_LANGUAGE_CODES: Joi.string().required(),
    })
    .unknown();

  const { value: envVars, error: envVarsError } = envVarsSchema.validate(
    process.env
  );

  if (envVarsError) {
    throw envVarsError;
  }

  const projectId = await translationClient.getProjectId();

  const file = cloudEvent.data;

  console.log("Received file", file);

  const fileDownloadResponse = await storage
    .bucket(file.bucket)
    .file(file.name)
    .download();

  const fileContents = fileDownloadResponse.toString();

  // See https://cloud.google.com/translate/quotas#content
  const detectLanguageContentSize = 5000;

  const [detectLanguageResponse] = await translationClient.detectLanguage({
    parent: `projects/${projectId}`,
    content: fileContents.substring(0, detectLanguageContentSize),
  });

  const sourceLanguageCode = detectLanguageResponse.languages.reduce(
    (prev, current) => (prev.confidence > current.confidence ? prev : current)
  )["languageCode"];

  console.log(
    `Detected the ${file.name} file languageCode:`,
    sourceLanguageCode
  );

  const targetLanguageCodes = envVars.TARGET_LANGUAGE_CODES.split(",").filter(
    (languageCode) => languageCode !== sourceLanguageCode
  );

  for (const targetLanguageCode of targetLanguageCodes) {
    console.log(`Translating ${file.name} to ${targetLanguageCode}...`);
    const [translateDocumentResponse] =
      await translationClient.translateDocument({
        parent: translationClient.locationPath(projectId, envVars.REGION),
        documentInputConfig: {
          gcsSource: {
            inputUri: `gs://${file.bucket}/${file.name}`,
          },
        },
        sourceLanguageCode,
        targetLanguageCode,
      });
    console.log("translateDocumentResponse", translateDocumentResponse);
  }
});
