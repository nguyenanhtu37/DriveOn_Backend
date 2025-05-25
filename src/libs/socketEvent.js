import { getIO } from "./socket.js";

export const sendSocketEvent = (event, data, garage) => {
  console.log(
    `Sending socket event: ${event} with data:`,
    data,
    `to garage: ${garage}`
  );

  const io = getIO();
  io.to(garage).emit(event, data);
};
