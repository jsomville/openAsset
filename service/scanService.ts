import redisHelper from '../utils/redisHelper'

export const createScan = async (scan: any) => {
    try {
        //Must Add a scan to the database

        await redisHelper.set("scan", JSON.stringify(scan), redisHelper.TTL.long);

    } catch (error:unknown) {
          const message = error instanceof Error ? error.message : String(error);
        console.error(message, error);
        throw new Error("Error creating scan");
    }
};