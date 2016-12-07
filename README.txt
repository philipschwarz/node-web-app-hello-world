
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
    id SERIAL,
	username text,
	message text
);

INSERT INTO message (username,message) values ('philips3', 'This is Philip''s test message');
INSERT INTO message (username,message) values ('lewpenks5','This is Lewpen''s test message');

SELECT * FROM message;

CTRL-D

docker run --detach \
          -p 5672:5672 \
          -p 15672:15672 \
          -p 25672:25672 \
          -p 4369:4369 \
          --volume /Users/pschwarz/rabbitmq/data/log:/data/log \
          --volume /Users/pschwarz/rabbitmq/data/mnesia:/data/mnesia \
          --name rabbitmq \
          rabbitmq

docker exec rabbitmq rabbitmq-plugins enable rabbitmq_management

        The following plugins have been enabled:
          mochiweb
          webmachine
          rabbitmq_web_dispatch
          amqp_client
          rabbitmq_management_agent
          rabbitmq_management

go to http://localhost:15672/ for management app

docker inspect --format='{{.NetworkSettings.IPAddress}}' rabbitmq

docker run --name node-web-app \
           --interactive \
           --rm \
           -p 3000:3000 \
           --volume /Users/pschwarz/Documents/sefaira/prep/node-web-app-hello-world:/usr/src/myapp \
           --workdir /usr/src/myapp \
           --link some-postgres:postgres \
           --link rabbitmq:rabbitmq \
           node:latest \
           node index.js

docker run --name node-receive-app \
           --interactive \
           --rm \
           --volume /Users/pschwarz/Documents/sefaira/prep/node-web-app-hello-world:/usr/src/myapp \
           --workdir /usr/src/myapp \
           --link rabbitmq:rabbitmq \
           node:latest \
           node receive.js

https://github.com/forty9ten/docker-rabbitmq-example

docker run "helloworld-ecr:1.0" \
            --interactive \
            --rm \
            --env RABBITMQ_PORT_5672_TCP_ADDR=172.17.0.2 \
            --volume /Users/pschwarz/Documents/sefaira/prep/scala-akka-rabbitmq-client:/usr/src/myapp \
            --workdir /usr/src/myapp \
            --link rabbitmq:rabbitmq

go to http://localhost:15672/#/

    see Queued messages
    see Message rates

go to http://localhost:15672/#/connections

    see 1 running connection with username guest

go to http://localhost:15672/#/channels

    see 2 running channels
    one publishes 1 message per second
    the other gets 1 message per second

go to http://localhost:15672/#/exchanges

    see one exchange called amq.fanout in use

go to http://localhost:15672/#/queues

    see two running queues