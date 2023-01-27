import {app} from './app';
import {config} from './config';

app.listen(config.port, () => {
  console.log(
    `Google Translation Playground server listening on port ${config.port}...`
  );
});
