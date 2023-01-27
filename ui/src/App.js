import { useEffect, useState } from 'react';
import './App.css';
import { translationsService } from './api/translations';

function App() {
  const [file, setFile] = useState();
  const [targetLanguageCode, setTargetLanguageCode] = useState();
  const [targetLanguageCodeOptions, setTargetLanguageCodeOptions] = useState(
    []
  );

  useEffect(() => {
    const fetchSupportedLanguages = async () => {
      const supportedLanguages =
        await translationsService.getSupportedLanguages();
      setTargetLanguageCode(supportedLanguages[0]);
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
    await translationsService.createTranslationJob(file, targetLanguageCode);
  };

  return (
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
  );
}

export default App;
