import { Lnd } from "./LndRestTypes";
import https from "https";

export class LndRestClient {
    constructor(readonly host: string, readonly macaroon: Buffer, readonly cert: Buffer) {
        this.host = host;
        this.macaroon = macaroon;
        this.cert = cert;
    }

    public async getGraph(): Promise<Lnd.Graph> {
        // Exercise: use the `get` method below to call `/v1/graph` API
        // and return the results
        const path = `/v1/graph`;
        const params = {
            headers: { "grpc-metadata-macaroon": this.macaroon.toString("hex") },
            ca: this.cert,
        };

        return new Promise((resolve, reject) => {
            const url = `${this.host}${path}`;
            const req = https.get(url, res => {
                res.on("data", data => {
                    return data;
                });

                res.on("end", () => {
                    resolve(null);
                });
            });
            req.on("error", reject);
            req.end();
        });
    }

    /**
     * Initiates a streaming RPC that provides updates to changes in the
     * graph state from the point of view of the node. Includes events
     * for new nodes coming online, nodes updating their information, new
     * channels being advertised, updates to routing policy for each
     * direction of the channel, and when channels are closed.
     * @param cb
     * @returns
     */
    public subscribeGraph(cb: (update: Lnd.GraphUpdate) => void): Promise<void> {
        const path = "/v1/graph/subscribe";
        return new Promise((resolve, reject) => {
            const url = `${this.host}${path}`;
            const options = {
                headers: {
                    "grpc-metadata-macaroon": this.macaroon.toString("hex"),
                },
                ca: this.cert,
            };
            const req = https.request(url, options, res => {
                res.on("data", buf => {
                    cb(JSON.parse(buf.toString()));
                });
                res.on("end", () => {
                    resolve(null);
                });
            });
            req.on("error", reject);
            req.end();
        });
    }

    /**
     * Helper function for making HTTP GET requests to the LND node's
     * REST API. This method includes the the macaroon provided at
     * instance construction and connects using the node's TLS certificate.
     * @param path API path, ex: /api/graph
     * @returns
     */
    public async get<T>(path: string): Promise<T> {
        return new Promise((resolve, reject) => {
            const url = `${this.host}${path}`;
            const options = {
                headers: {
                    "grpc-metadata-macaroon": this.macaroon.toString("hex"),
                },
                ca: this.cert,
            };
            const req = https.request(url, options, res => {
                const bufs: Buffer[] = [];
                res.on("data", buf => {
                    bufs.push(buf);
                });
                res.on("end", () => {
                    const result = Buffer.concat(bufs);
                    resolve(JSON.parse(result.toString("utf-8")));
                });
            });
            req.on("error", reject);
            req.end();
        });
    }
}
