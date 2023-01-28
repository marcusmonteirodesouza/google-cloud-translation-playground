import {server} from './app';
import {config} from './config';

server.listen(config.port, () => {
  console.log(
    `Google Translation Playground server listening on port ${config.port}...`
  );
});
