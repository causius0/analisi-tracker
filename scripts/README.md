# Backup and Restore Scripts

Automated backup and restoration scripts for the Analisi Tracker application.

## Scripts Overview

### backup.sh

Creates automated backups of Redis cache, application logs, and configuration files.

**Usage:**
```bash
./scripts/backup.sh [redis|app|all]
```

**Examples:**
```bash
# Backup everything
./scripts/backup.sh all

# Backup only Redis
./scripts/backup.sh redis

# Backup only application data
./scripts/backup.sh app
```

**Schedule with cron:**
```bash
# Daily backup at 2 AM
0 2 * * * /opt/analisi-tracker/scripts/backup.sh all

# Every 6 hours
0 */6 * * * /opt/analisi-tracker/scripts/backup.sh redis
```

**What gets backed up:**
- Redis dump.rdb file (cache data)
- Application logs
- Environment configuration (sanitized - no secrets)
- Optional: PostgreSQL database (if configured)
- Optional: Upload to S3 (if BACKUP_S3_BUCKET is set)

**Retention:** 30 days (configurable via BACKUP_RETENTION_DAYS)

### restore.sh

Restores backups created by backup.sh.

**Usage:**
```bash
./scripts/restore.sh <backup_file>
```

**Examples:**
```bash
# Restore Redis from local backup
./scripts/restore.sh /opt/analisi-tracker/backups/redis/redis-2024-01-01_020000.rdb.gz

# Restore from S3
./scripts/restore.sh s3://my-bucket/analisi-tracker/redis-2024-01-01_020000.rdb.gz

# List available backups
./scripts/restore.sh --list
```

**What gets restored:**
- Redis: Complete cache restoration
- Logs: Application log files
- Environment: Configuration reference (manual update required for secrets)

## Setup Instructions

### 1. Configure Backup Directory

```bash
# Create backup directory
sudo mkdir -p /opt/analisi-tracker/backups

# Set permissions
sudo chown -R appuser:appuser /opt/analisi-tracker/backups
sudo chmod 755 /opt/analisi-tracker/backups
```

### 2. Configure Environment Variables

Add to `.env.production`:

```bash
# Backup Configuration
BACKUP_DIR=/opt/analisi-tracker/backups
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=your-backup-bucket-name  # Optional
```

### 3. Set Up Automated Backups

```bash
# Open crontab
crontab -e

# Add daily backup
0 2 * * * cd /opt/analisi-tracker && ./scripts/backup.sh all >> /var/log/analisi-backup.log 2>&1
```

### 4. Configure S3 Upload (Optional)

If you want to upload backups to AWS S3:

```bash
# Install AWS CLI
sudo apt install awscli -y

# Configure AWS credentials
aws configure

# Set bucket name in .env.production
echo "BACKUP_S3_BUCKET=my-backup-bucket" >> .env.production
```

## Backup File Locations

```
/opt/analisi-tracker/backups/
├── redis/
│   ├── redis-2024-01-01_020000.rdb.gz
│   ├── redis-2024-01-02_020000.rdb.gz
│   └── ...
├── logs/
│   ├── logs-2024-01-01_020000.tar.gz
│   ├── logs-2024-01-02_020000.tar.gz
│   └── ...
├── app/
│   ├── env-2024-01-01_020000.txt
│   ├── env-2024-01-02_020000.txt
│   └── ...
└── backup-report-2024-01-01_020000.txt
```

## Testing Your Backups

### Test Backup Creation

```bash
# Run manual backup
cd /opt/analisi-tracker
./scripts/backup.sh all

# Check output
ls -lh /opt/analisi-tracker/backups/redis/
ls -lh /opt/analisi-tracker/backups/logs/
```

### Test Restoration

**WARNING:** This will overwrite current data!

```bash
# 1. Create test backup
./scripts/backup.sh redis

# 2. Make changes to Redis
docker-compose exec redis redis-cli SET test "before-restore"

# 3. List backups
./scripts/restore.sh --list

# 4. Restore (use latest backup)
./scripts/restore.sh /opt/analisi-tracker/backups/redis/redis-<latest>.rdb.gz

# 5. Verify
docker-compose exec redis redis-cli GET test
# Should return nil if restore worked correctly
```

## Monitoring Backups

### Check Backup Status

```bash
# View latest backup report
cat /opt/analisi-tracker/backups/backup-report-*.txt | tail -1

# Check backup size
du -sh /opt/analisi-tracker/backups/

# Count backup files
find /opt/analisi-tracker/backups -name "*.gz" | wc -l
```

### Monitor Disk Space

```bash
# Check disk usage
df -h /opt/analisi-tracker/backups

# Find large backups
find /opt/analisi-tracker/backups -name "*.gz" -size +100M
```

### Verify Backup Integrity

```bash
# Test gzip integrity
gzip -t /opt/analisi-tracker/backups/redis/redis-*.rdb.gz

# View backup contents (logs)
tar -tzf /opt/analisi-tracker/backups/logs/logs-*.tar.gz
```

## Disaster Recovery Procedures

### Complete System Restoration

```bash
# 1. Deploy fresh server
# 2. Install Docker and dependencies
# 3. Clone repository
# 4. Restore latest backup
./scripts/restore.sh /path/to/latest/redis-backup.rdb.gz
# 5. Start services
docker-compose up -d
# 6. Verify
curl https://your-domain.com/health
```

### Partial Restoration (Redis Only)

```bash
# If Redis cache is corrupted
./scripts/restore.sh /path/to/redis-backup.rdb.gz
```

## Troubleshooting

### Backup Fails with Permission Error

```bash
# Fix permissions
sudo chown -R appuser:appuser /opt/analisi-tracker/backups
sudo chmod 755 /opt/analisi-tracker/backups
```

### Restore Fails - Container Not Running

```bash
# Start Redis container first
docker-compose up -d redis

# Then retry restore
./scripts/restore.sh <backup_file>
```

### S3 Upload Fails

```bash
# Check AWS credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://your-bucket-name

# Check bucket permissions
aws s3api get-bucket-policy --bucket your-bucket-name
```

### Backup Files Not Being Cleaned Up

```bash
# Manual cleanup
find /opt/analisi-tracker/backups -name "*.gz" -mtime +30 -delete

# Verify retention days is set
echo $BACKUP_RETENTION_DAYS
```

## Best Practices

1. **Test Regularly:** Run test restores monthly to verify backups work
2. **Off-site Storage:** Use S3 or similar for off-site backups
3. **Encryption:** Enable S3 bucket encryption for sensitive data
4. **Monitoring:** Set up alerts for backup failures
5. **Documentation:** Document any custom backup procedures
6. **Version Control:** Keep backup scripts in git
7. **Access Control:** Restrict backup directory access to root/appuser only

## Advanced Configuration

### Custom Backup Location

```bash
# Use NAS or external storage
BACKUP_DIR=/mnt/nas/backups/analisi-tracker
```

### Multiple Backup Schedules

```bash
# Hourly Redis backups
0 * * * * /opt/analisi-tracker/scripts/backup.sh redis

# Daily full backups
0 2 * * * /opt/analisi-tracker/scripts/backup.sh all

# Weekly archival
0 3 * * 0 /opt/analisi-tracker/scripts/backup.sh all && aws s3 sync /opt/analisi-tracker/backups s3://archive-bucket/
```

### Backup Rotation Strategy

```bash
# Keep daily backups for 7 days
# Keep weekly backups for 4 weeks
# Keep monthly backups for 12 months

# Add to backup.sh:
# Daily: keep 7 days
find ${BACKUP_DIR} -name "*-daily-*.gz" -mtime +7 -delete

# Weekly: keep 4 weeks
find ${BACKUP_DIR} -name "*-weekly-*.gz" -mtime +28 -delete

# Monthly: keep 12 months
find ${BACKUP_DIR} -name "*-monthly-*.gz" -mtime +365 -delete
```

## Support

For issues or questions:
- Check logs: `/var/log/analisi-backup.log`
- Review backup reports: `/opt/analisi-tracker/backups/backup-report-*.txt`
- Create issue on GitHub

---

**Last Updated:** 2024-01-01
**Version:** 1.0.0
