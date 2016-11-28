https://www.npmjs.com/package/pg
http://code.runnable.com/U0sU598vXio2uD-1/example-reading-form-input-with-express-4-0-and-body-parser-for-node-js
https://scotch.io/tutorials/use-expressjs-to-get-url-and-post-parameters
http://superuser.com/questions/149329/what-is-the-curl-command-line-syntax-to-do-a-post-request


npm init -f
npm install --save express
npm install body-parser --save
npm install pg --save
node index.js


docker run --name some-postgres \
           --env POSTGRES_PASSWORD=pwd \
           --detach \
           postgres



docker run --interactive \
           --tty \
           --rm \
           --link some-postgres:postgres \
           postgres psql -h postgres -U postgres

DROP TABLE message;

CREATE TABLE message (
	username text,
	message text
);

INSERT INTO message (username,message) values ('philips3', 'This is Philip''s test message');
INSERT INTO message (username,message) values ('lewpenks5','This is Lewpen''s test message');

SELECT * FROM message;

CTRL-D

docker run --name node-web-app \
           --interactive \
           --rm \
           -p 3000:3000 \
           --volume /Users/pschwarz/Documents/sefaira/prep/node-web-app-hello-world:/usr/src/myapp \
           --workdir /usr/src/myapp \
           --link some-postgres:postgres \
           node:latest \
           node index.js


docker ps -a
docker stop node-web-app

http://localhost:3000/messages
==> [{"username":"philips3","message":"This is Philip's test message"},{"username":"lewpenks5","message":"This is Lewpen's test message"}]