import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';
import { translationsService } from './api/translations';
import { config } from './config';

const socket = io(config.apiBaseUrl);

function App() {
  const [file, setFile] = useState();
  const [targetLanguageCode, setTargetLanguageCode] = useState();
  const [targetLanguageCodeOptions, setTargetLanguageCodeOptions] = useState(
    []
  );
  const [translatedFileUrl, setTranslatedFileUrl] = useState();

  useEffect(() => {
    const fetchSupportedLanguages = async () => {
      const supportedLanguages =
        await translationsService.getSupportedLanguages();
      setTargetLanguageCode(supportedLanguages[0].languageCode);
      setTargetLanguageCodeOptions(supportedLanguages);
    };

    fetchSupportedLanguages();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleTargetLanguageCodeChange = (e) => {
    console.log('e', e);
    setTargetLanguageCode(e.target.value);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const translationJob = await translationsService.createTranslationJob(
      file,
      targetLanguageCode
    );
    socket.emit('translation-job-updates', translationJob.id);
    socket.on('translation-job-updates', (translationJob) => {
      console.log('translation-job-updates translationJob', translationJob);
      if (translationJob.status === 'Done') {
        socket.removeListener('translation-job-updates');
        setTranslatedFileUrl(
          translationsService.getTranslatedFileUrl(translationJob.id)
        );
      }
    });
  };

  return (
    <div>
      <form onSubmit={handleFormSubmit}>
        <input type="file" onChange={handleFileChange} />
        <select
          value={targetLanguageCode}
          onChange={handleTargetLanguageCodeChange}
        >
          {targetLanguageCodeOptions.map((tl) => {
            return (
              <option key={tl.languageCode} value={tl.languageCode}>
                {tl.displayName}
              </option>
            );
          })}
        </select>
        <div>
          <input type="submit" value="submit" />
        </div>
      </form>
      {translatedFileUrl && (
        <div>
          <a href={translatedFileUrl}>Download</a>
        </div>
      )}
    </div>
  );
}

export default App;
