import "dotenv/config";
import fs from "fs/promises";

export class Options {
    public static async fromEnv(): Promise<Options> {
        const port: number = process.env.PORT as unknown as number;
        const host: string = process.env.LND_HOST;
        const macaroon: Buffer = await fs.readFile(process.env.LND_READONLY_MACAROON_PATH);
        const cert: Buffer = await fs.readFile(process.env.LND_CERT_PATH);

        return new Options(port, host, macaroon, cert);
    }

    constructor(
        readonly port: number,
        readonly lndHost: string,
        readonly lndReadonlyMacaroon: Buffer,
        readonly lndCert: Buffer,
    ) {
        // this.port = port;
        // this.lndHost = lndHost;
        // this.lndReadonlyMacaroon = lndReadonlyMacaroon;
        // this.lndCert = lndCert;
    }
}
