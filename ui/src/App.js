import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Button, Content, Form, Hero, Icon } from 'react-bulma-components';
import { translationsService } from './api/translations';
import { config } from './config';

function App() {
  const [file, setFile] = useState(null);
  const [targetLanguageCode, setTargetLanguageCode] = useState('');
  const [supportedTargetLanguages, setSupportedTargetLanguages] = useState([]);
  const [translateJobStatus, setTranslateJobStatus] = useState(null);
  const [translatedFileUrl, setTranslatedFileUrl] = useState(null);

  useEffect(() => {
    const fetchSupportedLanguages = async () => {
      const supportedLanguages =
        await translationsService.getSupportedLanguages();
      setTargetLanguageCode(supportedLanguages[0].languageCode);
      setSupportedTargetLanguages(supportedLanguages);
    };

    fetchSupportedLanguages();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleTargetLanguageCodeChange = (e) => {
    setTargetLanguageCode(e.target.value);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const translationJob = await translationsService.createTranslationJob(
      file,
      targetLanguageCode
    );

    setTranslateJobStatus('InProgress');

    const socket = io(config.apiBaseUrl);

    console.log('emitting translation-job-updates', translationJob.id);

    socket.emit('translation-job-updates', translationJob.id);
    socket.on('translation-job-updates', (translationJobUpdate) => {
      console.log('received translation-job-updates', translationJobUpdate);
      if (translationJobUpdate.status === 'Done') {
        socket.disconnect();
        setTranslateJobStatus(translationJobUpdate.status);
        setTranslatedFileUrl(
          translationsService.getTranslatedFileUrl(translationJobUpdate.id)
        );
      }
    });
  };

  const handleTranslateAnotherFileClick = (e) => {
    setFile(null);
    setTargetLanguageCode('');
    setTranslateJobStatus(null);
    setTranslatedFileUrl(null);
  };

  return (
    <main>
      <Hero size="fullheight" alignItems="center">
        <Hero.Body>
          <form onSubmit={handleFormSubmit}>
            <Content>
              Translate your files with{' '}
              <a
                href="https://cloud.google.com/translate/docs/overview"
                target="_blank"
                rel="noreferrer"
              >
                Google Cloud Translation
              </a>
            </Content>
            {translateJobStatus == null && (
              <Form.Field>
                <Form.Control>
                  <Form.InputFile
                    filename={file && file.name}
                    onChange={handleFileChange}
                    icon={<i className="fas fa-file" />}
                  />
                </Form.Control>
              </Form.Field>
            )}
            {translateJobStatus == null && (
              <Form.Field>
                <Form.Control>
                  <Form.Select
                    name="targetLanguageCode"
                    value={targetLanguageCode}
                    onChange={handleTargetLanguageCodeChange}
                  >
                    {supportedTargetLanguages.map((tl) => {
                      return (
                        <option key={tl.languageCode} value={tl.languageCode}>
                          {tl.displayName}
                        </option>
                      );
                    })}
                  </Form.Select>
                </Form.Control>
              </Form.Field>
            )}
            <Form.Field kind="group">
              <Form.Control>
                {translateJobStatus === null && (
                  <Button submit={true} disabled={!file || !targetLanguageCode}>
                    <Icon>
                      <i className="fas fa-upload" />
                    </Icon>
                    <Content>Translate</Content>
                  </Button>
                )}
                {translateJobStatus === 'InProgress' && (
                  <Button loading={true} />
                )}
                {translateJobStatus === 'Done' && (
                  <Button>
                    <Icon>
                      <i className="fas fa-download" />
                    </Icon>
                    <a href={translatedFileUrl}>Download translation</a>
                  </Button>
                )}
              </Form.Control>
              {translateJobStatus === 'Done' && (
                <Form.Control>
                  <Button onClick={handleTranslateAnotherFileClick}>
                    <Icon>
                      <i className="fas fa-plus" />
                    </Icon>
                    <Content>Translate another file</Content>
                  </Button>
                </Form.Control>
              )}
            </Form.Field>
            <Form.Field>
              <Form.Control textAlign="center">
                <Content>
                  Check out the code on{' '}
                  <a
                    href="https://github.com/marcusmonteirodesouza/google-cloud-translation-playground"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon>
                      <i className="fa-brands fa-github" />
                    </Icon>
                    Github
                  </a>
                </Content>
              </Form.Control>
            </Form.Field>
          </form>
        </Hero.Body>
      </Hero>
    </main>
  );
}

export default App;
