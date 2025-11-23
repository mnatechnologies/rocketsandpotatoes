const isDev = process.env.NODE_ENV !== 'production';

async function setup() {
    const session = await new ngrok.SessionBuilder().authtokenFromEnv().connect();
    const listener = await session.httpEndpoint().listen();
    console.log(`Forwarding to: ${host}:${port} from ingress at: ${listener.url()}`);
    listener.forward(`${host}:${port}`);
}

if (isDev) {
    setup();
}