import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import "./App.css";
import Login from "./components/Login";
import Vote from "./components/Vote";
import { notifySuccess } from "./notification";
import { socket } from "./socket";

interface Credentials {
  electorId: string,
  electorCode: string
}

function App() {
  const [login, setLogin] = useState(false);
  const [credentials, setCredentials] = useState<Credentials>({ electorCode: '', electorId: '' });
  const [mappingId, setMappingId] = useState<string | null>(null);

  useEffect(() => {
    const onConnect = () => {
      socket.emit("connect-voter", { userAgent: navigator.userAgent });
    };

    const handleMappingId = (data: { mapping_id: string }) => {
      setMappingId(data.mapping_id);
    };

    const handleTerminalConnect = () => {
      notifySuccess("Terminal connected");
    };

    const handleReceiveCredentials = (data: { elector_id: string, elector_code: string }) => {
      setCredentials({ electorId: data.elector_id, electorCode: data.elector_code });
      notifySuccess("Credentials received from terminal");
    };

    // Listeners
    socket.on("connect", onConnect);
    socket.on("mapping-id", handleMappingId);
    socket.on("voter-terminal-connect", handleTerminalConnect);
    socket.on('receive-credentials', handleReceiveCredentials);

    // Initial check (if already connected before this effect runs)
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("mapping-id", handleMappingId);
      socket.off("voter-terminal-connect", handleTerminalConnect);
      socket.off('receive-credentials', handleReceiveCredentials);
    };
  }, []);

  return (
    <>
      {login ? <Vote setLogin={setLogin} /> : <Login setLogin={setLogin} credentials={credentials} setCredentials={setCredentials} mappingId={mappingId} />}
      <Toaster position="bottom-right" reverseOrder={false} toastOptions={{
        style: {
          borderRadius: '8px',
          background: '#333',
          color: '#fff',
        },
        duration: 3000,
      }} />
    </>
  );
}

export default App;
