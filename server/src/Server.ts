import bodyParser from "body-parser";
import compression from "compression";
import express from "express";
import path from "path";
import serveStatic from "serve-static";
import { graphApi } from "./api/GraphApi";
import { IGraphService } from "./domain/IGraphService";
import { LndGraphService } from "./domain/lnd/LndGraphService";
import { LndRestClient } from "./domain/lnd/LndRestClient";
import { Lnd } from "./domain/lnd/LndRestTypes";
import { Options } from "./Options";
import { SocketServer } from "./SocketServer";

async function run() {
    // construct the options
    const options = await Options.fromEnv();

    // Exercise: using the Options defined above, construct an instance
    // of the LndRestClient using the options.
    const lnd: LndRestClient = undefined;

    // construct an IGraphService for use by the application
    const graphAdapter: IGraphService = new LndGraphService(lnd);

    // construction the server
    const app: express.Express = express();

    // mount json / compression middleware
    app.use(bodyParser.json());
    app.use(compression());

    app.use("/public", serveStatic(path.join(__dirname, "../public")));
    app.use("/public/app", serveStatic(path.join(__dirname, "../../client/dist/app")));
    app.use("/public/css", serveStatic(path.join(__dirname, "../../style/dist/css")));

    // mount the root to render our default webpage which will load the react app
    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "../public/index.html"));
    });

    // mount our API routers
    app.use(graphApi(graphAdapter));

    // start server
    const server = app.listen(options.port, () => {
        console.log(`server listening on ${options.port}`);
    });

    const socketServer = new SocketServer();
    socketServer.listen(server);

    graphAdapter.on("update", (update: Lnd.GraphUpdate) => {
        socketServer.broadcast("graph", update);
    })

    graphAdapter.subscribeGraph()
}

run().catch(ex => {
    console.error(ex);
    process.exit(1);
});
