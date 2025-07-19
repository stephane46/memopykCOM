import { NodeSSH } from 'node-ssh';

interface TunnelConfig {
  host: string;
  username: string;
  privateKey?: string;
  password?: string;
  localPort: number;
  remotePort: number;
  remoteHost: string;
}

class SSHTunnel {
  private ssh: NodeSSH;
  private config: TunnelConfig;
  private tunnel: any;
  private isConnected: boolean = false;

  constructor(config: TunnelConfig) {
    this.ssh = new NodeSSH();
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      console.log(`Connecting SSH tunnel to ${this.config.host}...`);
      
      const connectionConfig: any = {
        host: this.config.host,
        username: this.config.username,
      };

      // Try password first, then private key
      if (this.config.password) {
        connectionConfig.password = this.config.password;
        console.log('Using password authentication');
      } else if (this.config.privateKey) {
        // Convert private key format if needed
        let privateKey = this.config.privateKey;
        if (privateKey.includes('-----BEGIN OPENSSH PRIVATE KEY-----')) {
          privateKey = privateKey.replace(/\\n/g, '\n');
        }
        connectionConfig.privateKey = privateKey;
        console.log('Using private key authentication');
      }

      await this.ssh.connect(connectionConfig);
      
      // Use forwardOut instead of forwardIn for local port forwarding
      this.tunnel = await this.ssh.forwardOut(
        'localhost',
        this.config.localPort,
        this.config.remoteHost,
        this.config.remotePort
      );

      this.isConnected = true;
      console.log(`SSH tunnel established: localhost:${this.config.localPort} -> ${this.config.remoteHost}:${this.config.remotePort}`);
    } catch (error) {
      console.error('SSH tunnel connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.tunnel) {
      this.tunnel.close();
    }
    if (this.ssh.isConnected()) {
      this.ssh.dispose();
    }
    this.isConnected = false;
    console.log('SSH tunnel disconnected');
  }

  isActive(): boolean {
    return this.isConnected && this.ssh.isConnected();
  }
}

// Database tunnel configuration
const createDatabaseTunnel = (): SSHTunnel => {
  const config: TunnelConfig = {
    host: '82.29.168.136',
    username: 'root',
    password: process.env.SSH_PASSWORD,
    privateKey: process.env.SSH_PRIVATE_KEY,
    localPort: 15432, // Use different local port to avoid conflicts
    remotePort: 5432,
    remoteHost: 'localhost', // Connect to localhost on the remote server
  };

  return new SSHTunnel(config);
};

export { SSHTunnel, createDatabaseTunnel };