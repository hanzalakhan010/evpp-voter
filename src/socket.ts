import { io } from "socket.io-client";
import { host } from "./constants";


export const socket = io(host, {
  transports: ["websocket"],
  autoConnect: true,
  withCredentials: true,
});
