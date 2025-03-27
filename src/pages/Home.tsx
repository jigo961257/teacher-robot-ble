import { useState } from 'react';

function Home() {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [sendData, setSendData] = useState('');
  const [receivedData, setReceivedData] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discoverDevices = async () => {
    try {
      if (!navigator.bluetooth) {
        setError("Web Bluetooth API is not available in this browser.");
        return;
      }
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access'],
      });
      setDevices((prevDevices) => [...prevDevices, device]);
    } catch (err: any) {
      setError(err.message || "Failed to discover devices.");
    }
  };

  const connectDevice = async (device: BluetoothDevice) => {
    setIsConnecting(true);
    try {
      await device.gatt?.connect();
      setConnectedDevice(device);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to connect to device.");
    } finally {
      setIsConnecting(false);
    }
  };

  const sendBluetoothData = async () => {
    if (!connectedDevice) return;
    try {
      const service = await connectedDevice.gatt?.getPrimaryService('generic_access');
      const characteristic = await service?.getCharacteristic('device_name');
      await characteristic?.writeValue(new TextEncoder().encode(sendData));
    } catch (err: any) {
      setError(err.message || "Failed to send data.");
    }
  };

  const receiveBluetoothData = async () => {
    if (!connectedDevice) return;
    try {
      const service = await connectedDevice.gatt?.getPrimaryService('generic_access');
      const characteristic = await service?.getCharacteristic('device_name');
      await characteristic?.startNotifications();
      characteristic?.addEventListener('characteristicvaluechanged', (event) => {
        // @ts-ignore
        if(event.target && event.target.value){
            // @ts-ignore
            const value = new TextDecoder().decode(event.target.value);
            setReceivedData(value);
        } else {
            setError("Failed to read received data.");
        }
      });
    } catch (err: any) {
      setError(err.message || "Failed to receive data.");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Home</h2>
      {error && <p className="text-red-500">{error}</p>}
      <button onClick={discoverDevices} className="bg-blue-500 text-white p-2 rounded">
        Discover Devices
      </button>
      <div className="border p-4">
        <h3 className="text-lg font-semibold">Discoverable Device List</h3>
        <ul>
          {devices.map((device) => (
            <li key={device.id} className="cursor-pointer hover:underline" onClick={() => connectDevice(device)}>
              {device.name || 'Unknown Device'}
            </li>
          ))}
        </ul>
        {isConnecting && <p>Connecting...</p>}
      </div>
      {connectedDevice && (
        <div className="border p-4">
          <h3 className="text-lg font-semibold">Send/Receive Data</h3>
          <input
            type="text"
            value={sendData}
            onChange={(e) => setSendData(e.target.value)}
            className="border p-2 w-full"
          />
          <button onClick={sendBluetoothData} className="bg-green-500 text-white p-2 rounded mt-2">
            Send Data
          </button>
          <button onClick={receiveBluetoothData} className="bg-green-500 text-white p-2 rounded mt-2">
            Receive Data
          </button>
          <p>Received Data: {receivedData}</p>
        </div>
      )}
    </div>
  );
}

export default Home;