# Cloudflare Configuration Reference

## 🌐 Current Tunnel Configuration

### Tunnel Details
- **Tunnel ID**: `89792b6f-6990-4591-a529-8982596a2eaf`
- **Config File**: `/etc/cloudflared/config.yml`
- **Service**: `systemctl status cloudflared`

### Domain Routing

| Domain | Target | Container | Port |
|--------|--------|-----------|------|
| `revivatech.co.uk` | `http://127.0.0.1:3010` | `revivatech_new_frontend` | 3010 |
| `www.revivatech.co.uk` | `http://127.0.0.1:3010` | `revivatech_new_frontend` | 3010 |
| `revivatech.com.br` | `http://127.0.0.1:3000` | `website_frontend_pt_dev` | 3000 |
| `www.revivatech.com.br` | `http://127.0.0.1:3000` | `website_frontend_pt_dev` | 3000 |
| `crm.revivatech.com.br` | `http://127.0.0.1:3001` | CRM System | 3001 |
| `crm.revivatech.co.uk` | `http://127.0.0.1:3001` | CRM System | 3001 |

### Configuration Management

```bash
# Validate configuration
cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate

# Test specific route
cloudflared tunnel --config /etc/cloudflared/config.yml ingress rule https://revivatech.co.uk

# Restart tunnel
systemctl restart cloudflared

# Check status and logs
systemctl status cloudflared
journalctl -u cloudflared --tail 20
```

### Account Information
- **Account ID**: `393107996abab7da2c2e393b2e668235`
- **Zone ID (revivatech.co.uk)**: `d7e8be68d4be89b94953dc300cea18d4`

### Management Scripts
- **Audit Script**: `/opt/webapps/revivatech/scripts/cloudflare-audit.sh`
- **Config Files**: `/etc/cloudflared/config.yml` (active configuration)
- **Cinfig Settings**: `/opt/webapps/revivatech/scripts/full-cloudflare-settings-audit.sh`

## 🔄 Making Changes

1. **Edit Configuration**:
   ```bash
   sudo nano /etc/cloudflared/config.yml
   ```

2. **Validate Changes**:
   ```bash
   cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate
   ```

3. **Apply Changes**:
   ```bash
   systemctl restart cloudflared
   ```

4. **Verify**:
   ```bash
   systemctl status cloudflared
   curl -I https://revivatech.co.uk
   ```

## ⚠️ Critical Notes

- Changes take 1-2 minutes to propagate
- Always validate configuration before restarting
- Monitor logs after changes for any errors
- Test both domains after configuration updates