import ngrok from '@ngrok/ngrok'

const makeListener = process.send === undefined;
let host = "localhost";
let port = process.env.PORT || "3000";

process.argv.forEach((item, index) => {
    if (["--hostname", "-H"].includes(item)) host = process.argv[index + 1];
    if (["--port", "-p"].includes(item)) port = process.argv[index + 1];
});

async function setup() {
    const session = await new ngrok.SessionBuilder().authtokenFromEnv().connect();
    const listener = await session.httpEndpoint().listen();
    console.log(`Forwarding to: ${host}:${port} from ingress at: ${listener.url()}`);
    listener.forward(`${host}:${port}`);
}

if (makeListener) setup();