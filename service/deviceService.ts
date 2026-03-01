//import redisHelper from "../utils/redisHelper";

import { prisma } from "../utils/prismaClient";

export const getDevices = async () => {
  try {
    const devices = await prisma.device.findMany();

    return devices;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error obtaining devices");
  }
};

export const getDevice = async (id: string) => {
  try {
    const device = await prisma.device.findUnique({
      where: {
        hostname: id,
      },
    });

    return device;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error obtaining devices");
  }
};

export const createDevice = async (device: any) => {
  try {
    console.log("Creating device", device);

    const newDevice = await prisma.device.create({
      data: device,
    });

    return newDevice;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error creating device");
  }
};

export const deviceExists = async (hostname: string) => {
  try {
    const existingDevice = await prisma.device.findUnique({
      where: {
        hostname: hostname,
      },
    });

    return !!existingDevice;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error checking device existence");
  }
};

export const updateDevice = async (id:string, device: any) => {
  try {
      const updatedDevice = await prisma.device.update({
        where: {
          hostname: id,
        },
        data: device,
      });

      return updatedDevice;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error updating device");
  }
};

export const deleteDevice = async (id: string) => {
  try {
    await prisma.device.delete({
      where: {
        hostname: id,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error deleting device");
  }
};
