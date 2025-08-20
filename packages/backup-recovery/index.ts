import { prisma } from '@intelagent/database';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';
import extract from 'extract-zip';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

interface BackupConfig {
  schedule?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  retention?: number; // Days to keep backups
  includeFiles?: boolean;
  includeLogs?: boolean;
  encryption?: boolean;
}

interface BackupMetadata {
  id: string;
  timestamp: Date;
  version: string;
  type: 'full' | 'incremental';
  size: number;
  tables: string[];
  checksum: string;
  encrypted: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface RecoveryPoint {
  backupId: string;
  timestamp: Date;
  description: string;
  type: 'automatic' | 'manual';
}

class BackupRecoveryService {
  private s3Client: S3Client | null = null;
  private backupPath: string = process.env.BACKUP_PATH || './backups';
  private encryptionKey: string = process.env.BACKUP_ENCRYPTION_KEY || '';
  private isRunning: boolean = false;

  constructor() {
    this.initializeServices();
    this.setupScheduledBackups();
  }

  private initializeServices() {
    // Initialize S3 for cloud backups
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
    }

    // Ensure local backup directory exists
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  private setupScheduledBackups() {
    // Daily backup at 2 AM
    const schedule = process.env.BACKUP_SCHEDULE || 'daily';
    
    switch (schedule) {
      case 'hourly':
        setInterval(() => this.performBackup('automatic'), 60 * 60 * 1000);
        break;
      case 'daily':
        this.scheduleDaily(() => this.performBackup('automatic'));
        break;
      case 'weekly':
        this.scheduleWeekly(() => this.performBackup('automatic'));
        break;
    }
  }

  private scheduleDaily(callback: () => void) {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(2, 0, 0, 0); // 2 AM
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const timeout = scheduledTime.getTime() - now.getTime();
    setTimeout(() => {
      callback();
      setInterval(callback, 24 * 60 * 60 * 1000); // Every 24 hours
    }, timeout);
  }

  private scheduleWeekly(callback: () => void) {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setDate(scheduledTime.getDate() + (7 - scheduledTime.getDay())); // Next Sunday
    scheduledTime.setHours(2, 0, 0, 0);
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 7);
    }
    
    const timeout = scheduledTime.getTime() - now.getTime();
    setTimeout(() => {
      callback();
      setInterval(callback, 7 * 24 * 60 * 60 * 1000); // Every 7 days
    }, timeout);
  }

  // Main backup function
  async performBackup(
    type: 'automatic' | 'manual' = 'manual',
    config?: BackupConfig
  ): Promise<BackupMetadata> {
    if (this.isRunning) {
      throw new Error('Backup already in progress');
    }

    this.isRunning = true;
    const backupId = `backup_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: new Date(),
      version: '1.0.0',
      type: 'full',
      size: 0,
      tables: [],
      checksum: '',
      encrypted: config?.encryption || false,
      status: 'in_progress'
    };

    try {
      // Create backup directory
      const backupDir = path.join(this.backupPath, backupId);
      await fs.mkdir(backupDir, { recursive: true });

      // Export database data
      console.log('Starting database backup...');
      const tables = await this.exportDatabase(backupDir);
      metadata.tables = tables;

      // Include files if requested
      if (config?.includeFiles) {
        console.log('Backing up files...');
        await this.backupFiles(backupDir);
      }

      // Include logs if requested
      if (config?.includeLogs) {
        console.log('Backing up logs...');
        await this.backupLogs(backupDir);
      }

      // Create archive
      console.log('Creating archive...');
      const archivePath = await this.createArchive(backupDir, backupId);

      // Calculate checksum
      metadata.checksum = await this.calculateChecksum(archivePath);

      // Get file size
      const stats = await fs.stat(archivePath);
      metadata.size = stats.size;

      // Encrypt if required
      if (config?.encryption) {
        console.log('Encrypting backup...');
        await this.encryptBackup(archivePath);
      }

      // Upload to cloud if configured
      if (this.s3Client) {
        console.log('Uploading to cloud...');
        await this.uploadToCloud(archivePath, backupId);
      }

      // Clean up temporary directory
      await fs.rm(backupDir, { recursive: true, force: true });

      // Apply retention policy
      if (config?.retention) {
        await this.applyRetentionPolicy(config.retention);
      }

      metadata.status = 'completed';

      // Store metadata
      await this.storeBackupMetadata(metadata);

      // Log backup completion
      await this.logBackupEvent('backup.completed', metadata);

      console.log(`Backup completed: ${backupId}`);
      return metadata;

    } catch (error) {
      metadata.status = 'failed';
      await this.logBackupEvent('backup.failed', { ...metadata, error: error.message });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async exportDatabase(backupDir: string): Promise<string[]> {
    const tables = [
      'licenses',
      'chatbot_logs',
      'usage_metrics',
      'notifications',
      'ai_insights',
      'organizations',
      'teams',
      'team_members'
    ];

    for (const table of tables) {
      const data = await (prisma as any)[table].findMany();
      const filePath = path.join(backupDir, `${table}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }

    return tables;
  }

  private async backupFiles(backupDir: string): Promise<void> {
    const filesToBackup = [
      'packages',
      'apps/admin-portal/public',
      'apps/customer-portal/public'
    ];

    const filesDir = path.join(backupDir, 'files');
    await fs.mkdir(filesDir, { recursive: true });

    for (const filePath of filesToBackup) {
      const source = path.join(process.cwd(), filePath);
      const dest = path.join(filesDir, path.basename(filePath));
      
      try {
        await this.copyDirectory(source, dest);
      } catch (error) {
        console.error(`Failed to backup ${filePath}:`, error);
      }
    }
  }

  private async backupLogs(backupDir: string): Promise<void> {
    const logsDir = path.join(backupDir, 'logs');
    await fs.mkdir(logsDir, { recursive: true });

    // Export audit logs
    const auditLogs = await prisma.audit_logs.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    await fs.writeFile(
      path.join(logsDir, 'audit_logs.json'),
      JSON.stringify(auditLogs, null, 2)
    );
  }

  private async createArchive(sourceDir: string, backupId: string): Promise<string> {
    const archivePath = path.join(this.backupPath, `${backupId}.zip`);
    const output = createWriteStream(archivePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(archivePath));
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    
    for await (const chunk of stream) {
      hash.update(chunk);
    }
    
    return hash.digest('hex');
  }

  private async encryptBackup(filePath: string): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    const input = createReadStream(filePath);
    const output = createWriteStream(`${filePath}.enc`);

    await pipeline(input, cipher, output);
    
    // Replace original with encrypted
    await fs.unlink(filePath);
    await fs.rename(`${filePath}.enc`, filePath);
  }

  private async uploadToCloud(filePath: string, backupId: string): Promise<void> {
    if (!this.s3Client) return;

    const fileContent = await fs.readFile(filePath);
    
    const command = new PutObjectCommand({
      Bucket: process.env.BACKUP_BUCKET || 'intelagent-backups',
      Key: `backups/${backupId}.zip`,
      Body: fileContent,
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD_IA'
    });

    await this.s3Client.send(command);
  }

  // Recovery functions
  async performRecovery(backupId: string, options?: {
    tables?: string[];
    skipValidation?: boolean;
    targetTime?: Date;
  }): Promise<void> {
    console.log(`Starting recovery from backup: ${backupId}`);

    try {
      // Download backup if in cloud
      const backupPath = await this.retrieveBackup(backupId);

      // Verify checksum
      if (!options?.skipValidation) {
        const metadata = await this.getBackupMetadata(backupId);
        const checksum = await this.calculateChecksum(backupPath);
        
        if (checksum !== metadata.checksum) {
          throw new Error('Backup integrity check failed');
        }
      }

      // Decrypt if needed
      if (backupPath.endsWith('.enc')) {
        await this.decryptBackup(backupPath);
      }

      // Extract archive
      const extractDir = path.join(this.backupPath, 'recovery', backupId);
      await fs.mkdir(extractDir, { recursive: true });
      await extract(backupPath, { dir: extractDir });

      // Restore database
      await this.restoreDatabase(extractDir, options?.tables);

      // Restore files if present
      const filesDir = path.join(extractDir, 'files');
      if (await this.directoryExists(filesDir)) {
        await this.restoreFiles(filesDir);
      }

      // Clean up
      await fs.rm(extractDir, { recursive: true, force: true });

      // Log recovery
      await this.logBackupEvent('recovery.completed', { backupId, options });

      console.log('Recovery completed successfully');

    } catch (error) {
      await this.logBackupEvent('recovery.failed', { backupId, error: error.message });
      throw error;
    }
  }

  private async retrieveBackup(backupId: string): Promise<string> {
    const localPath = path.join(this.backupPath, `${backupId}.zip`);
    
    // Check if exists locally
    if (await this.fileExists(localPath)) {
      return localPath;
    }

    // Download from cloud
    if (this.s3Client) {
      const command = new GetObjectCommand({
        Bucket: process.env.BACKUP_BUCKET || 'intelagent-backups',
        Key: `backups/${backupId}.zip`
      });

      const response = await this.s3Client.send(command);
      const stream = response.Body as any;
      
      const output = createWriteStream(localPath);
      await pipeline(stream, output);
      
      return localPath;
    }

    throw new Error('Backup not found');
  }

  private async decryptBackup(filePath: string): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    const input = createReadStream(filePath);
    const output = createWriteStream(filePath.replace('.enc', ''));

    await pipeline(input, decipher, output);
    
    await fs.unlink(filePath);
  }

  private async restoreDatabase(backupDir: string, tables?: string[]): Promise<void> {
    const tablesToRestore = tables || [
      'licenses',
      'chatbot_logs',
      'usage_metrics',
      'notifications',
      'ai_insights',
      'organizations',
      'teams',
      'team_members'
    ];

    for (const table of tablesToRestore) {
      const filePath = path.join(backupDir, `${table}.json`);
      
      if (!await this.fileExists(filePath)) {
        console.warn(`Backup file for table ${table} not found`);
        continue;
      }

      const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      
      // Clear existing data (be careful in production!)
      await (prisma as any)[table].deleteMany({});
      
      // Restore data
      if (data.length > 0) {
        await (prisma as any)[table].createMany({ data });
      }
      
      console.log(`Restored ${data.length} records to ${table}`);
    }
  }

  private async restoreFiles(filesDir: string): Promise<void> {
    // Implementation for restoring files
    console.log('File restoration not implemented in this demo');
  }

  // Utility functions
  private async applyRetentionPolicy(retentionDays: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // List local backups
    const files = await fs.readdir(this.backupPath);
    
    for (const file of files) {
      if (!file.endsWith('.zip')) continue;
      
      const filePath = path.join(this.backupPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        console.log(`Deleted old backup: ${file}`);
      }
    }

    // Clean cloud backups if configured
    if (this.s3Client) {
      const command = new ListObjectsV2Command({
        Bucket: process.env.BACKUP_BUCKET || 'intelagent-backups',
        Prefix: 'backups/'
      });

      const response = await this.s3Client.send(command);
      
      // Implementation for S3 cleanup
    }
  }

  private async storeBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const metadataPath = path.join(this.backupPath, 'metadata.json');
    
    let existingMetadata: BackupMetadata[] = [];
    if (await this.fileExists(metadataPath)) {
      existingMetadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    }
    
    existingMetadata.push(metadata);
    await fs.writeFile(metadataPath, JSON.stringify(existingMetadata, null, 2));
  }

  private async getBackupMetadata(backupId: string): Promise<BackupMetadata> {
    const metadataPath = path.join(this.backupPath, 'metadata.json');
    
    if (!await this.fileExists(metadataPath)) {
      throw new Error('Metadata file not found');
    }
    
    const metadata: BackupMetadata[] = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
    const backup = metadata.find(m => m.id === backupId);
    
    if (!backup) {
      throw new Error('Backup metadata not found');
    }
    
    return backup;
  }

  async listBackups(): Promise<BackupMetadata[]> {
    const metadataPath = path.join(this.backupPath, 'metadata.json');
    
    if (!await this.fileExists(metadataPath)) {
      return [];
    }
    
    return JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
  }

  private async logBackupEvent(event: string, data: any): Promise<void> {
    await prisma.audit_logs.create({
      data: {
        organization_id: null,
        license_key: 'SYSTEM',
        user_id: null,
        action: event,
        resource_type: 'backup',
        resource_id: data.id || data.backupId,
        changes: data,
        created_at: new Date()
      }
    });
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async directoryExists(path: string): Promise<boolean> {
    try {
      const stats = await fs.stat(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private async copyDirectory(source: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

// Singleton instance
const backupRecovery = new BackupRecoveryService();

export { 
  backupRecovery, 
  BackupRecoveryService, 
  BackupConfig, 
  BackupMetadata, 
  RecoveryPoint 
};